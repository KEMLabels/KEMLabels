import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axios";
import { InputField } from "../components/Field";
import Button from "../components/Button";

export default function LoadCredits() {

  //make sure user is logged in
  //store amount and send to credit card or coinbase

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