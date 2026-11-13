import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Compass, GraduationCap, Search } from "lucide-react";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";

function StudentDashboardPage() {
  const user = JSON.parse(sessionStorage.getItem("smartshelf_user") || "null");

  const displayName = user?.full_name || "Student";

  const [showLoadingDemo, setShowLoadingDemo] = useState(false);

  return (
    <DashboardLayout
      role="student"
      title="Student Dashboard"
      activeItem="Dashboard"
    >
      {/* Welcome Section */}
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">STUDENT PORTAL</span>

          <h1>Welcome back, {displayName}!</h1>

          <p>
            Discover books, explore knowledge, and make the most of your
            university library.
          </p>
        </div>

        <div className="dashboard-welcome-icon">
          <GraduationCap size={42} />
        </div>
      </section>

      {/* Quick Access */}
      <section className="dashboard-shortcuts">
        <h2>Quick Access</h2>

        <div className="dashboard-shortcut-grid">
          <Link to="/explore" className="dashboard-shortcut-card">
            <div className="dashboard-shortcut-icon">
              <Compass size={23} />
            </div>

            <div>
              <h3>Explore Books</h3>
              <p>Discover books in the library collection.</p>
            </div>
          </Link>

          <Link to="/explore" className="dashboard-shortcut-card">
            <div className="dashboard-shortcut-icon">
              <BookOpen size={23} />
            </div>

            <div>
              <h3>Library Collection</h3>
              <p>Browse available books and resources.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Temporary Component Testing Section */}
      <section className="dashboard-component-demo">
        <div className="dashboard-demo-heading">
          <div>
            <h2>Component Preview</h2>
            <p>Temporary demonstration of reusable UI components.</p>
          </div>

          <Button
            variant="secondary"
            onClick={() => setShowLoadingDemo((previous) => !previous)}
          >
            {showLoadingDemo ? "Hide Loading" : "Show Loading"}
          </Button>
        </div>

        {showLoadingDemo ? (
          <LoadingSpinner message="Loading library information..." />
        ) : (
          <EmptyState
            icon={Search}
            title="No recent activity"
            message="Your recent library activity will appear here when available."
          />
        )}
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboardPage;
