import { useState, useRef, useEffect } from "react";
import "../styles/ModernSelect.css";

export default function ModernSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select..."
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="modern-select" ref={wrapperRef}>
      <div
        className="modern-select-control"
        onClick={() => setOpen(!open)}
      >
        {selected?.label || placeholder}
        <span className="arrow">▾</span>
      </div>

      {open && (
        <div className="modern-select-menu">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`modern-select-item ${
                opt.value === value ? "active" : ""
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
