import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import {
  FaBars,
  FaQuestionCircle,
  FaSignInAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaSignOutAlt,
  FaLayerGroup,
  FaUserPlus,
} from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import axios from "../api/axios";
import { clearSession } from "../redux/actions/AuthAction";
import "../styles/Global.css";
import "../styles/Navbar.css";

export default function HamburgerMenu({ sessionStatus = false }) {
  const dispatch = useDispatch();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Hides menu when user clicks outside of menu
  function HideHamburgerOnWindowClick() {
    window.onclick = (e) => {
      if (showHamburgerMenu && !e.target.matches(".hamburgerMenu")) {
        setShowHamburgerMenu(false);
      }
    };
  }

  return (
    <div className="mobileNav">
      <button
        className="iconButton"
        style={{ marginTop: "5px" }}
        onClick={() => setShowHamburgerMenu(true)}
      >
        <FaBars size={24} />
      </button>
      <div
        className={`hamburgerMenu ${showHamburgerMenu ? "active" : ""}`}
        onTransitionEnd={HideHamburgerOnWindowClick}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" className="logo">
            {/* TODO: Change this to logo img later */}
            <h1>LabelMaster</h1>
          </Link>

          <button
            className="iconButton"
            onClick={() => setShowHamburgerMenu(false)}
          >
            <IoCloseSharp size={24} style={{ marginTop: "5px" }} />
          </button>
        </div>
        <div className="mobNavLinksContainer">
          <Link className="navLink" to="/#howitworks">
            <FaLayerGroup />
            <span>How It Works</span>
          </Link>
          <Link className="navLink" to="/#faq">
            <FaQuestionCircle />
            <span>FAQ</span>
          </Link>
          {!sessionStatus && (
            <>
              <NavLink
                className="navLink"
                to="/signin"
                activeclassname="active"
              >
                <FaSignInAlt />
                <span>Sign In</span>
              </NavLink>
              <NavLink
                className="navLink"
                to="/signup"
                activeclassname="active"
              >
                <FaUserPlus />
                <span>Get Started</span>
              </NavLink>
            </>
          )}
          {sessionStatus && (
            <Link
              className="navLink"
              onClick={async (e) => {
                e.preventDefault();
                await axios.get("/logout", { withCredentials: true });
                dispatch(clearSession());
                window.location.href = "/";
              }}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </Link>
          )}
        </div>
        <div className="mobContact">
          <p>Contact us at:</p>
          <div className="contactInfo">
            {/* TOOD: Update contact info */}
            <a href="tel:6041231234">
              <FaPhoneAlt size={16} />
              <span>6041231234</span>
            </a>
            <a href="mailto:labelmaster@gmail.com">
              <FaEnvelope size={16} />
              <span>labelmaster@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
