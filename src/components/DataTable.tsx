import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { getData, RecordType } from '../utils/api';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
} from 'lucide-react';

interface DataTableProps {
  reloadTrigger: number;
  fullRecordCount: number;
}

const DataTable: React.FC<DataTableProps> = ({ reloadTrigger, fullRecordCount }) => {
  const [data, setData] = useState<RecordType[]>([]);
  const [filteredData, setFilteredData] = useState<RecordType[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [editingRow, setEditingRow] = useState<RecordType | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const response = await getData(1, 20000, '');
      setData(response.data || []);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setData([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const filtered = data.filter((row) =>
      Object.entries(columnSearch).every(([key, searchValue]) =>
        row[key]?.toLowerCase().includes(searchValue.toLowerCase())
      )
    );
    setFilteredData(filtered);
    setPage(0);
  }, [data, columnSearch]);

  const paginatedData = useMemo(
    () => filteredData.slice(page * pageSize, (page + 1) * pageSize),
    [filteredData, page, pageSize]
  );

  const handleEditRow = (row: RecordType) => {
    setEditingRow(row);
    setEditValues({ ...row });
  };

  const handleSaveEdit = async () => {
    try {
      if (!editValues.id) {
        alert('❌ Cannot update record without an ID');
        return;
      }
      const res = await fetch('http://localhost:3001/api/update-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (res.ok) {
        alert('✅ Record updated successfully');
        setEditingRow(null);
        fetchData();
      } else {
        const text = await res.text();
        alert('❌ Failed to update record: ' + text);
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      alert('❌ An error occurred while updating');
    }
  };

  const columns = useMemo(() => {
    if (paginatedData.length === 0) return [];
    const dynamicCols = Object.keys(paginatedData[0]).map((key) => ({
      Header: () => (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-700 uppercase">{key.toUpperCase()}</span>
          <input
            type="text"
            placeholder="Search"
            value={columnSearch[key] || ''}
            onChange={(e) =>
              setColumnSearch((prev) => ({ ...prev, [key]: e.target.value }))
            }
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      ),
      accessor: key,
    }));

    return [
      {
        Header: () => (
          <div className="text-xs font-semibold text-gray-700 uppercase">S.No</div>
        ),
        accessor: 'serial',
        Cell: ({ row }: any) => page * pageSize + row.index + 1,
      },
      ...dynamicCols,
      {
        Header: () => (
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase">
            <Pencil className="w-4 h-4 text-gray-600" />
            Actions
          </div>
        ),
        accessor: 'actions',
        Cell: ({ row }: any) => (
          <button
            onClick={() => handleEditRow(row.original)}
            className="inline-flex items-center gap-1 text-xs text-violet-700 border border-violet-200 bg-violet-50 px-2 py-1 rounded hover:bg-violet-100"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        ),
      },
    ];
  }, [paginatedData, page, pageSize, columnSearch]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable({ columns, data: paginatedData }, useSortBy);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div className="w-full px-4 py-6 bg-white rounded-xl shadow">
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {headerGroups.map((headerGroup, i) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                {headerGroup.headers.map((column, j) => (
                  <th
                    {...column.getHeaderProps((column as any).getSortByToggleProps?.())}
                    key={j}
                    className="px-3 py-2 text-left align-top"
                  >
                    {column.render('Header')}
                    {(column as any).isSorted
                      ? (column as any).isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-100">
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={rowIndex}>
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      {...cell.getCellProps()}
                      key={cellIndex}
                      className="px-3 py-2 text-sm text-gray-700"
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Rows:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPage(0)} disabled={page === 0}>
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">
            Page <b>{page + 1}</b> of <b>{totalPages || 1}</b>
          </span>
          <button onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))} disabled={page >= totalPages - 1}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Edit Record</h3>
            {Object.keys(editingRow).map((key) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                <input
                  type="text"
                  value={editValues[key] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [key]: e.target.value })}
                  className="w-full border px-3 py-1 rounded text-sm focus:ring focus:ring-violet-300"
                />
              </div>
            ))}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingRow(null)}
                className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="text-sm px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
