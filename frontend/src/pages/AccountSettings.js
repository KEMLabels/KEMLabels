import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "react-dropdown";
import "../styles/Global.css";
import "../styles/AccountSettings.css";
import "react-dropdown/style.css";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import { NavLink, useNavigate } from "react-router-dom";
import { InputField } from "../components/Field";
import AlertMessage from "../components/AlertMessage";
import {
  validateEmailOnSubmit,
  validateUsernameOnSubmit,
} from "../utils/Validation";
import axios from "../api/axios";
import { clearSession, setUserName } from "../redux/actions/UserAction";

export default function AccountSettings({ currentPage = "username" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const username = useSelector((state) => state.auth.username);
  const email = useSelector((state) => state.auth.email);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [inputUserName, setInputUserName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [confirmInputEmail, setConfirmInputEmail] = useState("");
  const [startVerifyEmailTimer, setStartVerifyEmailTimer] = useState("");
  const [resentEmail, setResentEmail] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const dropdownSettingsOptions = useMemo(
    () => [
      { label: "Change username", value: "change-username" },
      { label: "Change email", value: "change-email" },
      { label: "Change password", value: "change-password" },
    ],
    []
  );
  const [dropdownSettingsValue, setDropdownSettingsValue] = useState(
    dropdownSettingsOptions[0]
  );

  useEffect(() => {
    if (!isLoggedIn) navigate("/");

    switch (currentPage) {
      case "email":
        return setDropdownSettingsValue(dropdownSettingsOptions[1].label);
      case "password":
        return setDropdownSettingsValue(dropdownSettingsOptions[2].label);
      default:
      case "username":
        return setDropdownSettingsValue(dropdownSettingsOptions[0].label);
    }
  }, [isLoggedIn, currentPage, dropdownSettingsOptions, navigate]);

  // TODO: Not working, throwing an unexpected error from backend, maybe cuz its running every 5 seconds?
  // Check if user's new email is verified every second
  useEffect(() => {
    function checkIsUserEmailVerified() {
      axios
        .get("/checkVerification", {
          withCredentials: true,
        })
        .then((res) => {
          if (!res.data.errMsg) {
            setStartVerifyEmailTimer(false);
            setSuccessMsg(
              "Email updated successfully. Redirecting you to login page ..."
            );
            setTimeout(async () => {
              setSuccessMsg("");
              await axios.get("/logout", { withCredentials: true });
              dispatch(clearSession());
              navigate("/login");
            }, 3000);
          }
        })
        .catch((e) => {
          console.log("Error: ", e);
          if (e?.response?.data?.msg !== "User is not verified") {
            setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
          }
        });
    }

    let intervalId;
    if (startVerifyEmailTimer)
      intervalId = setInterval(checkIsUserEmailVerified, 5000);
    else return () => clearInterval(intervalId);
  }, [startVerifyEmailTimer, dispatch, navigate]);

  // TODO: Add this call in backend to update username
  // TODO: if the user has already changed their username
  // in the past 24 hours send an error message, do this in the backend?
  // TODO: Add the checks in the catch statements for the backend with same error messages
  function updateUsernameCall(e) {
    e.preventDefault();
    setLoading(true);

    if (!validateUsernameOnSubmit(inputUserName, setErrMsg)) {
      setLoading(false);
      return;
    }

    axios
      .post(
        "/UpdateUsername",
        { userName: inputUserName },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res);
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          dispatch(setUserName(inputUserName));
          navigate("/account/change-username");
          setSuccessMsg("Username updated successfully."); // TODO for Towa: Check if this works
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (
          e?.response?.data?.msg ===
            "This username is already associated with an account." ||
          e?.response?.data?.msg ===
            "You have already changed your username once in the past 24 hours. Please try again later."
        ) {
          setErrMsg(e.response.data.msg);
        } else {
          setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // TODO: Update user's NEW email in the /generateToken call with confirmInputEmail
  // Request a new email verification link
  function sendEmailVerificationLink(e) {
    e.preventDefault();
    setLoading(true);

    if (inputEmail === "" || confirmInputEmail === "") {
      setErrMsg("All fields are required.");
      setLoading(false);
      return;
    }

    if (!validateEmailOnSubmit(inputEmail, setErrMsg)) {
      setLoading(false);
      return;
    }

    if (inputEmail !== confirmInputEmail) {
      setErrMsg("Emails don't match. Please try again.");
      setLoading(false);
      return;
    }

    setErrMsg("Please wait to re-send another email");
    setResentEmail(true);
    setStartVerifyEmailTimer(true);

    axios
      .get("/generateToken", { withCredentials: true })
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });

    setTimeout(() => {
      setResentEmail(false);
      setLoading(false);
      setErrMsg("");
    }, 15000);
  }

  function renderHeading() {
    switch (currentPage) {
      case "email":
        return (
          <div className="headings">
            <h2>Change email</h2>
            <p>
              Your current email is <strong>{email}.</strong> To change your
              email, please update the field below.
            </p>
          </div>
        );
      case "password":
        return (
          <div className="headings">
            <h2>Change password</h2>
            <p>To change your password, please update the fields below.</p>
          </div>
        );
      default:
      case "username":
        return (
          <div className="headings">
            <h2>Change username</h2>
            <p>
              Your current username is <strong>@{username}.</strong> To change
              your username, please update the field below.
            </p>
          </div>
        );
    }
  }

  function renderField() {
    switch (currentPage) {
      case "email":
        return (
          <form action="POST" className="settingsFieldContainer">
            <InputField
              fieldType="email"
              containerClassName="settingsField"
              onChangeEvent={(e) => {
                setInputEmail(e.target.value);
                setErrMsg("");
                setSuccessMsg("");
              }}
              currentValue={inputEmail}
              placeholder="New email"
              minLength={3}
              maxLength={100}
            />
            <InputField
              fieldType="email"
              containerClassName="settingsField"
              onChangeEvent={(e) => {
                setConfirmInputEmail(e.target.value);
                setErrMsg("");
                setSuccessMsg("");
              }}
              currentValue={confirmInputEmail}
              placeholder="Confirm new email"
              minLength={3}
              maxLength={100}
            />
            <Button
              btnType="submit"
              disabled={!inputEmail || !confirmInputEmail || resentEmail}
              loading={loading}
              text="Send verification link"
              onClickEvent={sendEmailVerificationLink}
              customStyle={{ width: "100%", maxWidth: "300px" }}
            />
          </form>
        );
      case "password":
        return null;
      default:
      case "username":
        return (
          <form action="POST" className="settingsFieldContainer">
            <InputField
              onChangeEvent={(e) => {
                setInputUserName(e.target.value);
                setErrMsg("");
                setSuccessMsg("");
              }}
              containerClassName="settingsField"
              currentValue={inputUserName}
              placeholder="New username"
              minLength={3}
              maxLength={15}
            />
            <Button
              btnType="submit"
              disabled={!inputUserName}
              loading={loading}
              text="Save changes"
              onClickEvent={updateUsernameCall}
              customStyle={{ width: "100%", maxWidth: "300px" }}
            />
          </form>
        );
    }
  }

  return (
    <PageLayout title="Account Settings">
      <div className="settingsContainer">
        <h1>Account settings</h1>
        <Dropdown
          className="settingsDropdown"
          controlClassName="settingsDropdownControl"
          menuClassName="settingsDropdownMenu"
          options={dropdownSettingsOptions}
          onChange={(e) => {
            switch (e.label) {
              case "Change email":
                navigate("/account/change-email");
                break;
              case "Change password":
                navigate("/account/change-password");
                break;
              default:
              case "Change username":
                navigate("/account/change-username");
                break;
            }
          }}
          value={dropdownSettingsOptions.find(
            (option) => option.label === dropdownSettingsValue
          )}
          placeholder="Select an option"
        />
        <div className="settingsInnerContainer">
          <div className="settingsSidebar">
            <NavLink
              className="link"
              to="/account/change-username"
              onClick={() => {
                setInputEmail("");
                setConfirmInputEmail("");
                setInputPassword("");
                setSuccessMsg("");
                setErrMsg("");
              }}
            >
              Change username
            </NavLink>
            <NavLink
              className="link"
              to="/account/change-email"
              onClick={() => {
                setInputUserName("");
                setInputPassword("");
                setSuccessMsg("");
                setErrMsg("");
              }}
            >
              Change email
            </NavLink>
            <NavLink
              className="link"
              to="/account/change-password"
              onClick={() => {
                setInputUserName("");
                setInputEmail("");
                setConfirmInputEmail("");
                setSuccessMsg("");
                setErrMsg("");
              }}
            >
              Change password
            </NavLink>
          </div>
          <div className="settingsContent">
            {renderHeading()}
            {errMsg && <AlertMessage msg={errMsg} type="error" />}
            {successMsg && <AlertMessage msg={successMsg} type="success" />}
            {renderField()}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
