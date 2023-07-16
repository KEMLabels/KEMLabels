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
    document.title = isLandingPage ? "LabelMaster" : `${title} | LabelMaster`;
  }
  return (
    <>
      <Helmet>
        <title>
          {isLandingPage ? "LabelMaster" : `${title} | LabelMaster`}
        </title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <Navbar hideNavAndFooter={hideNavAndFooter} />
      <div className={`wrapper ${hideNavAndFooter ? "navHidden" : ""}`}>{children}</div>
      {!hideNavAndFooter && <Footer />}
    </>
  );
}
