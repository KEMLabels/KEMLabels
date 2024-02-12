import React from "react";
import { IoCloseSharp } from "react-icons/io5";
import Button from "./Button";

export default function OrderConfirmPopup({
  setShowOrderConfirmPopup,
  confirmOrder,
  loading,
}) {
  return (
    <div className="orderConfirmationPopup active">
      <div className="popupContainer">
        <IoCloseSharp
          className="closeBtn"
          onClick={() => {
            document.body.style.overflow = null;
            setShowOrderConfirmPopup(false);
          }}
        />
        <h1>Are you sure?</h1>
        <p>
          Please confirm your order details before submitting. If you are sure,
          click confirm.
        </p>
        <div className="orderConfirmBtnGroup">
          <Button
            text="Cancel"
            fill="outline"
            onClickEvent={() => {
              document.body.style.overflow = null;
              setShowOrderConfirmPopup(false);
            }}
          />
          <Button
            text="Confirm"
            onClickEvent={confirmOrder}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
