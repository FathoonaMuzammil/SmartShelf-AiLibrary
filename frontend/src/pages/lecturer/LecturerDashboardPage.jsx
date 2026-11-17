import DashboardLayout from "../../components/dashboard/DashboardLayout";

function LecturerDashboardPage() {
  // Read the logged-in user's name from the saved session.
  let fullName = "Lecturer";

  try {
    const storedUser = JSON.parse(
      sessionStorage.getItem("smartshelf_user") || "{}",
    );
    fullName = storedUser.full_name || storedUser.fullName || "Lecturer";
  } catch {
    // Keep the default name if the saved user data cannot be read.
  }

  return (
    <DashboardLayout
      role="lecturer"
      title="Lecturer Dashboard"
      activeItem="Dashboard"
    >
      <h2>Welcome, {fullName}</h2>
      <p>
        Your lecturer workspace is ready. Dashboard statistics will appear
        here soon.
      </p>
    </DashboardLayout>
  );
}

export default LecturerDashboardPage;