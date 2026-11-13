import { LoaderCircle } from "lucide-react";

function LoadingSpinner({
  message = "Loading...",
  size = "medium",
  fullPage = false,
}) {
  return (
    <div
      className={`loading-spinner-container ${
        fullPage ? "loading-full-page" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className={`loading-spinner-icon spinner-${size}`} />

      {message && <p>{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
