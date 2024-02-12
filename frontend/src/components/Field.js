import React, { useState } from "react";
import Dropdown from "react-dropdown";
import "../styles/Field.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { regex } from "../utils/Validation";
import { formatPhoneNumber } from "../utils/Helpers";

function DefaultField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  label,
  helpText,
  fieldType = "text",
  title = "",
  initialValue,
  currentValue,
  placeholder = "",
  minLength,
  maxLength,
  prefix = "",
  postfix = "",
  error, // Error message
  onChangeEvent,
  customStyle,
  halfWidth = false,
  fixTextAlignment = false,
  shortField = false,
  disabled = false,
  optional = false,
}) {
  const inputClassNames = [
    "fieldInput",
    fieldType === "textarea" ? "textarea" : "",
    className,
    disabled && "disabled",
    prefix && "prefix",
    postfix && "postfix",
    error && "invalid",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`fieldContainer ${containerClassName} ${
        halfWidth ? "halfWidth" : ""
      }`}
    >
      <div
        className={`fieldTextGroup ${fixTextAlignment ? "textAlignment" : ""}`}
      >
        <label className={`fieldLabel ${optional ? "optional" : ""}`}>
          {label}
          {optional && <span>{"(optional)"}</span>}
        </label>
        {helpText && <span className="helpText">{helpText}</span>}
      </div>
      <div className={`fieldInputGroup ${shortField ? "shortField" : ""}`}>
        {prefix && <span className="inputPrefix">{prefix}</span>}
        {fieldType === "textarea" ? (
          <textarea
            id={id}
            className={inputClassNames}
            name={name}
            title={title}
            style={{ ...customStyle }}
            defaultValue={initialValue}
            value={currentValue}
            placeholder={placeholder}
            disabled={disabled}
            minLength={minLength || null}
            maxLength={maxLength || null}
            onChange={(e) => (onChangeEvent ? onChangeEvent(e) : null)}
          />
        ) : (
          <input
            id={id}
            className={inputClassNames}
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
            onChange={(e) => (onChangeEvent ? onChangeEvent(e) : null)}
          />
        )}
        {postfix && <span className="inputPostfix">{postfix}</span>}
      </div>
      {error && <span className="fieldErrorMsg">{error}</span>}
    </div>
  );
}

function PhoneField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  label,
  helpText,
  title = "",
  initialValue,
  currentValue,
  placeholder = "",
  error, // Error message
  onChangeEvent,
  customStyle,
  halfWidth = false,
  fixTextAlignment = false,
  shortField = false,
  disabled = false,
  optional = false,
}) {
  const inputClassNames = [
    "fieldInput",
    "phone",
    className,
    disabled && "disabled",
    error && "invalid",
  ]
    .filter(Boolean)
    .join(" ");

  const [phone, setPhone] = useState(
    currentValue ? formatPhoneNumber(currentValue) : ""
  );
  return (
    <div
      className={`fieldContainer ${containerClassName} ${
        halfWidth ? "halfWidth" : ""
      }`}
    >
      <div
        className={`fieldTextGroup ${fixTextAlignment ? "textAlignment" : ""}`}
      >
        <label className={`fieldLabel ${optional ? "optional" : ""}`}>
          {label}
          {optional && <span>{"(optional)"}</span>}
        </label>
        {helpText && <span className="helpText">{helpText}</span>}
      </div>
      <div className={`fieldInputGroup ${shortField ? "shortField" : ""}`}>
        <input
          id={id}
          className={inputClassNames}
          type="tel"
          name={name}
          title={title}
          pattern="[0-9\/]*"
          style={{ ...customStyle }}
          defaultValue={initialValue}
          value={phone}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/\D/g, "").slice(0, 10);
            const formattedValue = formatPhoneNumber(numericValue);
            setPhone(formattedValue);
            if (onChangeEvent) {
              onChangeEvent({
                ...e,
                target: { ...e.target, name: name, value: numericValue },
              });
            } else {
              e.preventDefault();
            }
          }}
        />
      </div>
      {error && <span className="fieldErrorMsg">{error}</span>}
    </div>
  );
}

