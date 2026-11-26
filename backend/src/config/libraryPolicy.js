// Library policy values agreed by the team.
// Change a value here and every part of the backend uses it.
module.exports = {
    // Days a student can keep a borrowed book
    BORROWING_DAYS: 14,

    // Days to collect a reservation after it is marked "Ready for Pickup"
    PICKUP_DEADLINE_DAYS: 2,

    // Renewal rules
    MAX_RENEWALS: 1,
    RENEWAL_DAYS: 7,

    // Students with overdue books cannot reserve or borrow new books
    BLOCK_NEW_RESERVATIONS_WHEN_OVERDUE: true
};
