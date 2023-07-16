import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios.js";
import "../styles/Global.css";
import PageLayout from "../components/PageLayout.js";

export default function Signup() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/getSessionInfo", { withCredentials: true })
      .then((res) => {
        if (res.data.isLoggedIn) {
          window.location.href = "/";
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const res = await axios.post(
      "/Signup",
      { userName, email, password },
      { withCredentials: true }
    );
    window.location.href = res.data.redirect;
  };

  if (isLoading) return;
  return (
    <PageLayout title="Sign Up">
      <div className="signup">
        <form action="POST">
          <input
            type="text"
            onChange={(e) => {
              setUserName(e.target.value);
            }}
            placeholder="userName"
            name=""
            id=""
          />
          <input
            type="text"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="Email"
            name=""
            id=""
          />
          <input
            type="text"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Password"
            name=""
            id=""
          />

          <input type="submit" onClick={submit} />
        </form>
        <br />
        <p>
          If you have an account you can login: <Link to="/signin">Here</Link>
        </p>
        <br />
      </div>
    </PageLayout>
  );
}
