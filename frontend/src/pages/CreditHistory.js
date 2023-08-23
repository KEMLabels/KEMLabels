import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/CreditHistory.css";
import AlertMessage from "../components/AlertMessage";
import Table from "../components/Table";
import mockCreditHistoryData from "../content/creditHistoryData";
import axios from "../api/axios";

export default function CreditHistory() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timeoutId, setTimeoutId] = useState(null);
  const [creditHistoryData, setCreditHistoryData] = useState([]);

  const data = useMemo(() => mockCreditHistoryData, []); // TODO: Hardcoded data, change it so it comes from API
  const [totaRows, setTotalRows] = useState(mockCreditHistoryData?.length || 0); // TODO: Change this to API data

  useEffect(() => {
    // if (!isLoggedIn) navigate("/");

    // TODO: Add this Axios call to the backend and return Data JSON format
    axios
      .get("/getCreditHistory" , {
        withCredentials: true,
      })
      .then((res) => {
        if (res) {
          setCreditHistoryData(res.data);
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later.");
      });
  }, [isLoggedIn, navigate]);

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
    <PageLayout title="Credit History">
      <div className="container">
        <div className="header">
          <h1>Credit history {`(${totaRows})`}</h1>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          {successMsg && <AlertMessage msg={successMsg} type="success" />}
        </div>
        <div className="tableContainer">
          {mockCreditHistoryData?.length > 0 ? (
            <Table
              data={data}
              columns={creditHistoryColumns}
              totalRows={totaRows}
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
