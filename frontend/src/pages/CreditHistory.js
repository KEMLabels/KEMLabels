import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/CreditHistory.css";
import AlertMessage from "../components/AlertMessage";
import Table from "../components/Table";
import axios from "../api/axios";
import Log from "../components/Log";

export default function CreditHistory() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const isUserVerified = useSelector((state) => state.user.isVerified);

  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [timeoutId, setTimeoutId] = useState(null);
  const [creditHistoryData, setCreditHistoryData] = useState([]);

  const data = useMemo(() => creditHistoryData, [creditHistoryData]);
  const [totalRows, setTotalRows] = useState(creditHistoryData.length);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
    if (!isUserVerified) navigate("/verify-email");
    axios
      .get("/getCreditHistory", { withCredentials: true })
      .then((res) => {
        if (res) {
          setCreditHistoryData(res.data);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        setErrMsg("An unexpected error occurred. Please try again later."); // Axios default error
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [isLoggedIn, navigate, isUserVerified]);

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
            setInfoMsg(
              "Payment Reference ID was copied to clipboard succesfully."
            );
            navigator.clipboard.writeText(data.getValue());
            const cellTimeoutId = setTimeout(() => setInfoMsg(""), 3000);
            setTimeoutId(cellTimeoutId);
          }}
        >
          {data.getValue()} <FaRegCopy />{" "}
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
    <PageLayout
      title="Credit History"
      description="Review Your Credit History - Gain insights into your credit transactions and balances. Stay informed with your financial activity at KEMLabels."
    >
      <div className="container">
        <div className="header">
          <h1>Credit history {`(${totalRows})`}</h1>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
        </div>
        <div className="tableContainer">
          {isFetching ? (
            <div className="loadingContainer">
              <FiLoader className="loading" size={50} />
              <span className="loadingText">Loading transactions...</span>
            </div>
          ) : creditHistoryData.length > 0 ? (
            <Table
              data={data}
              columns={creditHistoryColumns}
              totalRows={totalRows}
              setTotalRows={setTotalRows}
            />
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
