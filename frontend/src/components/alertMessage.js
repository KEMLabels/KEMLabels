import React from "react";
import { BiErrorCircle } from "react-icons/bi";
import "../styles/Global.css";

export default function AlertMessage({ msg, type, iconSize = 24 }) {
  return (
    <div className={`alertMessageContainer ${type}`}>
      {type === "error" && <BiErrorCircle size={iconSize} color="#FF0033" />}
      {type === "success" && <BiErrorCircle size={iconSize} color="#00CC66" />}
      {type === "info" && <BiErrorCircle size={iconSize} color="#0066FF" />}
      <p>{msg}</p>
    </div>
  );
}
