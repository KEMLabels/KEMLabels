import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import NavLink from "./NavLink";
import "../styles/Global.css";
import "../styles/Navbar.css";

export default function HamburgerMenu({ sessionStatus = false }) {
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Hides menu when user clicks outside of menu
  function HideHamburgerOnWindowClick() {
    window.onclick = (e) => {
      if (showHamburgerMenu && !e.target.matches(".hamburgerMenu")) {
        closeHamburgerMenu();
      }
    };
  }

  function openHamburgerMenu() {
    document.body.style.overflow = "hidden";
    setShowHamburgerMenu(true);
  }

  function closeHamburgerMenu() {
    document.body.style.overflow = null;
    setShowHamburgerMenu(false);
  }

  return (
    <div className="mobileNav">
      <button
        className="iconButton"
        style={{ marginTop: "5px" }}
        onClick={openHamburgerMenu}
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
            <h1>KEMLabels</h1>
          </Link>

          <button className="iconButton" onClick={closeHamburgerMenu}>
            <IoCloseSharp size={24} style={{ marginTop: "5px" }} />
          </button>
        </div>
        <div className="mobNavLinksContainer">
          <NavLink type="howitworks" text="How It Works" link="/#howitworks" />
          <NavLink type="faq" text="FAQ" link="/#faq" />
          {!sessionStatus ? (
            <>
              <NavLink type="signin" text="Sign In" link="/signin" isNavlink />
              <NavLink
                type="signup"
                text="Get Started"
                link="/signup"
                isNavlink
              />
            </>
          ) : (
            <>
              <hr />
              <NavLink
                type="account"
                text="Account Settings"
                link="/account/change-username"
                isNavlink
              />
              <NavLink
                type="load"
                text="Load Credits"
                link="/load-credits"
                isNavlink
              />
              <NavLink
                type="history"
                text="Credit History"
                link="/credit-history"
                isNavlink
              />
              <NavLink type="logout" text="Logout" link="/" linkOnClick />
            </>
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
            <a href="mailto:kemlabels@gmail.com">
              <FaEnvelope size={16} />
              <span>kemlabels@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
