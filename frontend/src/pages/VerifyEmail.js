import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";

function VerifyEmail() {
  const [validURL, setvalidURL] = useState(false);
  const param = useParams();

  useEffect(() => {
    const url = `http://localhost:8081/users/${param.id}/verify/${param.token}`;
    axios
      .get(url, { withCredentials: true })
      .then((res) => {
        console.log(res);
        setvalidURL(true);
      })
      .catch((err) => setvalidURL(false));
  }, [param]);

  return <div>{validURL ? <h1>EMAIL VERIFIED</h1> : <h1>NOT FOUND</h1>}</div>;
}

export default VerifyEmail;
