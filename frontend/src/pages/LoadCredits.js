import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axios";
import { InputField } from "../components/Field";
import Button from "../components/Button";

export default function LoadCredits() {
  // const dispatch = useDispatch();
  // const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  // const [errMsg, setErrMsg] = useState("");

  // useEffect(() => {
  //     if (isLoggedIn) {
  //       axios
  //         .get("/getSessionInfo", {
  //           withCredentials: true,
  //         })
  //         .then((res) => {
  //           if (res.data) {
  //             window.location.href = "/";
  //           }
  //         })
  //         .catch((e) => {
  //           console.log("Error: ", e);
  //           setErrMsg(`${e.name}: ${e.message}`);
  //         });
  //     }
  //   }, [isLoggedIn]);
  return (
    <form action="POST">
      <p>Wishing to deposit how much?</p>
      <InputField
        fieldType="number"
        placeholder="Amount in USD"
      />

      <Button
        btnType="submit"
        text="Credit Card"
        customStyle={{ marginTop: "1rem" }}
      />
      <Button
        btnType="submit"
        text="Crypto Currency"
        customStyle={{ marginTop: "1rem" }}
      />
    </form>
  )
}