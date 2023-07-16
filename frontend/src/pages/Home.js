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
      <div className="hero">
        <div className="heroColumn">
          {/* TOOD: Replace text afterwards */}
          <h1 style={{ color: "white", fontSize: "3rem" }}>Welcome to LabelMaster</h1>
          {userData && <h2 style={{ color: "white", fontWeight: 400 }}>Your email address is {userData.email}</h2>}
        </div>
        <div className="heroColumn">
          <img src="/media/hero.svg" width="100%" alt="Illustration of a delivery man."/>
        </div> 
      </div>
      <div id="faq">
        
      </div>
    </PageLayout>
  );
}
