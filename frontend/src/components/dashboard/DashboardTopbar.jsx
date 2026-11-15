import { useEffect, useState } from "react";
import { Menu, Bell } from "lucide-react";

import ProfileDropdown from "./ProfileDropdown";
import NotificationPanel from "./NotificationPanel";
import { getDashboard } from "../../services/studentService.js";

function DashboardTopbar({
  title = "Dashboard",
  onMenuClick,
  role = "student",
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(sessionStorage.getItem("smartshelf_user") || "null");

  const displayName = user?.full_name || "SmartShelf User";
  const displayRole = user?.role || role;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch real unread notification count for students
  useEffect(() => {
    if (displayRole !== "student") return;

    let isMounted = true;

    getDashboard()
      .then((data) => {
        if (isMounted) {
          setUnreadCount(data.summary?.unread_notifications ?? 0);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch unread notifications:", error);

        if (isMounted) {
          setUnreadCount(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [displayRole]);

  return (
    <header className="dashboard-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu size={21} />
        </button>

        <div className="topbar-heading">
          <h1>{title}</h1>
          <p>Welcome to your SmartShelf workspace</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-notification-wrapper">
          <button
            type="button"
            className="topbar-icon-button"
            onClick={() => setShowNotifications((previous) => !previous)}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={showNotifications}
          >
            <Bell size={20} />

            {displayRole === "student" && unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              onUnreadCountChange={setUnreadCount}
            />
          )}
        </div>

        <ProfileDropdown
          role={displayRole}
          name={displayName}
          initials={initials}
        />
      </div>
    </header>
  );
}

export default DashboardTopbar;
