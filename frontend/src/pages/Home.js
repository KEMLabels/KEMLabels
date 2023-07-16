import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Home.css";
import PageLayout from "../components/PageLayout";

export default function Home() {
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    axios
      .get("/getSessionInfo", { withCredentials: true })
      .then((res) => {
        displayEmail();
      })
      .catch((err) => console.log(err));
    const displayEmail = () => {
      axios
        .get("/getUserData", { withCredentials: true })
        .then((res) => {
          setUserData(res.data.userData);
        })
        .catch((err) => console.log(err));
    };
  }, []);

  return (
    <PageLayout isLandingPage>
      <header className="header">
        <h1>Welcome</h1>
        {userData && <h2>Your email address is {userData.email}</h2>}
      </header>
      <main className="main-content">
        {/* Rest of your content goes here */}
      </main>
    </PageLayout>
  );
}
