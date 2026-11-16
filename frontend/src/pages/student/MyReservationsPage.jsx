import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, MapPin } from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import {
  cancelReservation,
  getMyReservations,
} from "../../services/studentService";

import "./MyReservationsPage.css";

const STATUS_LABELS = {
  pending: "Pending",
  waiting: "Waiting list",
  ready_for_pickup: "Ready for pickup",
  completed: "Collected",
  expired: "Expired",
  cancelled: "Cancelled",
};

const ACTIVE = ["pending", "waiting", "ready_for_pickup"];

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadReservations = () => {
    setLoading(true);
    setError("");

    getMyReservations()
      .then((data) => setReservations(data.reservations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (reservationId) => {
    if (!window.confirm("Cancel this reservation?")) return;

    setCancellingId(reservationId);
    setError("");

    try {
      await cancelReservation(reservationId);
      loadReservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const activeReservations = reservations.filter((item) =>
    ACTIVE.includes(item.status),
  );

  const pastReservations = reservations.filter(
    (item) => !ACTIVE.includes(item.status),
  );

  const renderCard = (item) => (
    <article className="reservation-card" key={item.reservation_id}>
      <div className="reservation-main">
        <Link to={`/student/books/${item.book_id}`}>
          <h3>{item.title}</h3>
        </Link>
        <p className="reservation-muted">{item.authors}</p>
        <p className="reservation-muted">
          Reserved on {formatDate(item.reserved_at)}
        </p>

        {item.status === "waiting" && item.queue_position && (
          <p className="reservation-note">
            Your position in the waiting list: {item.queue_position}
          </p>
        )}

        {item.status === "ready_for_pickup" && (
          <p className="reservation-note">
            Ready for pickup
            {item.pickup_deadline
              ? ` until ${formatDate(item.pickup_deadline)}`
              : ""}
            .{" "}
            {item.shelf_location && (
              <span>
                <MapPin size={13} /> {item.shelf_location}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="reservation-side">
        <span className={`reservation-status status-${item.status}`}>
          {STATUS_LABELS[item.status] || item.status}
        </span>

        {ACTIVE.includes(item.status) && (
          <button
            type="button"
            className="reservation-cancel"
            onClick={() => handleCancel(item.reservation_id)}
            disabled={cancellingId === item.reservation_id}
          >
            {cancellingId === item.reservation_id ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    </article>
  );

  return (
    <DashboardLayout
      role="student"
      title="Reservations"
      activeItem="Reservations"
    >
      <section className="reservation-heading">
        <h1>My Reservations</h1>
        <p>Track the books you reserved or are waiting for.</p>
      </section>

      {error && <p className="reservation-error">{error}</p>}

      {loading ? (
        <LoadingSpinner message="Loading reservations..." />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No reservations yet"
          message="Find a book in Discover Books and reserve it."
        />
      ) : (
        <>
          <h2 className="reservation-group">Active</h2>

          {activeReservations.length === 0 ? (
            <p className="reservation-muted">No active reservations.</p>
          ) : (
            <div className="reservation-list">
              {activeReservations.map(renderCard)}
            </div>
          )}

          {pastReservations.length > 0 && (
            <>
              <h2 className="reservation-group">History</h2>
              <div className="reservation-list">
                {pastReservations.map(renderCard)}
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default MyReservationsPage;
