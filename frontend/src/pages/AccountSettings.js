import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "react-dropdown";
import VerificationInput from "react-verification-input";
import "../styles/Global.css";
import "../styles/Auth.css";
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
  const [infoMsg, setInfoMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [inputUserName, setInputUserName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [confirmInputEmail, setConfirmInputEmail] = useState("");
  const [sendVerificationEmail, setVerificationEmail] = useState(false);
  const [showOTPField, setShowOTPField] = useState(false);
  const [enteredOTP, setEnteredOTP] = useState("");
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

  //#region Change username helper functions
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
          "You cannot change your username to the one you currently have." ||
          e?.response?.data?.msg.startsWith('You must wait')
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
  //#endregion

  //#region Change email helper functions
  // TODO: Fix this OTP email since its sent to NEW email
  // Confirm email change via OTP
  function validateOTP(e) {
    e.preventDefault();
    setLoading(true);
    setInfoMsg("");
    setErrMsg("");

    axios
      .post("/checkOTP", { enteredOTP, email: confirmInputEmail }, { withCredentials: true })
      .then((res) => {
        console.log(res);
        axios
          .post("/updateEmailAddress", { newEmail: confirmInputEmail }, { withCredentials: true })
          .then((res) => {
            console.log(res);
          })
          .catch((e) => {
            console.log("Error: ", e);
            setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
          })
        setSuccessMsg(
          "Verification successful and your email has been updated! Redirecting you to the login page..."
        );
        setTimeout(() => {
          setSuccessMsg("");
          axios.get("/logout", { withCredentials: true });
          dispatch(clearSession());
          navigate("/signin");
        }, 3000);
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (
          e?.response?.data?.msg ===
          "Hmm... your code was incorrect. Please try again."
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

  // TODO: Fix axios call here to resend OTP to NEW email
  function sendResetRequest(e) {
    e.preventDefault();
    setInfoMsg(
      `A confirmation email with instructions has been sent to ${confirmInputEmail}.`
    );
    setErrMsg("Please wait to re-send another email.");
    setVerificationEmail(true);

    axios
      .post("/generateNewOTP", { email: confirmInputEmail }, { withCredentials: true })
      .then((res) => {
        console.log(res.data);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      })
      .finally(() => {
        setTimeout(() => {
          setVerificationEmail(false);
          setErrMsg("");
        }, 15000);
      });
  }

  // TODO: Update user's NEW email in the /sendEmailChangeConfirmation call
  // NEW EMAIL: {confirmInputEmail}, OLD EMAIL: {email}
  // Send OTP to new email and notice to old email
  function sendVerificationCode(e) {
    e.preventDefault();
    setLoading(true);

    if (inputEmail === "" || confirmInputEmail === "") {
      setErrMsg("All fields are required.");
      setLoading(false);
      return;
    }

    if (
      !validateEmailOnSubmit(inputEmail, setErrMsg) ||
      !validateEmailOnSubmit(confirmInputEmail, setErrMsg)
    ) {
      setLoading(false);
      return;
    }

    if (inputEmail !== confirmInputEmail) {
      setErrMsg("Emails don't match. Please try again.");
      setLoading(false);
      return;
    }

    // TODO: Add this call in backend that sends email to new and old email (2 different emails)
    axios
      .post("/sendEmailChangeConfirmation", { newEmail: confirmInputEmail }, { withCredentials: true })
      .then((res) => {
        console.log(res);
        setInfoMsg(
          `A confirmation email with instructions has been sent to ${confirmInputEmail}.`
        );
        setErrMsg("Please wait to re-send another email.");
        setVerificationEmail(true);
        setShowOTPField(true);
        setTimeout(() => {
          setVerificationEmail(false);
          setErrMsg("");
        }, 15000);
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (
          e?.response?.data?.msg ===
          "You cannot change your username to the one you currently have." ||
          e?.response?.data?.msg ===
          "This username is already associated with an account."
        ) {
          setErrMsg(e.response.data.msg);
        } else {
          setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
        }
      })
      .finally(() => {
        setLoading(false);
      });

    setLoading(false); // Remove this later since its in the .finally in Axios call
  }
  //#endregion

  function renderHeading() {
    switch (currentPage) {
      case "email":
        return (
          <div className="headings">
            <h2>Change email</h2>
            <p>
              Your current email is <strong>{email}.</strong> To change your
              email, please update the fields below and follow the instructions
              when you receive a confirmation email.
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
            {!showOTPField ? (
              <>
                <InputField
                  fieldType="email"
                  containerClassName="settingsField"
                  onChangeEvent={(e) => {
                    setInputEmail(e.target.value);
                    setErrMsg("");
                    setInfoMsg("");
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
                    setInfoMsg("");
                    setSuccessMsg("");
                  }}
                  currentValue={confirmInputEmail}
                  placeholder="Confirm new email"
                  minLength={3}
                  maxLength={100}
                />
              </>
            ) : (
              <div className="otpContainer">
                <VerificationInput
                  length={4}
                  autoFocus
                  placeholder="*"
                  validChars="0-9"
                  classNames={{
                    container: "otpInputContainer",
                    character: "otpText",
                    characterInactive: "inactiveText",
                    characterSelected: "selectedText",
                  }}
                  onChange={(value) => {
                    setEnteredOTP(value);
                    setErrMsg("");
                    setInfoMsg("");
                    setSuccessMsg("");
                  }}
                />
              </div>
            )}
            <div className="btnGroup">
              {showOTPField && (
                <Button
                  fill="outline"
                  disabled={sendVerificationEmail}
                  loading={sendVerificationEmail}
                  text="Resend email"
                  onClickEvent={sendResetRequest}
                  customStyle={{ width: "100%", maxWidth: "300px" }}
                />
              )}
              <Button
                btnType="submit"
                disabled={
                  !inputEmail ||
                  !confirmInputEmail ||
                  (showOTPField && enteredOTP.length !== 4)
                }
                loading={loading}
                text={
                  !showOTPField ? "Send verification code" : "Confirm changes"
                }
                onClickEvent={
                  !showOTPField ? sendVerificationCode : validateOTP
                }
                customStyle={{ width: "100%", maxWidth: "300px" }}
              />
            </div>
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
              text="Confirm changes"
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
                setInputUserName("");
                setInputPassword("");
                setSuccessMsg("");
                setInfoMsg("");
                setErrMsg("");
                navigate("/account/change-email");
                break;
              case "Change password":
                setInputUserName("");
                setInputEmail("");
                setConfirmInputEmail("");
                setShowOTPField(false);
                setSuccessMsg("");
                setInfoMsg("");
                setErrMsg("");
                navigate("/account/change-password");
                break;
              default:
              case "Change username":
                setInputEmail("");
                setConfirmInputEmail("");
                setShowOTPField(false);
                setInputPassword("");
                setSuccessMsg("");
                setInfoMsg("");
                setErrMsg("");
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
                setShowOTPField(false);
                setInputPassword("");
                setSuccessMsg("");
                setInfoMsg("");
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
                setInfoMsg("");
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
                setShowOTPField(false);
                setSuccessMsg("");
                setInfoMsg("");
                setErrMsg("");
              }}
            >
              Change password
            </NavLink>
          </div>
          <div className="settingsContent">
            {renderHeading()}
            {errMsg && <AlertMessage msg={errMsg} type="error" />}
            {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
            {successMsg && <AlertMessage msg={successMsg} type="success" />}
            {renderField()}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
