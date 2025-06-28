// ✅ Your imports remain unchanged
import { useEffect, useState, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useTable, Column } from 'react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RecordType } from '../utils/api';

export interface DataTableHandle {
  refresh: () => void;
}

const DataTable = forwardRef<DataTableHandle>((_, ref) => {
  const [data, setData] = useState<RecordType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [gotoPage, setGotoPage] = useState('');
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { pageRef.current = page }, [page]);
  useEffect(() => { pageSizeRef.current = pageSize }, [pageSize]);

  const fetchData = async () => {
    try {
      const currentPage = pageRef.current;
      const currentPageSize = pageSizeRef.current;
      const params = new URLSearchParams();

      Object.entries(columnSearch).forEach(([key, value]) => {
        if (value?.trim()) params.append(key, value);
      });

      if (sortColumn) {
        params.append('sortColumn', sortColumn);
        params.append('sortOrder', sortOrder);
      }

      // ✅ Smart logic: load ALL rows only on first fetch with no filters/sorting
      const forceAll = currentPage === 0 && currentPageSize === 10 && Object.values(columnSearch).every(v => !v) && !sortColumn;
      params.append('limit', forceAll ? 'all' : currentPageSize.toString());
      params.append('offset', (currentPage * currentPageSize).toString());

      const response = await fetch(`http://localhost:3001/api/data?${params.toString()}`);
      const result = await response.json();
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setData([]);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchData();
    },
  }));

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortColumn, sortOrder]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchData();
    }, 400);
  }, [columnSearch]);

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

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const columns: Column<RecordType>[] = useMemo(() => {
    if (data.length === 0) return [];

    return Object.keys(data[0]).map((key) => ({
      Header: () => (
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-sm">{key.toUpperCase()}</span>
            <button
              onClick={() => {
                setSortColumn(key);
                toggleSortOrder();
              }}
              className="text-gray-500 hover:text-black"
              title="Sort"
            >
              {sortColumn === key ? (
                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4 opacity-25" />
              )}
            </button>
          </div>
          <input
            key={`search-${key}`}
            type="text"
            placeholder={`Search ${key}`}
            value={columnSearch[key] || ''}
            onChange={(e) =>
              setColumnSearch((prev) => ({ ...prev, [key]: e.target.value }))
            }
            className="text-xs border px-1 py-0.5 rounded"
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
  }, [data, editedCells, editingCell, columnSearch, sortColumn, sortOrder]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable({ columns, data });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="w-full px-4 py-6 bg-white rounded-xl shadow space-y-4">
      <div className="flex gap-10 items-start mt-4">
        <div className="flex flex-col items-center">
          <button
            onClick={handleSave}
            className="bg-green-100 text-green-800 px-5 py-2 rounded-lg hover:bg-green-200 text-sm font-semibold tracking-wide transition-all shadow-sm"
          >
            💾 Save
          </button>
          <span className="mt-2 text-xs text-gray-500 font-medium tracking-normal italic text-center">
            Save updated changes in text file
          </span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={handleDownload}
            className="bg-yellow-100 text-yellow-800 px-5 py-2 rounded-lg hover:bg-yellow-200 text-sm font-semibold tracking-wide transition-all shadow-sm"
          >
            ⬇️ Download
          </button>
          <span className="mt-2 text-xs text-gray-500 font-medium tracking-normal italic text-center">
            Download the latest text file
          </span>
        </div>
      </div>

      {columns.length > 0 ? (
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              {headerGroups.map((headerGroup, i) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                  {headerGroup.headers.map((column, j) => (
                    <th {...column.getHeaderProps()} key={j} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
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
                      <td {...cell.getCellProps()} key={cellIndex} className="px-3 py-2">
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 italic text-sm mt-4">No records available.</div>
      )}

      <div className="flex justify-between mt-4 text-sm text-gray-700">
        <div className="flex gap-2 items-center">
          Rows:
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="border px-2 py-1 rounded">
            {[10, 20, 50, 100].map((size) => (<option key={size} value={size}>{size}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(0)} disabled={page === 0}>⏮️</button>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>◀️</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}>▶️</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page + 1 >= totalPages}>⏭️</button>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={gotoPage} onChange={(e) => setGotoPage(e.target.value)} className="w-16 px-2 py-1 border rounded" placeholder="Go to" />
          <button onClick={() => {
            const pg = parseInt(gotoPage);
            if (!isNaN(pg) && pg > 0 && pg <= totalPages) {
              setPage(pg - 1);
              setGotoPage('');
            }
          }} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded">Go</button>
        </div>
      </div>
    </div>
  );
});

export default DataTable;
