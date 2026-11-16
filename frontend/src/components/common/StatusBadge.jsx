function StatusBadge({ status, className = "" }) {
  const normalizedStatus = String(status || "unknown").toLowerCase();

  const statusStyles = {
    available: "success",
    approved: "success",
    active: "success",
    returned: "success",
    completed: "success",

    pending: "warning",
    reserved: "warning",
    borrowed: "info",

    unavailable: "danger",
    rejected: "danger",
    inactive: "danger",
    overdue: "danger",
    cancelled: "danger",
  };

  const variant = statusStyles[normalizedStatus] || "neutral";

  return (
    <span className={`common-status-badge badge-${variant} ${className}`}>
      {status || "Unknown"}
    </span>
  );
}

export default StatusBadge;
