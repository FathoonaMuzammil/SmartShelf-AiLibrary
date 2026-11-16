import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Input({
  label,
  name,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error = "",
  required = false,
  disabled = false,
  autoComplete,
  className = "",
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`common-input-group ${className}`}>
      {label && (
        <label htmlFor={name} className="common-input-label">
          {label}
          {required && <span className="required-mark"> *</span>}
        </label>
      )}

      <div className="common-input-wrapper">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`common-input ${error ? "input-error" : ""}`}
        />

        {isPassword && (
          <button
            type="button"
            className="common-input-toggle"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span id={`${name}-error`} className="common-input-error">
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
