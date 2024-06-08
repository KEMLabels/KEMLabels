import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { NavLink as NativeNavLink } from "react-router-dom";
import {
  FaUserEdit,
  FaChevronRight,
  FaHistory,
  FaMoneyCheckAlt,
  FaSignOutAlt,
  FaLayerGroup,
  FaQuestionCircle,
  FaSignInAlt,
  FaUserPlus,
  FaFileAlt,
} from "react-icons/fa";
import axios from "../api/axios";
import { clearSession } from "../redux/actions/UserAction";
import "../styles/Global.css";
import "../styles/Navbar.css";
import Log from "./Log";

export default function NavLink({
  type,
  link,
  text,
  isNavlink = true,
  linkOnClick = false,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function renderIcon() {
    switch (type) {
      case "howitworks":
        return <FaLayerGroup />;
      case "faq":
        return <FaQuestionCircle />;
      case "order":
        return <FaFileAlt />;
      case "signin":
        return <FaSignInAlt />;
      case "signup":
        return <FaUserPlus />;
      case "account":
        return <FaUserEdit />;
      case "load":
        return <FaMoneyCheckAlt />;
      case "history":
        return <FaHistory />;
      case "logout":
        return <FaSignOutAlt />;
      default:
        return null;
    }
  }

  return isNavlink ? (
    <NativeNavLink className="navLink" to={link} activeclassname="active">
      {renderIcon()}
      <span>{text}</span>
      <FaChevronRight className="alignRight" />
    </NativeNavLink>
  ) : (
    <Link
      className="navLink"
      to={linkOnClick ? null : link}
      onClick={async (e) => {
        if (linkOnClick) {
          e.preventDefault();
          if (type === "logout") {
            await axios
              .get("/auth/logout", { withCredentials: true })
              .then((res) => Log(res))
              .catch((err) => Log("Error: ", err))
              .finally(() => dispatch(clearSession()));
          }
          navigate(link);
        }
      }}
    >
      {renderIcon()}
      <span>{text}</span>
      <FaChevronRight className="alignRight" />
    </Link>
  );
}
