import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../styles/Global.css";
import "../styles/AccountSettings.css";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import { NavLink } from "react-router-dom";
import { InputField } from "../components/Field";
import AlertMessage from "../components/AlertMessage";
import { validateUsernameOnSubmit } from "../utils/Validation";
import axios from "../api/axios";
import { setUserName } from "../redux/actions/UserAction";

export default function AccountSettings({ currentPage = "username" }) {
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const username = useSelector((state) => state.auth.username);
  const email = useSelector((state) => state.auth.email);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [inputUserName, setInputUserName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");

  useEffect(() => {
    if (!isLoggedIn) window.location.href = "/";
  }, [isLoggedIn]);

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
        return null;
      case "password":
        return null;
      default:
      case "username":
        return (
          <InputField
            onChangeEvent={(e) => {
              setInputUserName(e.target.value);
              setErrMsg("");
              setSuccessMsg("");
            }}
            placeholder="Username"
            minLength={3}
            maxLength={15}
          />
        );
    }
  }

  const saveChanges = (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateUsernameOnSubmit(inputUserName, setErrMsg)) {
      setLoading(false);
      return;
    }

    // TODO: Add this call in backend to update username
    // TODO: if the user has already changed their username
    // in the past 24 hours send an error message, do this in the backend?
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
          window.location.href = "/account/change-username";
          setSuccessMsg("Username updated successfully.");
        };
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
  };

  return (
    <PageLayout title="Account Settings">
      <div className="settingsContainer">
        <h1>Account settings</h1>
        <div className="settingsInnerContainer">
          <div className="settingsSidebar">
            <NavLink
              className="link"
              to="/account/change-username"
              onClick={() => {
                setInputEmail("");
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
            <form action="POST" className="settingsFieldContainer">
              {renderField()}
              <Button
                btnType="submit"
                disabled={!inputUserName}
                loading={loading}
                text="Save changes"
                onClickEvent={saveChanges}
                customStyle={{ width: "100%", maxWidth: "300px" }}
              />
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
