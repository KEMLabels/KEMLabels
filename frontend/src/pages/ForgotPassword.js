import React, { useState } from "react";
import Button from "../components/Button";
import { BiErrorCircle } from "react-icons/bi";
import axios from "../api/axios";
import { InputField, PasswordField } from "../components/Field";

export default function ForgotPassword() {
  const [errMsg, setErrMsg] = useState("");
  const [email, setEmail] = useState("");
  const [enteredOTP, setEnteredOTP] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (email === "") {
      setErrMsg("All fields are required.");
      return;
    }
    const res = await axios.post(
      "/emailExists",
      { email },
      { withCredentials: true }
    );
    console.log(res.data);
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
    else sendResetRequest()
  };

  async function sendResetRequest() {
    const res = await axios.post(
      "/forgotpassword",
      { email },
      { withCredentials: true }
    );
    console.log(res.data);
  }

  const validateOTP = async (e) => {
    e.preventDefault();
    const res = await axios.post(
      "/checkOTP",
      { enteredOTP },
      { withCredentials: true }
    );
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
  }

  const changeUserPassword = async (e) => {
    e.preventDefault();
    const res = await axios.post(
      "/updateUserPass",
      { email, password },
      { withCredentials: true }
    );
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
    else window.location.href = res.data.redirect;
  }

  return (
    <>
      <form action="POST">
        <div className="errorMessageContainer">
          <BiErrorCircle size={24} color="#FF0033" />
          <p>{errMsg}</p>
        </div>
        <InputField
          fieldType="email"
          onChangeEvent={(e) => {
            setEmail(e.target.value);
            setErrMsg("");
          }}
          placeholder="Email"
          minLength={3}
          maxLength={100}
        />
        <Button btnType="submit" onClickEvent={submit} text="Sign in" />
      </form>

      <form action="POST">
        <InputField
          fieldType="text"
          onChangeEvent={(e) => {
            setEnteredOTP(e.target.value);
          }}
          placeholder="OTP"
        />
        <Button btnType="submit" onClickEvent={validateOTP} text="validate OTP" />
      </form>
      <form action="POST">
        <PasswordField
          onChangeEvent={(e) => {
            setPassword(e.target.value);
          }}
          placeholder="Password"
          minLength={8}
          maxLength={50}
        />
        <Button btnType="submit" onClickEvent={changeUserPassword} text="validate OTP" />
      </form>
    </>
  )
}