import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { PiUserCircleFill } from "react-icons/pi";
import { HiOutlineChevronDown } from "react-icons/hi";
import "../styles/Global.css";
import "../styles/Navbar.css";
import HamburgerMenu from "./HamburgerMenu";
import Button from "./Button";
import AccountDropdownMenu from "./AccountDropdownMenu";

const useScrollToLocation = () => {
  const scrolledRef = useRef(false);
  const { hash, pathname } = useLocation();
  const hashRef = useRef(hash);

  useEffect(() => {
    if (pathname === "/" && !hash)
      window.scrollTo({ top: 0, behavior: "smooth" });
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
  }, [hash, pathname]);
};

// Checks if user clicks outside of dropdown menu
function useOutsideAlerter(
  dropdownMenuRef,
  accountIconContainerRef,
  hideAccountDropdown,
  toggleDropdownMenu
) {
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        !hideAccountDropdown &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(e.target) &&
        accountIconContainerRef.current &&
        !accountIconContainerRef.current.contains(e.target)
      ) {
        toggleDropdownMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    dropdownMenuRef,
    accountIconContainerRef,
    hideAccountDropdown,
    toggleDropdownMenu,
  ]);
}

export default function Navbar({ hideNavAndFooter = false }) {
  const navigate = useNavigate();

  const dropdownMenuRef = useRef(null);
  const accountIconContainerRef = useRef(null);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const username = useSelector((state) => state.auth.username);
  const creditAmount = useSelector((state) => state.auth.creditAmount);
  const joinedDate = useSelector((state) => state.auth.joinedDate);

  const [loading, setLoading] = useState(false);
  const [hideAccountDropdown, setHideAccountDropdown] = useState(true);
  const [animateDropdown, setAnimateDropdown] = useState(false);

  useScrollToLocation();

  const toggleDropdownMenu = () => {
    setHideAccountDropdown((prevState) => !prevState);
    setAnimateDropdown(!animateDropdown);
  };

  useOutsideAlerter(
    dropdownMenuRef,
    accountIconContainerRef,
    hideAccountDropdown,
    toggleDropdownMenu
  );

  return (
    <nav className={`navbar ${hideNavAndFooter ? "navHidden" : ""}`}>
      <div className="navContainer">
        <HamburgerMenu sessionStatus={isLoggedIn} />
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link to="/" className="logo">
            <img src="/logo.svg" alt="KEMLabels logo" />
          </Link>
        </div>
        <div className="navLinksContainer">
          <Link className="navLink" to="/#howitworks">
            How It Works
          </Link>
          <Link className="navLink" to="/#faq">
            FAQ
          </Link>
          {!isLoggedIn && (
            <>
              <NavLink
                className="navLink"
                to="/signin"
                activeclassname="active"
              >
                Sign In
              </NavLink>
              <Button
                onClickEvent={() => {
                  setLoading(true);
                  setTimeout(() => {
                    navigate("/signup");
                  }, 100);
                }}
                text={"Get Started"}
                loading={loading}
                customStyle={{
                  padding: "6px 12px",
                  marginLeft: "-1rem",
                  minWidth: "7.2rem",
                }}
              />
            </>
          )}
          {isLoggedIn && (
            <>
              <NavLink
                className="navLink"
                to="/order-label"
                activeclassname="active"
              >
                Order a Label
              </NavLink>
              <div
                className="accountIconContainer"
                ref={accountIconContainerRef}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdownMenu();
                }}
              >
                <PiUserCircleFill className="accountIcon" />
                <p className="navLink">{username}</p>
                <HiOutlineChevronDown className="dropdownIcon" />
              </div>
              <AccountDropdownMenu
                dropdownMenuRef={dropdownMenuRef}
                hideAccountDropdown={hideAccountDropdown}
                animateDropdown={animateDropdown}
                joinedDate={joinedDate}
                creditAmount={creditAmount}
                username={username}
              />
            </>
          )}
        </div>
        <div className="navCorner" />
      </div>
    </nav>
  );
}
