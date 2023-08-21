import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import "../styles/Global.css";

export default function Table({ data, columns }) {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  return (
    <>
      {/* <input
        type="text"
        value={filtering}
        onChange={(e) => setFiltering(e.target.value)}
      /> */}
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

      {/* <div className="tablePaginationBtns">
        <button onClick={() => table.setPageIndex(0)}>First page</button>
        <button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Previous page
        </button>
        <button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next page
        </button>
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
          Last page
        </button>
      </div> */}
    </>
  );
}
