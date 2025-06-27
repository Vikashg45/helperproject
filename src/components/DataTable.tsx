import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTable, useSortBy, Column } from 'react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { RecordType } from '../utils/api';

const DataTable: React.FC = () => {
  const [data, setData] = useState<RecordType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [gotoPage, setGotoPage] = useState('');
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const searchQuery = ''; // Extend for global search
      const response = await fetch(
        `http://localhost:3001/api/data?limit=${pageSize}&offset=${page * pageSize}&search=${searchQuery}`
      );
      const result = await response.json();
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setData([]);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (rowId: string, columnId: string, value: string) => {
    const key = `${rowId}_${columnId}`;
    setEditedCells((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const updatedRows: Record<string, any> = {};

    Object.keys(editedCells).forEach((key) => {
      const [id, column] = key.split('_');
      if (!updatedRows[id]) updatedRows[id] = { id };
      updatedRows[id][column] = editedCells[key];
    });

    try {
      for (const row of Object.values(updatedRows)) {
        const response = await fetch('http://localhost:3001/api/update-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Update failed');
      }

      setEditedCells({});
      setEditingCell(null);
      fetchData();
    } catch (err) {
      console.error('❌ Save failed:', err);
      alert('Save failed. Check console.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([data.map((row) => Object.values(row).join(',')).join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'updated_data.txt';
    link.click();
  };

  const columns: Column<RecordType>[] = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      Header: () => (
        <div className="flex flex-col">
          <span className="flex items-center gap-1">
            {key.toUpperCase()}
            <ChevronUp className="w-3 h-3 text-gray-500 inline-block" />
            <ChevronDown className="w-3 h-3 text-gray-500 inline-block -mt-1" />
          </span>
          <input
            type="text"
            placeholder={`Search ${key}`}
            value={columnSearch[key] || ''}
            onChange={(e) =>
              setColumnSearch((prev) => ({ ...prev, [key]: e.target.value }))
            }
            className="text-xs border px-1 py-0.5 mt-1 rounded"
          />
        </div>
      ),
      accessor: key,
      Cell: ({ value, row }: any) => {
        const rowId = row.original.id || row.index;
        const cellKey = `${rowId}_${key}`;
        const editedValue = editedCells[cellKey];
        const displayValue = editedValue !== undefined ? editedValue : value;

        return (
          <div
            onClick={() => setEditingCell(cellKey)}
            className={`relative ${editedValue !== undefined ? 'bg-green-100' : ''}`}
          >
            {editingCell === cellKey ? (
              <input
                className="text-sm border p-1 w-full"
                value={displayValue}
                onChange={(e) => handleEdit(rowId, key, e.target.value)}
                onBlur={() => setEditingCell(null)}
                autoFocus
              />
            ) : (
              <span className="text-sm cursor-pointer">{displayValue}</span>
            )}
          </div>
        );
      },
    }));
  }, [data, editedCells, editingCell, columnSearch]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable({ columns, data }, useSortBy);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="w-full px-4 py-6 bg-white rounded-xl shadow space-y-4">
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 text-sm font-medium"
        >
          Save
        </button>
        <button
          onClick={handleDownload}
          className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 text-sm font-medium"
        >
          Download
        </button>
      </div>

      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {headerGroups.map((headerGroup, i) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                {headerGroup.headers.map((column, j) => (
                  <th
                    {...column.getHeaderProps((column as any).getSortByToggleProps?.())}
                    key={j}
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-700"
                  >
                    {column.render('Header')}
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
                      className="px-3 py-2"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-gray-700">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize">Rows per page:</label>
          <select
            id="pageSize"
            className="border px-2 py-1 rounded"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {[10, 20, 50, 100, 200].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Center pagination */}
        <div className="flex items-center gap-2 mx-auto">
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="text-gray-600 hover:text-blue-600 disabled:opacity-40"
          >
            ⏮️
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-gray-600 hover:text-blue-600 disabled:opacity-40"
          >
            ◀️
          </button>

          <span className="font-medium">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="text-gray-600 hover:text-blue-600 disabled:opacity-40"
          >
            ▶️
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page + 1 >= totalPages}
            className="text-gray-600 hover:text-blue-600 disabled:opacity-40"
          >
            ⏭️
          </button>
        </div>

        {/* Manual go to page */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={gotoPage}
            onChange={(e) => setGotoPage(e.target.value)}
            className="w-16 px-2 py-1 border rounded text-sm"
            placeholder="Go to"
          />
          <button
            onClick={() => {
              const parsed = parseInt(gotoPage);
              if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
                setPage(parsed - 1);
                setGotoPage('');
              } else {
                alert('Invalid page number');
              }
            }}
            className="px-2 py-1 bg-blue-50 hover:bg-blue-200 text-blue-800 rounded text-sm font-medium"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
