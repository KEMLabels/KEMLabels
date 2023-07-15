import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { Link, NavLink } from "react-router-dom";
import "../styles/Global.css";
import "../styles/Navbar.css";

export default function HamburgerMenu({ sessionStatus = false }) {
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
          <Link className="navLink" to="/#pricing">
            Pricing
          </Link>
          <Link className="navLink" to="/#faq">
            FAQ
          </Link>
          <NavLink className="navLink" to="/Signin" activeClassName="active">
            Sign In
          </NavLink>
          {sessionStatus && (
            <Link
              className="navLink"
              onClick={(e) => {
                e.preventDefault();
                // TODO: logout
              }}
            >
              Logout
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
