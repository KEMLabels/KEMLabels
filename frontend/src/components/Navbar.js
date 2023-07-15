import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { Link, NavLink } from "react-router-dom";
import "../styles/Global.css";
import "../styles/Navbar.css";
import HamburgerMenu from "./HamburgerMenu";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios
      .get("/getSessionInfo", { withCredentials: true })
      .then((res) => {
        res.data.isLoggedIn ? setIsLoggedIn(true) : setIsLoggedIn(false);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <nav className="navbar">
      <div className="navContainer">
        <HamburgerMenu sessionStatus={isLoggedIn} />
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link to="/" className="logo">
            {/* TODO: Change this to logo img later */}
            <h1>LabelMaster</h1>
          </Link>
        </div>
        <div className="navLinksContainer">
          <Link className="navLink" to="/#pricing">
            Pricing
          </Link>
          <Link className="navLink" to="/#faq">
            FAQ
          </Link>
          <NavLink className="navLink" to="/Signin" activeClassName="active">
            Sign In
          </NavLink>
          {isLoggedIn && (
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
        <div className="navCorner" />
      </div>
    </nav>
  );
}

export default Navbar;
