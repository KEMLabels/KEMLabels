import React from "react";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";

export default function PrivacyPolicy() {
  return (
    <PageLayout
      title="Privacy Policy"
      description="Your Privacy Matters - Explore KEMLabels' commitment to safeguarding your personal information. Learn how we collect, use, and protect your data in our Privacy Policy."
    >
      <div className="globalContainer">
        <div className="headingContainer">
          <h1>Privacy Policy</h1>
          <p>Effective Date: July 30, 2023</p>
        </div>

        <p>
          At KEMLabels, we are dedicated to safeguarding the privacy and
          security of our customers' personal information. This Privacy Policy
          outlines how we collect, use, disclose, and protect your data when you
          interact with our services. Please take a moment to read this policy
          carefully.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We may collect the following types of information when you use our
          services:
        </p>
        <p>
          Tracking Information: When you access our website or use our mobile
          applications, we may automatically collect certain information, such
          as your IP address, browser type, operating system, and other
          technical data. This data helps us improve our services and ensure
          security.
        </p>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>
            Providing Services: We use your personal information to process and
            fulfill your orders, provide shipping and tracking services, and
            manage your KEMLabels account.
          </li>
          <li>
            Customer Support: Your information enables us to respond to your
            inquiries, address issues, and enhance our customer support
            services.
          </li>
          <li>
            Communication: We may send you service-related updates,
            notifications, and promotional materials relevant to your
            interactions with KEMLabels.
          </li>
        </ul>

        <h2>Your Choices and Rights</h2>
        <ul>
          <li>
            Account Settings: You can review and update your account information
            through your KEMLabels account settings.
          </li>
          <li>
            Marketing Communications: You can opt-out of receiving marketing
            communications from KEMLabels by following the unsubscribe
            instructions included in the emails or contacting us directly.
          </li>
          <li>
            Data Access and Deletion: You have the right to request access to
            the personal information we hold about you and request its deletion,
            subject to applicable legal requirements.
          </li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We employ industry-standard security measures to protect your
          information from unauthorized access, disclosure, alteration, or
          destruction. However, no method of data transmission over the Internet
          or electronic storage is completely secure, and we cannot guarantee
          absolute security.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          KEMLabels services are not intended for children under the age of 13,
          and we do not knowingly collect personal information from individuals
          in this age group.
        </p>

        <h2>Updates to this Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or legal requirements. We will notify you of any
          significant changes through prominent notices on our website or by
          other means.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions or concerns regarding this Privacy Policy or
          your data, please contact us at{" "}
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
          By using KEMLabels services, you consent to the practices described in
          this Privacy Policy.
        </p>
      </div>
    </PageLayout>
  );
}
