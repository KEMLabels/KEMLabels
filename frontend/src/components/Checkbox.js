import React from "react";
import "../styles/Checkbox.css";

export default function Checkbox({ label, isSelected, onCheckboxChange }) {
  return (
    <div className="checkboxContainer">
      <input
        type="checkbox"
        name={label}
        checked={isSelected}
        onChange={onCheckboxChange}
      />
      {label}
    </div>
  );
}
