
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookDetailsPage from "./pages/BookDetailsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";

// Authentication Pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Student Dashboard Pages
import StudentDashboardPage from "./pages/StudentDashboardPage.jsx";
import DiscoverBooksPage from "./pages/student/DiscoverBooksPage.jsx";
import StudentBookDetailsPage from "./pages/student/StudentBookDetailsPage.jsx";
import MyReservationsPage from "./pages/student/MyReservationsPage.jsx";
import MyBorrowingsPage from "./pages/student/MyBorrowingsPage.jsx";
import AIAssistantPage from "./pages/student/AIAssistantPage.jsx";

// Lecturer Dashboard Pages
import LecturerDashboardPage from "./pages/lecturer/LecturerDashboardPage.jsx";
import LecturerBrowseBooksPage from "./pages/lecturer/LecturerBrowseBooksPage.jsx";
import LecturerCreateRecommendationPage from "./pages/lecturer/LecturerCreateRecommendationPage.jsx";
import LecturerMyRecommendationsPage from "./pages/lecturer/LecturerMyRecommendationsPage.jsx";
import LecturerStudentFeedbackPage from "./pages/lecturer/LecturerStudentFeedbackPage.jsx";
import LecturerNotificationsPage from "./pages/lecturer/LecturerNotificationsPage.jsx";
import LecturerProfilePage from "./pages/lecturer/LecturerProfilePage.jsx";
import LecturerSettingsPage from "./pages/lecturer/LecturerSettingsPage.jsx";

// Librarian Dashboard Pages
import LibrarianDashboardPage from "./pages/librarian/LibrarianDashboardPage.jsx";
import LibrarianBooksPage from "./pages/librarian/LibrarianBooksPage.jsx";
import LibrarianCopiesPage from "./pages/librarian/LibrarianCopiesPage.jsx";
import LibrarianReservationsPage from "./pages/librarian/LibrarianReservationsPage.jsx";
import LibrarianBorrowingsPage from "./pages/librarian/LibrarianBorrowingsPage.jsx";
import LibrarianOverduePage from "./pages/librarian/LibrarianOverduePage.jsx";
import LibrarianReportsPage from "./pages/librarian/LibrarianReportsPage.jsx";

// Component Preview
import ComponentPreviewPage from "./pages/ComponentPreviewPage.jsx";

// Route Protection
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/books/:bookId" element={<BookDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Guest-only Pages */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/discover" element={<DiscoverBooksPage />} />
          <Route
            path="/student/books/:bookId"
            element={<StudentBookDetailsPage />}
          />
          <Route path="/student/reservations" element={<MyReservationsPage />} />
          <Route path="/student/borrowings" element={<MyBorrowingsPage />} />
          <Route path="/student/ai-assistant" element={<AIAssistantPage />} />
        </Route>

        {/* Protected Lecturer Routes */}
        <Route element={<ProtectedRoute allowedRoles={["lecturer"]} />}>
          <Route path="/lecturer/dashboard" element={<LecturerDashboardPage />} />
          <Route path="/lecturer/books" element={<LecturerBrowseBooksPage />} />
          <Route
            path="/lecturer/recommendations/new"
            element={<LecturerCreateRecommendationPage />}
          />
          <Route
            path="/lecturer/my-recommendations"
            element={<LecturerMyRecommendationsPage />}
          />
          <Route
            path="/lecturer/feedback"
            element={<LecturerStudentFeedbackPage />}
          />
          <Route
            path="/lecturer/notifications"
            element={<LecturerNotificationsPage />}
          />
          <Route path="/lecturer/profile" element={<LecturerProfilePage />} />
          <Route path="/lecturer/settings" element={<LecturerSettingsPage />} />
        </Route>

        {/* Protected Librarian Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["librarian", "admin"]} />
          }
        >
          <Route
            path="/librarian/dashboard"
            element={<LibrarianDashboardPage />}
          />

          <Route
            path="/librarian/books"
            element={<LibrarianBooksPage />}
          />

          <Route
            path="/librarian/copies"
            element={<LibrarianCopiesPage />}
          />

          <Route
            path="/librarian/reservations"
            element={<LibrarianReservationsPage />}
          />

          <Route
            path="/librarian/borrowings"
            element={<LibrarianBorrowingsPage />}
          />

          <Route
            path="/librarian/overdue"
            element={<LibrarianOverduePage />}
          />

          <Route
            path="/librarian/reports"
            element={<LibrarianReportsPage />}
          />
        </Route>

        {/* Temporary Component Preview */}
        <Route
          path="/component-preview"
          element={<ComponentPreviewPage />}
        />

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
