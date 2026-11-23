
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCheck,
  Clock,
  X,
} from "lucide-react";

import {
  getDashboard,
  markAllNotificationsRead as markAllStudentNotificationsRead,
} from "../../services/studentService.js";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead as markAllLecturerNotificationsRead,
} from "../../services/lecturerService.js";

// Convert the database date into a readable date and time.
const formatNotificationTime = (createdAt) => {
  if (!createdAt) return "";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
};

function NotificationPanel({
  onClose,
  onUnreadCountChange,
  role = "student",
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch notifications according to the logged-in user's role.
  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        let data;

        if (role === "lecturer") {
          data = await getNotifications();
        } else {
          data = await getDashboard();
        }

        if (!isMounted) return;

        const formattedNotifications = (data.notifications || []).map(
          (notification) => ({
            id: notification.notification_id,
            type: notification.notification_type || "default",
            title: notification.title,
            message: notification.message,
            time: formatNotificationTime(notification.created_at),
            unread: !notification.is_read,
          }),
        );

        setNotifications(formattedNotifications);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);

        if (isMounted) {
          setError(err.message || "Failed to load notifications.");
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [role]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  // Send the latest unread count to DashboardTopbar.
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Mark one notification as read according to the user's role.
  const handleMarkAsRead = async (id) => {
    try {
      if (role === "lecturer") {
        await markNotificationRead(id);
      }

      // Update the individual notification in the UI.
      // Lecturer updates only after backend confirmation.
      // Student updates locally because no individual API exists.
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, unread: false }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError(err.message || "Could not update the notification.");
    }
  };

  // Mark all notifications as read for the current role.
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      if (role === "lecturer") {
        await markAllLecturerNotificationsRead();
      } else {
        await markAllStudentNotificationsRead();
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          unread: false,
        })),
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setError(err.message || "Could not update notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  // Select an icon based on notification type.
  const getNotificationIcon = (type) => {
    switch (type) {
      case "reservation":
        return <CalendarCheck size={18} />;

      case "reminder":
        return <Clock size={18} />;

      case "welcome":
        return <BookOpen size={18} />;

      default:
        return <Bell size={18} />;
    }
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <div>
          <h3>Notifications</h3>
          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "You're all caught up!"}
          </p>
        </div>

        <button
          type="button"
          className="notification-close"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <X size={19} />
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="notification-actions">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || actionLoading}
          >
            <CheckCheck size={15} />
            {actionLoading ? "Updating..." : "Mark all as read"}
          </button>
        </div>
      )}

      <div className="notification-list">
        {loading ? (
          <div className="notification-empty">
            <Bell size={30} />
            <h4>Loading notifications...</h4>
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="notification-empty">
            <Bell size={30} />
            <h4>Unable to load notifications</h4>
            <p>{error}</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                notification.unread ? "unread" : "read"
              }`}
            >
              <div className={`notification-icon ${notification.type}`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-details">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {notification.time}
                </span>
              </div>

              {notification.unread && (
                <button
                  type="button"
                  className="notification-read-button"
                  onClick={() => handleMarkAsRead(notification.id)}
                  aria-label={`Mark ${notification.title} as read`}
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}

              {notification.unread && (
                <span className="notification-unread-dot" />
              )}
            </div>
          ))
        ) : (
          <div className="notification-empty">
            <Bell size={30} />
            <h4>No notifications</h4>
            <p>You don't have any notifications yet.</p>
          </div>
        )}
      </div>

      {error && notifications.length > 0 && (
        <p role="alert">{error}</p>
      )}

      <div className="notification-footer">
        <span>SmartShelf Notifications</span>
      </div>
    </div>
  );
}

export default NotificationPanel;
