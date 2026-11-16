import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message = "Please confirm that you want to continue.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <button
          type="button"
          className="confirm-dialog-close"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className={`confirm-dialog-icon ${variant}`}>
          <AlertTriangle size={25} />
        </div>

        <h2 id="confirm-dialog-title">{title}</h2>

        <p>{message}</p>

        <div className="confirm-dialog-actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>

          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
