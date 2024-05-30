import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BsArrowUp } from "react-icons/bs";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/OrderLabel.css";
import Button from "../components/Button";
import BulkOrder from "../components/BulkOrder";
import SingleLabelOrder from "../components/SingleLabelOrder";

export default function OrderLabel() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const isUserVerified = useSelector((state) => state.user.isVerified);

  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const [isBulkOrder, setIsBulkOrder] = useState(false);

  useEffect(() => {
    if (!isUserVerified) navigate("/verify-email");
    if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate, isUserVerified]);

  useEffect(() => {
    const scrollHandler = () => setShowFloatingBtn(window.scrollY > 100);
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  return (
    <PageLayout
      title="Order Label"
      description="Order Shipping Labels Online - Quickly generate shipping labels by providing address and package details. Get your label sent to your email for easy printing and shipping. Streamline your shipping process with KEMLabels."
    >
      {isBulkOrder ? (
        <BulkOrder setIsBulkOrder={setIsBulkOrder} />
      ) : (
        <SingleLabelOrder setIsBulkOrder={setIsBulkOrder} />
      )}
      <Button
        className={`floatingBtn ${showFloatingBtn ? "" : "hidden"}`}
        title="Scroll to top"
        onClickEvent={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        children={<BsArrowUp size={24} />}
      />
    </PageLayout>
  );
}
