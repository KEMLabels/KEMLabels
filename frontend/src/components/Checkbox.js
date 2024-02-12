import "../styles/Checkbox.css";

export default function Checkbox({
  label,
  isSelected,
  onCheckboxChange,
  customStyle = {},
}) {
  return (
    <div className="checkboxContainer" style={customStyle}>
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
