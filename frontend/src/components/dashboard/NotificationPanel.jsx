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

const initialNotifications = [
  {
    id: 1,
    type: "reservation",
    title: "Reservation confirmed",
    message: "Your reservation for Clean Code has been confirmed.",
    time: "10 minutes ago",
    unread: true,
  },
  {
    id: 2,
    type: "reminder",
    title: "Book return reminder",
    message: "Remember to return your borrowed book on time.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 3,
    type: "welcome",
    title: "Welcome to SmartShelf",
    message: "Discover books and explore your university library.",
    time: "Yesterday",
    unread: false,
  },
];

function NotificationPanel({ onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  // Send the latest unread count to the DashboardTopbar.
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const markAsRead = (id) => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  };

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
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        </div>
      )}

      <div className="notification-list">
        {notifications.length > 0 ? (
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

                <span className="notification-time">{notification.time}</span>
              </div>

              {notification.unread && (
                <button
                  type="button"
                  className="notification-read-button"
                  onClick={() => markAsRead(notification.id)}
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

      <div className="notification-footer">
        <span>SmartShelf Notifications</span>
      </div>
    </div>
  );
}

export default NotificationPanel;
