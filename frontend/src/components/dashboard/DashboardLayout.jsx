import { useState, useEffect } from "react";

import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import SessionManager from "../SessionManager";

function DashboardLayout({
  role = "student",
  title = "Dashboard",
  activeItem = "Dashboard",
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth > 768;
  });

  const [isMobile, setIsMobile] = useState(() => {
    return window.innerWidth <= 768;
  });

  // Monitor screen size.
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <SessionManager />

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      )}

      {/* Dashboard Sidebar */}
      <DashboardSidebar
        role={role}
        activeItem={activeItem}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onNavigate={closeSidebar}
      />

      {/* Main Dashboard Area */}
      <div
        className={`dashboard-main ${
          sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"
        }`}
      >
        <DashboardTopbar
          title={title}
          onMenuClick={toggleSidebar}
          role={role}
        />

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
