import React, { useContext, useEffect, useRef } from "react";
import axios from "../api/axios";
import { Link, NavLink, useLocation } from "react-router-dom";
import "../styles/Global.css";
import "../styles/Navbar.css";
import HamburgerMenu from "./HamburgerMenu";
import { AuthContext } from "./AuthProvider";

const useScrollToLocation = () => {
  const scrolledRef = useRef(false);
  const { hash, pathname } = useLocation();
  const hashRef = useRef(hash);

  useEffect(() => {
    if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
    if (hash) {
      // We want to reset if the hash has changed
      if (hashRef.current !== hash) {
        hashRef.current = hash;
        scrolledRef.current = false;
      }

      // only attempt to scroll if we haven't yet (this could have just reset above if hash changed)
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        scrolledRef.current = true;
      }
    }
  });
};

export default function Navbar({ hideNavAndFooter = false }) {
  useScrollToLocation();
  const {isLoggedIn, setIsLoggedIn} = useContext(AuthContext);

  return (
    <nav className={`navbar ${hideNavAndFooter ? "navHidden" : ""}`}>
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
          {!isLoggedIn && <NavLink className="navLink" to="/Signin" activeclassname="active">
            Sign In
          </NavLink>}
          {isLoggedIn && (
            <Link
              className="navLink"
              onClick={async (e) => {
                e.preventDefault();
                await axios.get('/logout', { withCredentials: true })
                setIsLoggedIn(false);
                localStorage.removeItem('isLoggedIn');
                window.location.href = '/';
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
