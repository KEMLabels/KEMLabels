import React from "react";
import { useDispatch } from "react-redux";
import {
  FaUserEdit,
  FaChevronRight,
  FaHistory,
  FaMoneyCheckAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import axios from "../api/axios";
import { clearSession } from "../redux/actions/AuthAction";
import "../styles/Global.css";
import "../styles/Navbar.css";

export default function AccountDropdownLink({ type, link, text }) {
  const dispatch = useDispatch();

  function renderIcon() {
    switch (type) {
      case "account":
        return <FaUserEdit className="dropdownLinkIcon" />;
      case "load":
        return <FaMoneyCheckAlt className="dropdownLinkIcon" />;
      case "history":
        return <FaHistory className="dropdownLinkIcon" />;
      case "logout":
        return <FaSignOutAlt className="dropdownLinkIcon" />;
      default:
        return null;
    }
  }

  return (
    <div
      className="dropdownLink"
      onClick={async (e) => {
        e.preventDefault();
        if (type === "logout") {
          await axios.get("/logout", { withCredentials: true });
          dispatch(clearSession());
        }
        window.location.href = `${link}`;
      }}
    >
      <div>
        {renderIcon()}
        <p className="dropdownNavLink">{text}</p>
      </div>
      <FaChevronRight className="dropdownLinkIcon" />
    </div>
  );
}
