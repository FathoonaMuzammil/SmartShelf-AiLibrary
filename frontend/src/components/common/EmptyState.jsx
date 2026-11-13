import { BookOpen, Search } from "lucide-react";
import Button from "./Button";

function EmptyState({
  icon: Icon = BookOpen,
  title = "Nothing here yet",
  message = "There is no content to display right now.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        <Icon size={34} />
      </div>

      <h3>{title}</h3>

      <p>{message}</p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
