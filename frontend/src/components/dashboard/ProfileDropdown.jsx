import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, ChevronDown, LogOut } from "lucide-react";

function ProfileDropdown({
  role = "student",
  name = "SmartShelf User",
  initials = "SU",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("smartshelf_token");
    sessionStorage.removeItem("smartshelf_user");
    sessionStorage.removeItem("smartshelf_session_expired");

    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        <span className="profile-avatar">{initials}</span>

        <span className="profile-trigger-info">
          <strong>{name}</strong>
          <small>{formattedRole}</small>
        </span>

        <ChevronDown
          size={17}
          className={isOpen ? "profile-chevron rotated" : "profile-chevron"}
        />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <span className="profile-avatar large">{initials}</span>

            <div>
              <strong>{name}</strong>
              <small>{formattedRole} account</small>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          <button
            type="button"
            className="profile-dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <UserRound size={18} />
            <span>My Profile</span>
          </button>

          <div className="profile-dropdown-divider" />

          <button
            type="button"
            className="profile-dropdown-item logout-item"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
