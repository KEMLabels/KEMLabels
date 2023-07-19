import React from "react";
import "../styles/Global.css";

export default function Button({
  btnType = "button",
  className = "",
  fill = "solid",
  onClickEvent,
  disabled = false,
  text,
  children,
  customStyle,
}) {
  return (
    <button
      type={btnType !== "button" ? btnType : "button"}
      className={`labelMasterBtn ${className} ${
        fill === "solid" ? "solid" : "outline"
      }`}
      style={{ ...customStyle }}
      disabled={disabled}
      onClick={(e) => {
        if (onClickEvent) onClickEvent(e);
      }}
    >
      {children || text}
    </button>
  );
}
