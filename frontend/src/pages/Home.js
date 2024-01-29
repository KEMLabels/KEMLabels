import React from "react";
import "../styles/Global.css";
import "../styles/Home.css";
import PageLayout from "../components/PageLayout";
import Accordion from "../components/Accordion";
import FaqJson from "../content/faq";

export default function Home() {
  return (
    <PageLayout
      isLandingPage
      description="Welcome to KEMLabels - Your Trusted Shipping Label Solution. Streamline your shipping process with our easy-to-use platform. Order labels, track your credit history, and manage your account effortlessly. Start shipping smarter with KEMLabels."
    >
      <div id="home" className="hero">
        <div className="heroColumn">
          <h1>
            (This works) Label Your Success,
            <br />
            Ship with Confidence
          </h1>
          <p>
            Streamline your shipping process with our easy-to-use platform.
            Order labels, track your credit history, and manage your account
            effortlessly.
          </p>
        </div>
        <div className="heroColumn">
          <img
            src="/media/hero.svg"
            width="100%"
            alt="Illustration of a delivery man."
          />
        </div>
      </div>
      <div className="homeSecContainer" id="howitworks">
        <h1>How It Works</h1>
        <p>Get started in just a few simple steps.</p>
        <div className="cardsContainer">
          <div className="card">
            <img
              src="/media/howitworks-step1.jpg"
              alt="Fund your account illutration"
            />
            <div className="cardContent">
              <h2>Fund your account</h2>
              <p>
                Load your credits by making a deposit through Stripe or Crypto.
              </p>
            </div>
          </div>
          <div className="card reverse">
            <img
              src="/media/howitworks-step2.svg"
              alt="Adding an item to cart illustration"
            />
            <div className="cardContent">
              <h2>Select a shipping label</h2>
              <p>Choose then add a shipping label item to your cart.</p>
            </div>
          </div>
          <div className="card">
            <img
              src="/media/howitworks-step3.jpg"
              alt="Delivery man illustration"
            />
            <div className="cardContent">
              <h2>Receive your shipping label</h2>
              <p>
                Once payment is processed, check your email inbox to receive
                your shipping label!
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="homeSecContainer" id="faq">
        <h1>Frequently Asked Questions</h1>
        <p>
          If you have any other questions not covered here, please feel free to
          contact us, and we'll be happy to assist you.
        </p>
        <Accordion value={FaqJson}></Accordion>
      </div>
    </PageLayout>
  );
}