function AmountField({
  id,
  className = "",
  containerClassName = "",
  name = "",
  label,
  helpText,
  fieldType = "number",
  title = "",
  initialValue,
  currentValue,
  placeholder = "",
  prefix = "",
  postfix = "",
  step = 1,
  integerDigits = 6,
  decimalDigits = 2,
  error, // Error message
  onChangeEvent,
  customStyle,
  fixTextAlignment = false,
  shortField = false,
  disabled = false,
  optional = false,
}) {
  const inputClassNames = [
    "fieldInput",
    className,
    disabled && "disabled",
    prefix && "prefix",
    postfix && "postfix",
    error && "invalid",
  ]
    .filter(Boolean)
    .join(" ");

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
      <div className={`fieldInputGroup ${shortField ? "shortField" : ""}`}>
        {prefix && <span className="inputPrefix">{prefix}</span>}
        <input
          id={id}
          className={inputClassNames}
          type={fieldType}
          name={name}
          title={title}
          style={{ ...customStyle }}
          defaultValue={initialValue}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          onKeyDown={(e) => {
            // Allow certain keys: digits, dot, backspace, delete, arrow keys, and tab
            const { key, ctrlKey, metaKey } = e;
            if (
              regex.amountExactMatch.test(key) ||
              key === "Backspace" ||
              key === "Delete" ||
              key.startsWith("Arrow") ||
              key === "Tab" ||
              ((ctrlKey || metaKey) && key === "a")
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
                inputValue = parseFloat(inputValue).toFixed(decimalDigits);
              } else {
                // If there's a decimal point, check the number of decimal places
                const [integerPart, decimalPart] = inputValue.split(".");
                if (decimalPart.length < decimalDigits) {
                  inputValue = `${integerPart}.${decimalPart.padEnd(
                    decimalDigits,
                    "0"
                  )}`;
                }
              }
            }
            onChangeEvent({ target: { value: inputValue } });
          }}
          onChange={(e) => {
            if (onChangeEvent) {
              let inputValue = e.target.value.replace(`${regex.amount}/g`, "");
              if (inputValue) {
                let [integerPart, decimalPart] = inputValue.split(".");

                // Limit to 6 or specified digits in [integerDigits] before decimal
                if (integerPart && integerPart.length > integerDigits) {
                  integerPart = integerPart.slice(0, integerDigits);
                }

                // Limit to 2 or specified decimal places in [decimalDigits]
                if (decimalPart && decimalPart.length > decimalDigits) {
                  decimalPart = decimalPart.slice(0, decimalDigits);
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
        {postfix && <span className="inputPostfix">{postfix}</span>}
      </div>
      {error && <span className="fieldErrorMsg">{error}</span>}
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
        onChange={(e) => (onChangeEvent ? onChangeEvent(e) : null)}
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
  step = 1,
  integerDigits = 6,
  decimalDigits = 2,
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
          style={{ ...customStyle }}
          defaultValue={initialValue}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          onKeyDown={(e) => {
            // Allow certain keys: digits, dot, backspace, delete, arrow keys, and tab
            const { key, ctrlKey, metaKey } = e;
            if (
              regex.amountExactMatch.test(key) ||
              key === "Backspace" ||
              key === "Delete" ||
              key.startsWith("Arrow") ||
              key === "Tab" ||
              ((ctrlKey || metaKey) && key === "a")
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
                inputValue = parseFloat(inputValue).toFixed(decimalDigits);
              } else {
                // If there's a decimal point, check the number of decimal places
                const [integerPart, decimalPart] = inputValue.split(".");
                if (decimalPart.length < decimalDigits) {
                  inputValue = `${integerPart}.${decimalPart.padEnd(
                    decimalDigits,
                    "0"
                  )}`;
                }
              }
            }
            onChangeEvent({ target: { value: inputValue } });
          }}
          onChange={(e) => {
            if (onChangeEvent) {
              let inputValue = e.target.value.replace(`${regex.amount}/g`, "");
              if (inputValue) {
                let [integerPart, decimalPart] = inputValue.split(".");

                // Limit to 6 or specified digits in [integerDigits] before decimal
                if (integerPart && integerPart.length > integerDigits) {
                  integerPart = integerPart.slice(0, integerDigits);
                }

                // Limit to 2 or specified decimal places in [decimalDigits]
                if (decimalPart && decimalPart.length > decimalDigits) {
                  decimalPart = decimalPart.slice(0, decimalDigits);
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
  error, // Error message
  onChangeEvent,
  customStyle,
  disabled = false,
  optional = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputClassNames = [
    "fieldInput password",
    className,
    disabled && "disabled",
    error && "invalid",
  ]
    .filter(Boolean)
    .join(" ");

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
          className={inputClassNames}
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
          onChange={(e) => (onChangeEvent ? onChangeEvent(e) : null)}
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
      {error && <span className="fieldErrorMsg">{error}</span>}
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
          onChange={(e) => (onChangeEvent ? onChangeEvent(e) : null)}
        />
      </div>
    </div>
  );
}

function RadioField({
  label,
  radioButtons,
  fieldInputGroupClassName = "",
  error, // Error message
}) {
  return (
    <div className="fieldContainer">
      <div className="fieldTextGroup">
        <label className="fieldLabel">{label}</label>
      </div>
      <div className={`fieldInputGroup ${fieldInputGroupClassName}`}>
        {radioButtons}
      </div>
      {error && <span className="fieldErrorMsg">{error}</span>}
    </div>
  );
}

function DropdownField({
  label,
  fullwidth = false,
  dropdownItemOptions,
  onChangeEvent,
  value,
  error,
}) {
  return (
    <div className="fieldContainer">
      <div className="fieldTextGroup">
        <label className="fieldLabel">{label}</label>
      </div>
      <Dropdown
        className={`dropdown ${fullwidth ? "fullWidth" : ""}`}
        arrowClassName="dropdownArrow"
        controlClassName="dropdownControl"
        menuClassName="dropdownMenu"
        options={dropdownItemOptions}
        onChange={onChangeEvent}
        value={value}
      />
      {error && <span className="fieldErrorMsg">{error}</span>}
    </div>
  );
}

export {
  DefaultField,
  AmountField,
  PasswordField,
  StripeAmountField,
  StripeInputField,
  SearchField,
  RadioField,
  DropdownField,
  PhoneField,
};
