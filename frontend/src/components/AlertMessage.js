import React, { useEffect } from "react";
import { BiCheckCircle, BiErrorCircle, BiInfoCircle } from "react-icons/bi";
import "../styles/Global.css";

export default function AlertMessage({ msg, type, iconSize = 24, divId = "" }) {
  useEffect(() => {
    function getDistanceFromTop() {
      console.log(msg, divId)
      if (!divId) return 0;
      const targetDiv = document.getElementById(divId).getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      console.log(targetDiv.top + scrollTop - 120)
      return targetDiv.top + scrollTop - 120;
    }
    if (msg) window.scrollTo({ top: getDistanceFromTop(), behavior: "smooth" });
  }, [msg, divId]);

  return (
    <div className={`alertMessageContainer ${type}`}>
      {type === "error" && <BiErrorCircle size={iconSize} color="#FF0033" />}
      {type === "success" && <BiCheckCircle size={iconSize} color="#00CC66" />}
      {type === "info" && <BiInfoCircle size={iconSize} color="#0066FF" />}
      <p>{msg}</p>
    </div>
  );
}
