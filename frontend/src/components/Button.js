import React from "react";
import "../styles/Global.css";
import { FaSpinner } from "react-icons/fa";

export default function Button({
  btnType = "button",
  className = "",
  title = "",
  fill = "solid",
  onClickEvent,
  loading = false,
  disabled = false,
  text,
  children,
  customStyle,
}) {
  return (
    <button
      type={btnType !== "button" ? btnType : "button"}
      className={`kemLabelsBtn ${className} ${
        fill === "solid" ? "solid" : "outline"
      }`}
      title={title}
      style={{ ...customStyle }}
      disabled={disabled || loading}
      onClick={(e) => {
        if (onClickEvent) onClickEvent(e);
      }}
    >
      {loading ? (
        <FaSpinner size="16" className="buttonSpinner" />
      ) : (
        children || text
      )}
    </button>
  );
}
