import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import AlertMessage from "../components/AlertMessageCard";

function EmailVerificationPage() {
  const [errMsg, setErrMsg] = useState("");
  useEffect(() => {
    axios.get("/isUserVerified", { withCredentials: true }).then((res) => {
      if (res.data.errMsg) setErrMsg(res.data.errMsg);
      else window.location.href = res.data.redirect;
    });
  }, []);

  return <div>{errMsg && <AlertMessage msg={errMsg} type="error" />}</div>;
}

export default EmailVerificationPage;
