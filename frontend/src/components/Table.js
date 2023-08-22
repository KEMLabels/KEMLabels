import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import Dropdown from "react-dropdown";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import {
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
} from "react-icons/md";
import "../styles/Global.css";
import { validateTablePagination } from "../utils/Validation";
import { SearchField } from "./Field";

export default function Table({ data, columns, totalRows, setTotalRows }) {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const dropdownItemOptions = ["10", "20", "30", "40", "50"];
  const [dropdownItemValue, setDropdownItemValue] = useState(
    dropdownItemOptions[0]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: sorting,
      globalFilter: filtering,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
  });

  useEffect(() => setTotalRows(table.getFilteredRowModel().rows.length));

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  function renderMobileRow(row) {
    const [
      dateCells,
      timeCells,
      typeCells,
      refIdCells,
      amountCells,
      statusCells,
    ] = row.getVisibleCells();

    return (
      <>
        <td key={refIdCells.id}>
          {flexRender(
            refIdCells.column.columnDef.cell,
            refIdCells.getContext()
          )}
        </td>

        <td key={amountCells.id} className="alignRight">
          {flexRender(
            amountCells.column.columnDef.cell,
            amountCells.getContext()
          )}
        </td>

        <td key={typeCells.id + statusCells.id}>
          {flexRender(typeCells.column.columnDef.cell, typeCells.getContext())}
          <span style={{ padding: "0 0.5rem" }} />
          {flexRender(
            statusCells.column.columnDef.cell,
            statusCells.getContext()
          )}
        </td>

        <td key={dateCells.id + timeCells.id} className="alignRight">
          {flexRender(dateCells.column.columnDef.cell, dateCells.getContext())}
          <span style={{ padding: "0 0.25rem" }} />
          {flexRender(timeCells.column.columnDef.cell, timeCells.getContext())}
        </td>
      </>
    );
  }

  function handlePaginationInput(e) {
    const value = e.target.value;
    const numValue = parseInt(value);

    // Check if the input is a valid positive integer
    if (!validateTablePagination(value, numValue, 1, table.getPageCount())) {
      // Invalid input, reset the input value to the current page index
      e.target.value = table.getState().pagination.pageIndex + 1;
    } else {
      table.setPageIndex(numValue - 1);
      e.target.value = numValue;
    }
  }

  function PaginationControlBtn({ onClickEvent, name, disabled = false }) {
    function renderIcon() {
      switch (name) {
        case "first":
          return <MdFirstPage size={24} />;
        case "previous":
          return <MdChevronLeft size={24} />;
        case "next":
          return <MdChevronRight size={24} />;
        case "last":
          return <MdLastPage size={24} />;
        default:
          return null;
      }
    }

    return (
      <button
        className="paginationBtnContainer"
        title={`Go to ${name} page`}
        disabled={disabled}
        onClick={onClickEvent}
      >
        {renderIcon()}
      </button>
    );
  }

  return (
    <>
      <div className="tableHeaderActions">
        <div className="tableSearch">
          <SearchField
            className="tableSearchField"
            placeholder="Search for payment type, amount, date, etc."
            currentValue={filtering}
            onChangeEvent={(e) => setFiltering(e.target.value)}
          />
        </div>
        <div className="tableItemsToShow">
          <span>Items per page</span>{" "}
          <Dropdown
            className="dropdown"
            controlClassName="dropdownControl"
            menuClassName="dropdownMenu"
            options={dropdownItemOptions}
            onChange={(e) => {
              setDropdownItemValue(e.label.toString());
              table.setPageSize(Number(e.value));
            }}
            value={dropdownItemOptions.find(
              (option) => option === dropdownItemValue
            )}
          />
        </div>
      </div>

      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={header.column.id === "amount" ? "alignRight" : ""}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {
                    {
                      asc: <FaCaretUp />,
                      desc: <FaCaretDown />,
                    }[header.column.getIsSorted() ?? null]
                  }
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {isMobileView
                ? renderMobileRow(row)
                : row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === "amount" ? "alignRight" : ""
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="tableFooterActions">
        <div>
          <p>
            {`Showing ${
              table.getState().pagination.pageIndex + 1
            } - ${table.getPageCount()} of ${totalRows} items`}
          </p>
        </div>

        <div className="tablePaginationBtns">
          <PaginationControlBtn
            onClickEvent={() => table.setPageIndex(0)}
            name="first"
          />
          <PaginationControlBtn
            onClickEvent={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            name="previous"
          />
          <p>
            Page{" "}
            <input
              type="number"
              className="paginationInput"
              value={table.getState().pagination.pageIndex + 1}
              onChange={handlePaginationInput}
              min={1}
              max={table.getPageCount()}
            />
            of {table.getPageCount()}
          </p>
          <PaginationControlBtn
            onClickEvent={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            name="next"
          />
          <PaginationControlBtn
            onClickEvent={() => table.setPageIndex(table.getPageCount() - 1)}
            name="last"
          />
        </div>
      </div>
    </>
  );
}
