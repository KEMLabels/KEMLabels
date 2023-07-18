import React, { useState } from "react";
import "../styles/Global.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function InputField({
  id,
  className = "",
  name = "",
  fieldType = "text",
  title = "",
  initialValue = "",
  placeholder = "",
  minLength,
  maxLength,
  onChangeEvent,
  customStyle,
  disabled = false,
}) {
  return (
    <div className={`fieldContainer ${className}`}>
      {/* <label htmlFor={id} className="fieldLabel">{label}</label> */}
      <input
        id={id}
        className={`fieldInput ${className} ${disabled ? "disabled" : ""}`}
        type={fieldType}
        name={name}
        title={title}
        style={{ ...customStyle }}
        defaultValue={initialValue}
        placeholder={placeholder}
        disabled={disabled}
        minLength={minLength || null}
        maxLength={maxLength || null} 
        // required
        onChange={(e) => {
          if (onChangeEvent) onChangeEvent(e);
        }}
      />
    </div>
  );
}

function PasswordField({
  id,
  className = "",
  name = "",
  initialValue = "",
  placeholder = "",
  minLength,
  maxLength,
  onChangeEvent,
  customStyle,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={`fieldContainer ${className}`}>
      {/* <label htmlFor={id} className="fieldLabel">{label}</label> */}
      <input
        id={id}
        className={`fieldInput ${className} ${disabled ? "disabled" : ""}`}
        type={showPassword ? "text" : "password"}
        name={name}
        title="Minimum 8 characters"
        style={{ ...customStyle }}
        defaultValue={initialValue}
        placeholder={placeholder}
        disabled={disabled}
        minLength={minLength || null}
        maxLength={maxLength || null} 
        onChange={(e) => {
          if (onChangeEvent) onChangeEvent(e);
        }}
      />
      <div
        className="passwordIcon"
        title={showPassword ? "Hide password" : "Show password"}
        onClick={() => {
          setShowPassword(!showPassword);
        }}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </div>
    </div>
  );
}

export { InputField, PasswordField };
