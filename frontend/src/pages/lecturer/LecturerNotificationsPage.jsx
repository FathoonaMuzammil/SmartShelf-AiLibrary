import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/lecturerService";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};

const formatDate = (value) => new Date(value).toLocaleString();

function LecturerNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setError("");
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (notificationId) => {
    if (busy) return;

    try {
      setBusy(true);
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (busy) return;

    try {
      setBusy(true);
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout
      role="lecturer"
      title="Notifications"
      activeItem="Notifications"
    >
      {loading && <p>Loading notifications...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && (
        <>
          <p>
            {unreadCount > 0
              ? `${unreadCount} unread ${
                  unreadCount === 1 ? "notification" : "notifications"
                }`
              : "You're all caught up!"}{" "}
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={busy || unreadCount === 0}
            >
              Mark all as read
            </button>
          </p>

          {notifications.length === 0 && !error && (
            <p>You don't have any notifications yet.</p>
          )}

          {notifications.map((item) => (
            <div
              key={item.notification_id}
              style={{
                ...cardStyle,
                borderLeft: item.is_read
                  ? "4px solid #e5e7eb"
                  : "4px solid #526B55",
              }}
            >
              <strong>{item.title}</strong>{" "}
              <span>{item.is_read ? "(Read)" : "(Unread)"}</span>
              <p style={{ margin: "6px 0" }}>{item.message}</p>
              <small>{formatDate(item.created_at)}</small>
              {!item.is_read && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.notification_id)}
                    disabled={busy}
                  >
                    Mark as read
                  </button>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </DashboardLayout>
  );
}

export default LecturerNotificationsPage;