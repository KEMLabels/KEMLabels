import React from "react";
import "../styles/Global.css";
import "../styles/Navbar.css";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navContainer">
        {/* TODO: Hamburger here */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link to="/" className="logo">
            {/* TODO: Change this to logo img later */}
            <h1>LabelMaster</h1>
          </Link>
        </div>
        <div className="navLinksContainer">
          <Link className="navLink" to="/#pricingSec">
            Pricing
          </Link>
          <Link className="navLink" to="/#faqSec">
            FAQ
          </Link>
          <Link className="navLink" to="/signin">
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
