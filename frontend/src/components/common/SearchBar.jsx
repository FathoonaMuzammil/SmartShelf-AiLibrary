import { Search, X } from "lucide-react";

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  className = "",
  disabled = false,
}) {
  const handleClear = () => {
    onChange?.({ target: { value: "" } });
    onClear?.();
  };

  return (
    <div className={`common-search-wrapper ${className}`}>
      <Search size={19} className="common-search-icon" />

      <input
        type="search"
        className="common-search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
      />

      {value && (
        <button
          type="button"
          className="common-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          disabled={disabled}
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
