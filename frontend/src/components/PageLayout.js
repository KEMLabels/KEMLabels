import React from "react";
import { Helmet } from "react-helmet";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageLayout({
  title,
  description,
  isLandingPage = false,
  children,
  hideNavAndFooter = false,
}) {
  if (title && typeof document !== "undefined") {
    document.title = isLandingPage ? "KEMLabels" : `${title} | KEMLabels`;
  }
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{isLandingPage ? "KEMLabels" : `${title} | KEMLabels`}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <Navbar hideNavAndFooter={hideNavAndFooter} />
      <div
        className={`wrapper ${
          hideNavAndFooter || isLandingPage ? "navHidden" : ""
        }`}
      >
        {children}
      </div>
      {!hideNavAndFooter && <Footer />}
    </>
  );
}
