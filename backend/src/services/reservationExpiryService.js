
const db = require('../config/db');
const policy = require('../config/libraryPolicy');

const CHECK_INTERVAL_MS = 60 * 1000;
const BATCH_SIZE = 100;

let expiryInterval = null;
let isRunning = false;

// ==========================================
// PROCESS ONE EXPIRED RESERVATION
// ==========================================

const processOneExpiredReservation = async (reservationId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Lock and recheck the reservation.
        const [reservations] = await connection.execute(
            `SELECT
                reservation_id,
                student_id,
                book_id,
                copy_id
             FROM Reservations
             WHERE reservation_id = ?
               AND status = 'ready_for_pickup'
               AND pickup_deadline IS NOT NULL
               AND pickup_deadline <= NOW()
             FOR UPDATE`,
            [reservationId]
        );

        // Another operation may already have handled this reservation.
        if (reservations.length === 0) {
            await connection.rollback();
            return false;
        }

        const reservation = reservations[0];

        // 2. Lock the allocated physical copy, if one exists.
        let copy = null;

        if (reservation.copy_id) {
            const [copies] = await connection.execute(
                `SELECT copy_id, book_id, status
                 FROM BookCopies
                 WHERE copy_id = ?
                 FOR UPDATE`,
                [reservation.copy_id]
            );

            copy = copies[0] || null;
        }

        // 3. Mark the original reservation as expired.
        await connection.execute(
            `UPDATE Reservations
             SET status = 'expired'
             WHERE reservation_id = ?
               AND status = 'ready_for_pickup'`,
            [reservationId]
        );

        let nextReservationId = null;
        let nextStudentId = null;
        let copyReleased = false;

        // 4. Only reallocate a copy that is still reserved
        // and belongs to the same book.
        if (
            copy &&
            Number(copy.book_id) === Number(reservation.book_id) &&
            copy.status === 'reserved'
        ) {
            // 5. Find the next eligible student in FIFO order.
            const [waitingReservations] = await connection.execute(
                `SELECT
                    r.reservation_id,
                    r.student_id
                 FROM Reservations r
                 JOIN Users u ON u.user_id = r.student_id
                 WHERE r.book_id = ?
                   AND r.status = 'waiting'
                   AND u.role = 'student'
                   AND u.is_active = 1

                   AND NOT EXISTS (
                       SELECT 1
                       FROM Borrowings existing
                       JOIN BookCopies existingCopy
                         ON existingCopy.copy_id = existing.copy_id
                       WHERE existing.student_id = r.student_id
                         AND existingCopy.book_id = r.book_id
                         AND existing.status IN ('borrowed', 'overdue')
                         AND existing.returned_at IS NULL
                   )

                   AND (
                       ? = 0
                       OR NOT EXISTS (
                           SELECT 1
                           FROM Borrowings overdueLoan
                           WHERE overdueLoan.student_id = r.student_id
                             AND overdueLoan.status IN ('borrowed', 'overdue')
                             AND overdueLoan.returned_at IS NULL
                             AND overdueLoan.due_date < NOW()
                       )
                   )

                 ORDER BY r.reserved_at ASC, r.reservation_id ASC
                 LIMIT 1
                 FOR UPDATE`,
                [
                    reservation.book_id,
                    policy.BLOCK_NEW_RESERVATIONS_WHEN_OVERDUE ? 1 : 0
                ]
            );

            const nextReservation = waitingReservations[0] || null;

            // 6. Allocate the copy to the next eligible student.
            if (nextReservation) {
                const [updateResult] = await connection.execute(
                    `UPDATE Reservations
                     SET copy_id = ?,
                         status = 'ready_for_pickup',
                         ready_at = NOW(),
                         pickup_deadline = DATE_ADD(
                             NOW(),
                             INTERVAL ? DAY
                         )
                     WHERE reservation_id = ?
                       AND status = 'waiting'`,
                    [
                        reservation.copy_id,
                        policy.PICKUP_DEADLINE_DAYS,
                        nextReservation.reservation_id
                    ]
                );

                if (updateResult.affectedRows === 1) {
                    nextReservationId = nextReservation.reservation_id;
                    nextStudentId = nextReservation.student_id;

                    // The copy remains reserved for the next student.
                    await connection.execute(
                        `UPDATE BookCopies
                         SET status = 'reserved'
                         WHERE copy_id = ?`,
                        [reservation.copy_id]
                    );

                    // Notify the next student.
                    await connection.execute(
                        `INSERT INTO Notifications
                            (user_id, notification_type, title, message,
                             related_type, related_id)
                         VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
                        [
                            nextStudentId,
                            'Book ready for pickup',
                            `A book you reserved is now ready for collection. Please collect it within ${policy.PICKUP_DEADLINE_DAYS} days.`,
                            nextReservationId
                        ]
                    );
                }
            }

            // 7. If nobody eligible received the copy,
            // make the physical copy available.
            if (!nextReservationId) {
                await connection.execute(
                    `UPDATE BookCopies
                     SET status = 'available'
                     WHERE copy_id = ?`,
                    [reservation.copy_id]
                );

                copyReleased = true;
            }
        }

// 8. Notify the student whose reservation expired.
await connection.execute(
    `INSERT INTO Notifications
        (user_id, notification_type, title, message,
         related_type, related_id)
     VALUES (?, 'reservation', ?, ?, 'reservation', ?)`,
    [
        reservation.student_id,
        'Reservation expired',
        'Your pickup deadline has passed. The reserved book copy has been released according to library policy.',
        reservationId
    ]
);


        // 9. Commit all changes together.
        await connection.commit();

        console.log(
            `[RESERVATION EXPIRY] Reservation ${reservationId} expired.` +
            (nextReservationId
                ? ` Copy allocated to reservation ${nextReservationId}.`
                : copyReleased
                    ? ' Copy released.'
                    : ' No copy reallocated.')
        );

        return true;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// ==========================================
// CHECK AND PROCESS EXPIRED RESERVATIONS
// ==========================================

const processExpiredReservations = async () => {
    const [expiredReservations] = await db.execute(
        `SELECT reservation_id
         FROM Reservations
         WHERE status = 'ready_for_pickup'
           AND pickup_deadline IS NOT NULL
           AND pickup_deadline <= NOW()
         ORDER BY pickup_deadline ASC, reservation_id ASC
         LIMIT ?`,
        [BATCH_SIZE]
    );

    let processedCount = 0;

    for (const reservation of expiredReservations) {
        try {
            const processed = await processOneExpiredReservation(
                reservation.reservation_id
            );

            if (processed) {
                processedCount++;
            }

        } catch (error) {
            console.error(
                `[RESERVATION EXPIRY] Failed to process reservation ${reservation.reservation_id}:`,
                error.message
            );
        }
    }

    if (processedCount > 0) {
        console.log(
            `[RESERVATION EXPIRY] Successfully processed ${processedCount} expired reservation(s).`
        );
    }

    return processedCount;
};

// ==========================================
// START BACKGROUND EXPIRY PROCESS
// ==========================================

const startReservationExpiryJob = () => {
    // Prevent duplicate background jobs in this process.
    if (expiryInterval) {
        console.log('[RESERVATION EXPIRY] Background job is already running.');
        return;
    }

    const runExpiryCheck = async () => {
        // Prevent overlapping checks.
        if (isRunning) {
            return;
        }

        isRunning = true;

        try {
            await processExpiredReservations();
        } catch (error) {
            console.error(
                '[RESERVATION EXPIRY] Background check failed:',
                error.message
            );
        } finally {
            isRunning = false;
        }
    };

    console.log(
        '[RESERVATION EXPIRY] Background job started. Checking every 60 seconds.'
    );

    // Run once immediately when the server starts.
    runExpiryCheck();

    // Then check periodically.
    expiryInterval = setInterval(
        runExpiryCheck,
        CHECK_INTERVAL_MS
    );
};

module.exports = {
    startReservationExpiryJob,
    processExpiredReservations
};