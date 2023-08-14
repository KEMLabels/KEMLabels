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
import { InputField, PasswordField } from "../components/Field";
import AlertMessage from "../components/AlertMessage";
import {
  validateEmailOnSubmit,
  validatePasswordOnSubmit,
  validateUsernameOnSubmit,
} from "../utils/Validation";
import axios from "../api/axios";
import { clearSession, setUserName } from "../redux/actions/UserAction";
import { validatePasswordOnTyping } from "../utils/Helpers";

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
  const [sendVerificationEmail, setSendVerificationEmail] = useState(false);
  const [showOTPField, setShowOTPField] = useState(false);
  const [enteredOTP, setEnteredOTP] = useState("");
  const [currentInputPassword, setCurrentInputPassword] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [confirmInputPassword, setConfirmInputPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState({
    length: true,
    uppercase: true,
    number: true,
    specialChar: true,
  });

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

  function clearMessages() {
    setSuccessMsg("");
    setInfoMsg("");
    setErrMsg("");
  }

  function resetEmailFields() {
    setInputEmail("");
    setConfirmInputEmail("");
    setSendVerificationEmail(false);
    setShowOTPField(false);
    setEnteredOTP("");
  }

  function resetPasswordFields() {
    setInputPassword("");
    setCurrentInputPassword("");
    setConfirmInputPassword("");
    setPasswordValid({
      length: true,
      uppercase: true,
      number: true,
      specialChar: true,
    });
    setSendVerificationEmail(false);
    setShowOTPField(false);
    setEnteredOTP("");
  }

  //#region Change username helper functions
  function updateUsernameCall(e) {
    e.preventDefault();
    setLoading(true);

    if (inputUserName === "") {
      setErrMsg("Please fill out the required field.");
      setLoading(false);
      return;
    }

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
          setSuccessMsg("Username updated successfully.");
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (
          e?.response?.data?.msg ===
            "This username is already associated with an account." ||
          e?.response?.data?.msg ===
            "You cannot change your username to the same one you currently have." ||
          e?.response?.data?.msg.startsWith("You must wait")
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
  function updateEmailCall() {
    axios
      .post(
        "/updateEmailAddress",
        { newEmail: confirmInputEmail },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });
  }

  // Send OTP to new email and notice to old email
  function sendEmailVerificationCode(e) {
    e.preventDefault();
    setLoading(true);

    if (inputEmail === "" || confirmInputEmail === "") {
      setErrMsg("Please fill out all required fields.");
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

    axios
      .post(
        "/sendEmailChangeConfirmation",
        { newEmail: confirmInputEmail },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res);
        setInfoMsg(
          `A confirmation email with instructions has been sent to ${confirmInputEmail}.`
        );
        setErrMsg("Please wait a moment to send another email...");
        setSendVerificationEmail(true);
        setShowOTPField(true);
        setTimeout(() => {
          setSendVerificationEmail(false);
          setErrMsg("");
        }, 15000);
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (
          e?.response?.data?.msg ===
            "You cannot change your email to the one you currently have." ||
          e?.response?.data?.msg ===
            "This email is already associated with an account."
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

  //#region Change email and password helper functions
  // Confirm email or password change via OTP
  function validateOTP(e) {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    axios
      .post(
        "/checkOTP",
        {
          enteredOTP,
          email: currentPage === "email" ? confirmInputEmail : email,
        },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res);
        if (currentPage === "email") {
          updateEmailCall();
          setSuccessMsg(
            "Verification successful and your email has been updated! Redirecting you to the login page..."
          );
        } else if (currentPage === "password") {
          updatePasswordCall();
          setSuccessMsg(
            "Verification successful and your password has been updated!! Redirecting you to the login page..."
          );
        }
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

  // Resend email request for change email and password
  function sendResendRequest(e) {
    e.preventDefault();
    if (currentPage === "email") {
      setInfoMsg(
        `A confirmation email with instructions has been sent to ${confirmInputEmail}.`
      );
    } else {
      setInfoMsg(
        `A confirmation email with instructions has been sent to ${email}.`
      );
    }
    setErrMsg("Please wait a moment to send another email...");
    setSendVerificationEmail(true);

    axios
      .post(
        "/generateNewOTP",
        {
          email: currentPage === "email" ? confirmInputEmail : email,
          type: currentPage === "email" ? "changeEmail" : "changePassword",
        },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res.data);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      })
      .finally(() => {
        setTimeout(() => {
          setSendVerificationEmail(false);
          setErrMsg("");
        }, 15000);
      });
  }
  //#endregion

  //#region Change password helper functions
  function updatePasswordCall() {
    axios
      .post(
        "/updateUserPass",
        { email: email, password: confirmInputPassword },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });
  }

  // Send OTP to email
  function sendPasswordVerificationCode(e) {
    e.preventDefault();
    setLoading(true);

    if (
      currentInputPassword === "" ||
      inputPassword === "" ||
      confirmInputPassword === ""
    ) {
      setErrMsg("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    if (!validatePasswordOnSubmit(inputPassword, setErrMsg)) {
      setLoading(false);
      return;
    }

    if (inputPassword !== confirmInputPassword) {
      setErrMsg("New passwords don't match. Please try again.");
      setLoading(false);
      return;
    }

    axios
      .post(
        "/sendPasswordChangeConfirmation",
        {
          eneteredPassword: currentInputPassword,
          newPassword: confirmInputPassword,
        },
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res);
        setInfoMsg(
          `A confirmation email with instructions has been sent to ${email}.`
        );
        setErrMsg("Please wait a moment to send another email...");
        setSendVerificationEmail(true);
        setShowOTPField(true);
        setTimeout(() => {
          setSendVerificationEmail(false);
          setErrMsg("");
        }, 15000);
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (
          e?.response?.data?.msg ===
            "Looks like you have entered the same password that you are using now. Please enter a differernt password." ||
          e?.response?.data?.msg ===
            "Hmm... your current password is incorrect. Please try again."
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
            <p>
              To change your password, please update the fields below and follow
              the instructions when you receive a confirmation email.
            </p>
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
                    clearMessages();
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
                    clearMessages();
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
                    clearMessages();
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
                  onClickEvent={sendResendRequest}
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
                  !showOTPField ? sendEmailVerificationCode : validateOTP
                }
                customStyle={{ width: "100%", maxWidth: "300px" }}
              />
            </div>
          </form>
        );
      case "password":
        return (
          <form action="POST" className="settingsFieldContainer">
            {!showOTPField ? (
              <>
                <PasswordField
                  containerClassName="settingsField"
                  onChangeEvent={(e) => {
                    setCurrentInputPassword(e.target.value);
                    clearMessages();
                  }}
                  currentValue={currentInputPassword}
                  placeholder="Current password"
                  minLength={8}
                  maxLength={50}
                />
                <PasswordField
                  containerClassName="settingsField"
                  onChangeEvent={(e) => {
                    setInputPassword(e.target.value);
                    validatePasswordOnTyping(e.target.value, setPasswordValid);
                    clearMessages();
                  }}
                  currentValue={inputPassword}
                  placeholder="New password"
                  minLength={8}
                  maxLength={50}
                />
                <PasswordField
                  containerClassName="settingsField"
                  onChangeEvent={(e) => {
                    setConfirmInputPassword(e.target.value);
                    clearMessages();
                  }}
                  currentValue={confirmInputPassword}
                  placeholder="Confirm new password"
                  minLength={8}
                  maxLength={50}
                />
                <div
                  className="passwordRequirements"
                  style={{ paddingBottom: "3rem" }}
                >
                  <p>Password must include:</p>
                  <ul>
                    <li
                      className={passwordValid.length ? "" : "invalidPassword"}
                    >
                      8 - 50 characters
                    </li>
                    <li
                      className={
                        passwordValid.uppercase ? "" : "invalidPassword"
                      }
                    >
                      1 uppercase letter
                    </li>
                    <li
                      className={passwordValid.number ? "" : "invalidPassword"}
                    >
                      1 number
                    </li>
                    <li
                      className={
                        passwordValid.specialChar ? "" : "invalidPassword"
                      }
                    >
                      1 special character
                    </li>
                  </ul>
                </div>
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
                    clearMessages();
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
                  onClickEvent={sendResendRequest}
                  customStyle={{ width: "100%", maxWidth: "300px" }}
                />
              )}
              <Button
                btnType="submit"
                disabled={
                  !currentInputPassword ||
                  !inputPassword ||
                  !confirmInputPassword ||
                  (showOTPField && enteredOTP.length !== 4)
                }
                loading={loading}
                text={
                  !showOTPField ? "Send verification code" : "Confirm changes"
                }
                onClickEvent={
                  !showOTPField ? sendPasswordVerificationCode : validateOTP
                }
                customStyle={{ width: "100%", maxWidth: "300px" }}
              />
            </div>
          </form>
        );
      default:
      case "username":
        return (
          <form action="POST" className="settingsFieldContainer">
            <InputField
              onChangeEvent={(e) => {
                setInputUserName(e.target.value);
                clearMessages();
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
                resetPasswordFields();
                clearMessages();
                navigate("/account/change-email");
                break;
              case "Change password":
                setInputUserName("");
                resetEmailFields();
                clearMessages();
                navigate("/account/change-password");
                break;
              default:
              case "Change username":
                resetEmailFields();
                resetPasswordFields();
                clearMessages();
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
                resetEmailFields();
                resetPasswordFields();
                clearMessages();
              }}
            >
              Change username
            </NavLink>
            <NavLink
              className="link"
              to="/account/change-email"
              onClick={() => {
                setInputUserName("");
                resetPasswordFields();
                clearMessages();
              }}
            >
              Change email
            </NavLink>
            <NavLink
              className="link"
              to="/account/change-password"
              onClick={() => {
                setInputUserName("");
                resetEmailFields();
                clearMessages();
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
