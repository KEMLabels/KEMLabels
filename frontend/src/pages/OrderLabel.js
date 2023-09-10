import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/OrderLabel.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BsArrowUp } from "react-icons/bs";
import { DefaultField } from "../components/Field";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";

export default function OrderLabel() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const senderAndRecipientInfo = {
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    street: "",
    suite: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  };
  const [formValues, setFormValues] = useState({
    courier: "",
    classType: "",
    packageInfo: {
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      description: "",
      referneceNumber: "",
    },
    senderInfo: { ...senderAndRecipientInfo },
    recipientInfo: { ...senderAndRecipientInfo },
  });
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const scrollHandler = () => setShowFloatingBtn(window.scrollY > 100);
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  // Save input value on change
  const saveInput = (e, section = "", field = "") => {
    e.preventDefault();
    if (section === "senderInfo") {
      setError((array) => array.filter((e) => e.label !== "sender"));
    } else if (section === "recipientInfo") {
      setError((array) => array.filter((e) => e.label !== "recipient"));
    }
    setFormValues((prevValues) => {
      if (section) {
        return {
          ...prevValues,
          [section]: {
            ...prevValues[section],
            [field]: e.target.value.trim(),
          },
        };
      }
      return {
        ...prevValues,
        [section]: e.target.value.trim(),
      };
    });
  };

  const isSectionEmpty = (section) => {
    return Object.values(section).some((value) => value === "");
  };

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    const { courier, classType, packageInfo, senderInfo, recipientInfo } =
      formValues;
    const isSenderInfoEmpty = isSectionEmpty(senderInfo);
    const isRecipientInfoEmpty = isSectionEmpty(recipientInfo);
    const isPackageInfoEmpty = isSectionEmpty(packageInfo);
    const errors = [];

    // if (courier === "" || classType === "") {
    //   errors.push({
    //     label: "package",
    //     msg: "Please select a courier and a class type.",
    //   });
    // }

    if (isPackageInfoEmpty) {
      errors.push({
        label: "package",
        msg: "Please fill out all mandatory fields in this section.",
      });
    }

    if (isSenderInfoEmpty) {
      errors.push({
        label: "sender",
        msg: "Please fill out all mandatory fields in this section.",
      });
    }
    if (isRecipientInfoEmpty) {
      errors.push({
        label: "recipient",
        msg: "Please fill out all mandatory fields in this section.",
      });
    }

    if (errors.length > 0) {
      setLoading(false);
      setError(errors);
      return;
    }

    // TODO: axios call here
  };

  return (
    <PageLayout
      title="Order Label"
      description="Order Shipping Labels Online - Quickly generate shipping labels by providing address and package details. Get your label sent to your email for easy printing and shipping. Streamline your shipping process with KEMLabels."
    >
      <div className="globalContainer orderLabelContainer">
        <div className="headingContainer" style={{ textAlign: "center" }}>
          <h1>Order label</h1>
          <p>
            Please complete all mandatory fields to proceed with placing your
            order.
          </p>
          {error
            .filter((error) => error.label === "container")
            .map((error, i) => (
              <AlertMessage key={i} msg={error.msg} type="error" />
            ))}
        </div>
        <form action="POST" className="orderLabelForm">
          <div id="packageSection" className="formSection">
            <h2>Package details</h2>
            {error
              .filter((error) => error.label === "package")
              .map((error, i) => (
                <AlertMessage
                  key={i}
                  msg={error.msg}
                  type="error"
                  divId="packageSection"
                />
              ))}
            <div className="formRow">
              <DefaultField
                label="Weight"
                helpText="Maximum weight is 150 lbs."
                onChangeEvent={(e) => saveInput(e, "packageInfo", "weight")}
                minLength={1}
                maxLength={3}
                postfix="lbs"
                shortField
              />
              <DefaultField
                label="Length"
                onChangeEvent={(e) => saveInput(e, "packageInfo", "length")}
                minLength={1}
                maxLength={3}
                postfix="in"
                shortField
                fixTextAlignment
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Width"
                onChangeEvent={(e) => saveInput(e, "packageInfo", "width")}
                minLength={1}
                maxLength={3}
                postfix="in"
                shortField
              />
              <DefaultField
                label="Height"
                onChangeEvent={(e) => saveInput(e, "packageInfo", "height")}
                minLength={1}
                maxLength={3}
                postfix="in"
                shortField
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Reference number"
                helpText="Can be your invoice number found on your order details."
                onChangeEvent={(e) =>
                  saveInput(e, "packageInfo", "referneceNumber")
                }
                minLength={1}
                maxLength={20}
                optional
              />
            </div>
            <div className="formRow">
              <DefaultField
                fieldType="textarea"
                label="Description"
                helpText="Any relavent package information."
                onChangeEvent={(e) =>
                  saveInput(e, "packageInfo", "description")
                }
                minLength={1}
                maxLength={100}
                optional
              />
            </div>
          </div>
          <div id="senderSection" className="formSection">
            <h2>Sender address</h2>
            {error
              .filter((error) => error.label === "sender")
              .map((error, i) => (
                <AlertMessage
                  key={i}
                  msg={error.msg}
                  type="error"
                  divId="senderSection"
                />
              ))}
            <div className="formRow">
              <DefaultField
                label="First name"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "firstName")}
                placeholder="John"
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Last name"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "lastName")}
                placeholder="Doe"
                minLength={1}
                maxLength={50}
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Company name"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "companyName")}
                maxLength={50}
                fixTextAlignment
                optional
              />
              <DefaultField
                label="Phone number"
                helpText="(XXX) XXX-XXXX."
                onChangeEvent={(e) => saveInput(e, "senderInfo", "phone")}
                placeholder="(XXX) XXX-XXXX"
                minLength={10}
                maxLength={10}
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Street"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "street")}
                placeholder="Start typing your address..."
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Suite / Apt / Unit"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "suite")}
                minLength={1}
                maxLength={15}
                shortField
                optional
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="City"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "city")}
                placeholder="Vancouver"
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Zip / Postal code"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "zip")}
                minLength={6}
                maxLength={6}
                shortField
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Province / State"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "state")}
                placeholder="British Columbia"
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Country"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "country")}
                placeholder="Canada"
                minLength={1}
                maxLength={50}
              />
            </div>
          </div>
          <div id="recipientSection" className="formSection">
            <h2>Recipient address</h2>
            {error
              .filter((error) => error.label === "recipient")
              .map((error, i) => (
                <AlertMessage
                  key={i}
                  msg={error.msg}
                  type="error"
                  divId="recipientSection"
                />
              ))}
            <div className="formRow">
              <DefaultField
                label="First name"
                onChangeEvent={(e) =>
                  saveInput(e, "recipientInfo", "firstName")
                }
                placeholder="John"
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Last name"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "lastName")}
                placeholder="Doe"
                minLength={1}
                maxLength={50}
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Company name"
                onChangeEvent={(e) =>
                  saveInput(e, "recipientInfo", "companyName")
                }
                maxLength={50}
                fixTextAlignment
                optional
              />
              <DefaultField
                label="Phone number"
                helpText="(XXX) XXX-XXXX."
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "phone")}
                placeholder="(XXX) XXX-XXXX"
                minLength={10}
                maxLength={10}
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Street"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "street")}
                placeholder="Start typing your address..."
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Suite / Apt / Unit"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "suite")}
                minLength={1}
                maxLength={15}
                shortField
                optional
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="City"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "city")}
                placeholder="Vancouver"
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Zip / Postal code"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "zip")}
                minLength={6}
                maxLength={6}
                shortField
              />
            </div>
            <div className="formRow">
              <DefaultField
                label="Province / State"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "state")}
                placeholder="British Columbia"
                minLength={1}
                maxLength={50}
              />
              <DefaultField
                label="Country"
                onChangeEvent={(e) => saveInput(e, "recipientInfo", "country")}
                placeholder="Canada"
                minLength={1}
                maxLength={50}
              />
            </div>
          </div>
          <div>
            <Button
              btnType="submit"
              loading={loading}
              onClickEvent={submit}
              text="Submit order"
            />
          </div>
        </form>
        <div>
          <Button
            className={`floatingBtn ${showFloatingBtn ? "" : "hidden"}`}
            title="Scroll to top"
            onClickEvent={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            children={<BsArrowUp size={24} />}
          />
        </div>
      </div>
    </PageLayout>
  );
}
