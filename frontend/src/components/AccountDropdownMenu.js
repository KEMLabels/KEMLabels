import React from "react";
import "../styles/Global.css";
import "../styles/Navbar.css";
import AccountDropdownLink from "./AccountDropdownLink";

export default function AccountDropdownMenu({
  dropdownMenuRef,
  hideAccountDropdown,
  animateDropdown,
  joinedDate,
  creditAmount,
  username,
}) {
  const dateString = new Date(joinedDate).toDateString().split(" ");
  const month = dateString[1];
  const day = dateString[2];
  const year = dateString[3];

  return (
    <div
      className={`dropdownContent ${hideAccountDropdown ? "hidden" : ""} ${
        animateDropdown ? "activateAnimation" : ""
      }`}
      ref={dropdownMenuRef}
    >
      <div className="dropdownProfileDetails">
        <div className="profileDetailsRow username">
          <p className="profileDetailsLabel">User:</p>
          <p className="profileDetailsValue">{`@${username}`}</p>
        </div>
        <div className="profileDetailsRow">
          <p className="profileDetailsLabel">Credits:</p>
          <p className="profileDetailsValue">{`$${Number(creditAmount).toFixed(2)}`}</p>
        </div>
        <div className="profileDetailsRow">
          <p className="profileDetailsLabel">Members since:</p>
          <p className="profileDetailsValue">{`${month} ${day}, ${year}`}</p>
        </div>
      </div>

      <hr />

      <AccountDropdownLink
        type="account"
        text="Account settings"
        link="/account/change-username"
      />
      <AccountDropdownLink
        type="load"
        text="Load credits"
        link="/loadcredits"
      />
      <AccountDropdownLink
        type="history"
        text="Credit history"
        link="/creditshistory"
      />
      <AccountDropdownLink type="logout" text="Logout" link="/" />
    </div>
  );
}
