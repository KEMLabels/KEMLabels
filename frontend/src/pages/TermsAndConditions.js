import React from "react";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";

export default function TermsAndConditions() {
  return (
    <PageLayout title="Terms and Conditions">
      <div className="globalContainer">
        <div className="headingContainer">
          <h1>Terms and Conditions</h1>
          <p>Effective Date: July 30, 2023</p>
        </div>

        <p>
          Welcome to KEMLabels! By using our website, mobile applications, and
          services, you agree to these Terms and Conditions. Please review them
          before using our services.
        </p>

        <h2>Use of Services</h2>
        <ul>
          <li>
            Age Requirement: You must be at least 18 years old to use our
            services.
          </li>
          <li>
            Account: If needed, you may create an account. Keep your login
            details secure and do not share them.
          </li>
          <li>
            Respectful Use: Use our services responsibly and refrain from
            posting offensive or harmful content.
          </li>
        </ul>

        <h2>Content</h2>
        <ul>
          <li>
            Your Content: By submitting content, you grant KEMLabels permission
            to use it for our services.
          </li>
          <li>
            Prohibited Content: Do not submit content that violates laws or
            others' rights.
          </li>
        </ul>

        <h2>Third-Party Links</h2>
        <p>
          We are not responsible for third-party websites or services linked
          from our site.
        </p>

        <h2>Liability</h2>

        <p>
          We strive to provide accurate and reliable services, but we cannot
          guarantee everything. KEMLabels is not liable for any damages
          resulting from using our services.
        </p>

        <h2>Indemnification</h2>
        <p>
          You agree to hold KEMLabels harmless from any claims or losses due to
          your use of our services.
        </p>

        <h2>Governing Law</h2>
        <p>These Terms are governed by the laws of Canada.</p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions or concerns regarding these Terms, please
          contact us at{" "}
          <a href="mailto:support@kemlabels.com" className="link">
            support@kemlabels.com
          </a>{" "}
          or on Telegram at{" "}
          <a
            href="https://t.me/kemlabels"
            className="link"
            target="_blank"
            rel="noreferrer"
          >
            @kemlabels
          </a>
          .
        </p>

        <p>
          By using KEMLabels services, you accept these Terms and Conditions.
        </p>
      </div>
    </PageLayout>
  );
}
