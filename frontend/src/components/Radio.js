import "../styles/Radio.css";

export default function Radio({ label, isSelected, onRadioChange }) {
  return (
    <div className="radioContainer">
      <input
        id={label}
        type="radio"
        name="radioGroup"
        checked={isSelected}
        onChange={onRadioChange}
      />
      <label htmlFor={label} onChange={onRadioChange}>
        {label}
      </label>
    </div>
  );
}
