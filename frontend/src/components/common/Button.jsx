function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`common-button common-button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="common-button-spinner" />
          Please wait...
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
