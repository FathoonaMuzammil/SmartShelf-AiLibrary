import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import BookDetailsPage from "./pages/BookDetailsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";

// Authentication Pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Dashboard Pages
import StudentDashboardPage from "./pages/StudentDashboardPage.jsx";
import DiscoverBooksPage from "./pages/student/DiscoverBooksPage.jsx";
import StudentBookDetailsPage from "./pages/student/StudentBookDetailsPage.jsx";
import MyReservationsPage from "./pages/student/MyReservationsPage.jsx";
import MyBorrowingsPage from "./pages/student/MyBorrowingsPage.jsx";
import AIAssistantPage from "./pages/student/AIAssistantPage.jsx";

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
          <Route path="/student/books/:bookId" element={<StudentBookDetailsPage />} />
          <Route path="/student/reservations" element={<MyReservationsPage />} />
          <Route path="/student/borrowings" element={<MyBorrowingsPage />} />
          <Route path="/student/ai-assistant" element={<AIAssistantPage />} />
        </Route>

        {/* Temporary Component Preview */}
        <Route path="/component-preview" element={<ComponentPreviewPage />} />

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
