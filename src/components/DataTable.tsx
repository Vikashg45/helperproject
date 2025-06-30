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
  const [pageSize, _setPageSize] = useState(10); // ✅ Suppressed unused warning
  const [_gotoPage, _setGotoPage] = useState(''); // ✅ Suppressed unused warning
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

      params.append('limit', currentPageSize.toString());
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full px-4 py-6 bg-white rounded-xl shadow space-y-4">
      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">
          Save Changes
        </button>
        <button onClick={handleDownload} className="px-4 py-2 bg-green-500 text-white rounded">
          Download
        </button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full border-collapse">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} className="border p-2">
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="border p-2">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
});

export default DataTable;
