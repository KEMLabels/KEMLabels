import React from "react";
import "../styles/Global.css";
import "../styles/Home.css";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div>
      <Navbar />
      <div className="wrapper">
        <header className="header">
          <h1>Welcome</h1>
        </header>
        <main className="main-content">
          {/* Rest of your content goes here */}
        </main>
      </div>
    </div>
  );
}

export default Home;
