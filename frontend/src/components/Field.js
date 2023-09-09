import React, { useState } from "react";
import "../styles/Field.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdSearch } from "react-icons/md";

function InputField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  label,
  helpText,
  fixTextAlignment = false,
  fieldType = "text",
  title = "",
  initialValue,
  currentValue,
  placeholder = "",
  minLength,
  maxLength,
  prefix = "",
  postfix = "",
  onChangeEvent,
  customStyle,
  shortField = false,
  disabled = false,
  optional = false,
}) {
  return (
    <div className={`fieldContainer ${containerClassName}`}>
      <div
        className={`fieldTextGroup ${fixTextAlignment ? "textAlignment" : ""}`}
      >
        <label className={`fieldLabel ${optional ? "optional" : ""}`}>
          {label}
          {optional && <span>{"(optional)"}</span>}
        </label>
        {helpText && <span className="helpText">{helpText}</span>}
      </div>
      <div className="fieldInputGroup">
        {prefix && <span className="inputPrefix">{prefix}</span>}
        <input
          id={id}
          className={`fieldInput ${className} ${disabled ? "disabled" : ""} ${
            shortField ? "shortField" : ""
          } ${prefix ? "prefix" : ""} ${postfix ? "postfix" : ""}`}
          type={fieldType}
          name={name}
          title={title}
          style={{ ...customStyle }}
          defaultValue={initialValue}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          minLength={minLength || null}
          maxLength={maxLength || null}
          onChange={(e) => {
            if (onChangeEvent) onChangeEvent(e);
          }}
        />
        {postfix && <span className="inputPostfix">{postfix}</span>}
      </div>
    </div>
  );
}

function StripeInputField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  fieldType = "text",
  title = "",
  initialValue,
  currentValue,
  label = "",
  placeholder = "",
  minLength,
  maxLength,
  onChangeEvent,
  customStyle,
  disabled = false,
}) {
  return (
    <div className={`stripeFieldContainer ${containerClassName}`}>
      <label className="stripeFieldLabel">{label}</label>
      <input
        id={id}
        className={`stripeFieldInput ${className} ${
          disabled ? "disabled" : ""
        }`}
        type={fieldType}
        name={name}
        title={title}
        style={{ ...customStyle }}
        defaultValue={initialValue}
        value={currentValue}
        placeholder={placeholder}
        disabled={disabled}
        minLength={minLength || null}
        maxLength={maxLength || null}
        onChange={(e) => {
          if (onChangeEvent) onChangeEvent(e);
        }}
      />
    </div>
  );
}

function StripeAmountField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  fieldType = "number",
  title = "",
  initialValue,
  currentValue,
  label = "",
  placeholder = "",
  prefix = "",
  postfix = "",
  onChangeEvent,
  customStyle,
  disabled = false,
}) {
  return (
    <div className={`stripeFieldContainer ${containerClassName}`}>
      <label className="stripeFieldLabel">{label}</label>
      <div style={{ display: "flex" }}>
        {prefix && <span className="stripePrefix">{prefix}</span>}
        <input
          id={id}
          className={`stripeFieldInput ${className} 
            ${disabled ? "disabled" : ""} ${prefix ? "prefix" : ""} 
            ${postfix ? "postfix" : ""}`}
          type={fieldType}
          name={name}
          title={title}
          style={{
            ...customStyle,
          }}
          defaultValue={initialValue}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          step={1}
          onKeyDown={(e) => {
            const key = e.key;

            // Allow certain keys: digits, dot, backspace, delete, arrow keys, and tab
            if (
              /^[0-9.]$/.test(key) ||
              key === "Backspace" ||
              key === "Delete" ||
              key.startsWith("Arrow") ||
              key === "Tab" ||
              ((e.ctrlKey || e.metaKey) && key === "a")
            ) {
              return;
            }

            // Prevent the event for all other keys
            e.preventDefault();
          }}
          onBlur={() => {
            let inputValue = currentValue;
            if (inputValue) {
              if (!inputValue.includes(".")) {
                inputValue = parseFloat(inputValue).toFixed(2);
              } else {
                // If there's a decimal point, check the number of decimal places
                const [integerPart, decimalPart] = inputValue.split(".");
                if (decimalPart.length < 2) {
                  inputValue = `${integerPart}.${decimalPart.padEnd(2, "0")}`;
                }
              }
            }
            onChangeEvent({ target: { value: inputValue } });
          }}
          onChange={(e) => {
            if (onChangeEvent) {
              let inputValue = e.target.value.replace(/[^0-9.]/g, "");
              if (inputValue) {
                let [integerPart, decimalPart] = inputValue.split(".");

                // Limit to 6 digits before decimal
                if (integerPart && integerPart.length > 6) {
                  integerPart = integerPart.slice(0, 6);
                }

                // Limit to 2 decimal places
                if (decimalPart && decimalPart.length > 2) {
                  decimalPart = decimalPart.slice(0, 2);
                }

                // Combine integer and decimal parts
                inputValue = decimalPart
                  ? `${integerPart}.${decimalPart}`
                  : integerPart;
              }
              onChangeEvent({ target: { value: inputValue } });
            }
          }}
        />
        {postfix && <span className="stripePostfix">{postfix}</span>}
      </div>
    </div>
  );
}

function PasswordField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  label,
  initialValue,
  currentValue,
  placeholder = "",
  minLength,
  maxLength,
  onChangeEvent,
  customStyle,
  disabled = false,
  optional = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={`fieldContainer ${containerClassName}`}>
      <div className="fieldTextGroup">
        <label className={`fieldLabel ${optional ? "optional" : ""}`}>
          {label}
          {optional && <span>{"(optional)"}</span>}
        </label>
      </div>
      <div className="fieldInputGroup">
        <input
          id={id}
          className={`fieldInput password ${className} ${
            disabled ? "disabled" : ""
          }`}
          type={showPassword ? "text" : "password"}
          name={name}
          title="Minimum 8 characters"
          style={{ ...customStyle }}
          defaultValue={initialValue}
          value={currentValue}
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
    </div>
  );
}

function SearchField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  fieldType = "text",
  title = "",
  initialValue,
  currentValue,
  placeholder = "",
  onChangeEvent,
  customStyle,
}) {
  return (
    <div className={`fieldContainer ${containerClassName}`}>
      <div className="searchIcon">
        <MdSearch />
      </div>
      <div className="fieldInputGroup">
        <input
          id={id}
          className={`fieldInput searchField ${className}`}
          type={fieldType}
          name={name}
          title={title}
          style={{ ...customStyle }}
          defaultValue={initialValue}
          value={currentValue}
          placeholder={placeholder}
          onChange={(e) => {
            if (onChangeEvent) onChangeEvent(e);
          }}
        />
      </div>
    </div>
  );
}

export {
  InputField,
  PasswordField,
  StripeAmountField,
  StripeInputField,
  SearchField,
};
