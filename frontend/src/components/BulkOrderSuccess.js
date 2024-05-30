import React from "react";
import { FaCheckCircle } from "react-icons/fa";

export default function BulkOrderSuccess({
  numOrders,
  totalPrice,
  courier,
  classType,
  hasSignature,
}) {
  return (
    <div className="globalContainer orderLabelContainer">
      <div className="headingContainer">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <FaCheckCircle size={80} color="#00cc66" />
        </div>
        <h1>Thank you for your Order!</h1>
        <p>
          You will recieve an email of your order details and the labels in a
          ZIP file.
        </p>
      </div>
      <div className="orderSummary">
        <h2>Order Summary</h2>
        <div className="orderSummarySection">
          <h3>Order Details</h3>
          <div className="orderSummaryRow">
            <p>Number of Orders</p>
            <p>
              <strong>{numOrders}</strong>
            </p>
          </div>

          <div className="orderSummaryRow">
            <p>Order Total:</p>
            <p>
              <strong>${totalPrice}</strong>
            </p>
          </div>

          <div className="orderSummaryRow">
            <p>Courier</p>
            <p>
              <strong>{courier}</strong>
            </p>
          </div>

          <div className="orderSummaryRow">
            <p>Class Type</p>
            <p>
              <strong>
                {classType}
                {hasSignature && " with Signature"}
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
