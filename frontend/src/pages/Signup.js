import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Global.css";
import Navbar from "../components/Navbar";

function Signup() {
  const history = useNavigate();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e) {
    e.preventDefault();

    try {
      await axios
        .post("http://localhost:8081/Signup", {
          userName,
          email,
          password,
        })
        .then((res) => {
          if ((res.data = "exists")) {
            history("/Signin");
          } else {
            alert("NOT WORKING!!!");
          }
        })
        .catch((e) => {
          alert("wrong details");
          console.log(e);
        });
    } catch {
      console.log(e);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="wrapper">
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
      </div>
    </div>
  );
}

export default Signup;
