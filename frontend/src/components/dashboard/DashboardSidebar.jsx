import { Link } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  Search,
  Bookmark,
  Clock,
  Heart,
  Sparkles,
  Users,
  Library,
  BookPlus,
  ClipboardList,
  BarChart3,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

// Navigation items for each user role.
const navigation = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
    { label: "Discover Books", icon: Search, path: "/student/discover" },
    { label: "My Borrowings", icon: BookOpen, path: "/student/borrowings" },
    { label: "Reservations", icon: Bookmark, path: "/student/reservations" },
    { label: "Reading History", icon: Clock, path: "/student/history" },
    { label: "My Favourites", icon: Heart, path: "/student/favourites" },
        { label: "AI Assistant", icon: Sparkles, path: "/student/ai-assistant" },
  ],

  lecturer: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/lecturer/dashboard" },
    { label: "Explore Books", icon: Search, path: "/explore" },
    {
      label: "Recommendations",
      icon: BookPlus,
      path: "/lecturer/recommendations",
    },
    {
      label: "My Recommendations",
      icon: ClipboardList,
      path: "/lecturer/my-recommendations",
    },
  ],

  librarian: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/librarian/dashboard" },
    { label: "Manage Books", icon: BookOpen, path: "/librarian/books" },
    { label: "Manage Users", icon: Users, path: "/librarian/users" },
    { label: "Borrowings", icon: Library, path: "/librarian/borrowings" },
    { label: "Reservations", icon: Bookmark, path: "/librarian/reservations" },
    { label: "Reports", icon: BarChart3, path: "/librarian/reports" },
  ],
};

function DashboardSidebar({
  role = "student",
  activeItem = "Dashboard",
  isOpen = true,
  onToggle,
  onNavigate,
}) {
  // Map the backend admin role to the librarian interface.
  const normalizedRole =
    role.toLowerCase() === "admin" ? "librarian" : role.toLowerCase();

  const menuItems = navigation[normalizedRole] || navigation.student;

  const roleLabel =
    normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);

  // Close the sidebar after navigation.
  const handleNavigation = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={`dashboard-sidebar ${
        isOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      {/* Sidebar Brand */}
      <div className="sidebar-brand">
        <Link to="/" className="brand" onClick={handleNavigation}>
          <span className="brand-icon">S</span>
          {isOpen && <span>SmartShelf</span>}
        </Link>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          {isOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
        </button>
      </div>

      {/* Role Label */}
      {isOpen && (
        <div className="sidebar-section-label">{roleLabel} workspace</div>
      )}

      {/* Main Navigation */}
      <nav className="sidebar-navigation" aria-label="Dashboard navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.label;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={handleNavigation}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              title={!isOpen ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.8} />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Bottom */}
      <div className="sidebar-bottom">
        <Link
          to="/dashboard/settings"
          onClick={handleNavigation}
          className="sidebar-nav-item"
          title={!isOpen ? "Settings" : undefined}
        >
          <Settings size={19} strokeWidth={1.8} />
          {isOpen && <span>Settings</span>}
        </Link>

        <Link
          to="/help"
          onClick={handleNavigation}
          className="sidebar-nav-item"
          title={!isOpen ? "Help & Support" : undefined}
        >
          <HelpCircle size={19} strokeWidth={1.8} />
          {isOpen && <span>Help & Support</span>}
        </Link>

        {isOpen && (
          <div className="sidebar-footer">
            <span>SmartShelf</span>
            <small>Discover. Learn. Borrow.</small>
          </div>
        )}
      </div>
    </aside>
  );
}

export default DashboardSidebar;
