import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaCopy } from "react-icons/fa";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/CreditHistory.css";
import AlertMessage from "../components/AlertMessage";
import Table from "../components/Table";
import creditHistoryData from "../content/creditHistoryData";

export default function CreditHistory() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  // TODO: Hardcoded data, change it so it comes from API
  const data = useMemo(() => creditHistoryData, []);

  /** @type import('@tanstack/react-table').ColumnDef<any> */
  const creditHistoryColumns = [
    {
      header: "Date",
      accessorKey: "paymentDate",
    },
    {
      header: "Time",
      accessorKey: "paymentTime",
    },
    {
      header: "Type",
      accessorKey: "type",
    },
    {
      header: "ID",
      accessorKey: "refId",
      cell: (data) => (
        <span
          className="copyToClipbord"
          onClick={(e) => {
            e.preventDefault();
            if (timeoutId) clearTimeout(timeoutId); // Clear the previous timeout
            setSuccessMsg(
              "Payment Reference ID was copied to clipboard succesfully."
            );
            navigator.clipboard.writeText(data.getValue());
            const cellTimeoutId = setTimeout(() => setSuccessMsg(""), 3000);
            setTimeoutId(cellTimeoutId);
          }}
        >
          {data.getValue()} <FaCopy />{" "}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (data) => `$${Number(data.getValue()).toFixed(2)}`,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (data) => (
        <span
          className={`creditStatus ${data?.getValue()?.toLowerCase() ?? null}`}
        >
          {data.getValue()}
        </span>
      ),
    },
  ];

  return (
    <PageLayout title="Credit History">
      <div className="container">
        <div className="header">
          <h1>Credit history ({creditHistoryData.length})</h1>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          {successMsg && <AlertMessage msg={successMsg} type="success" />}
        </div>
        <div className="tableContainer">
          {creditHistoryData.length !== 0 ? (
            <Table data={data} columns={creditHistoryColumns} />
          ) : (
            <p>
              Hmm... we don't have any records of loading credits from your
              history. Please navigate to our{" "}
              <Link className="link" to="/load-credits">
                Load Credits page
              </Link>{" "}
              to start your journey!
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
