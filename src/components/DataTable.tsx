// components/DataTable.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useTable,
  useSortBy,
} from 'react-table';
import { getData } from '../utils/api';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface RecordType {
  [key: string]: string;
}

interface ApiResponse {
  data: RecordType[];
  total: number;
}

const DataTable: React.FC = () => {
  const [data, setData] = useState<RecordType[]>([]);
  const [filteredData, setFilteredData] = useState<RecordType[]>([]);
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState('');
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const limit = 20;

  const fetchData = useCallback(() => {
    getData(1, 20000, '')
      .then((json: ApiResponse) => {
        setData(json.data || []);
      })
      .catch((err) => {
        console.error('❌ Error fetching data:', err);
        setData([]);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const filtered = data.filter((row) => {
      return Object.entries(columnSearch).every(([key, searchValue]) => {
        return row[key]?.toLowerCase().includes(searchValue.toLowerCase());
      });
    });
    setFilteredData(filtered);
    setPage(0);
  }, [data, columnSearch]);

  const paginatedData = useMemo(
    () => filteredData.slice(page * limit, (page + 1) * limit),
    [filteredData, page, limit]
  );

  const columns = useMemo(() => {
    if (paginatedData.length === 0) return [];
    const dynamicCols = Object.keys(paginatedData[0]).map((key) => ({
      Header: key.toUpperCase(),
      accessor: key,
    }));
    return [
      {
        Header: 'S.No',
        accessor: 'serial',
        Cell: ({ row }: any) => page * limit + row.index + 1,
      },
      ...dynamicCols,
    ];
  }, [paginatedData, page]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable(
    {
      columns,
      data: paginatedData,
    },
    useSortBy
  );

  const totalPages = Math.ceil(filteredData.length / limit);

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const jumpToPage = () => {
    const targetPage = parseInt(pageInput);
    if (!isNaN(targetPage) && targetPage > 0 && targetPage <= totalPages) {
      setPage(targetPage - 1);
      setPageInput('');
    }
  };

  return (
    <div className="w-full px-4 py-6 space-y-6 bg-white rounded-xl shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            {headerGroups.map((headerGroup: any, i: any) => (
              <React.Fragment key={`header-group-${i}`}>
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column: any, j: any) => (
                    <th
                      {...column.getHeaderProps((column as any).getSortByToggleProps())}
                      key={`head-col-${j}`}
                      className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider select-none cursor-pointer"
                    >
                      {column.render('Header')}
                      {(column as any).isSorted ? (
                        (column as any).isSortedDesc ? ' 🔽' : ' 🔼'
                      ) : ''}
                    </th>
                  ))}
                </tr>
                <tr>
                  {headerGroup.headers.map((column: any, j: any) => (
                    <th key={`search-col-${j}`} className="px-3 py-1">
                      {column.id !== 'serial' && (
                        <input
                          type="text"
                          value={columnSearch[column.id] || ''}
                          onChange={(e) =>
                            setColumnSearch((prev) => ({
                              ...prev,
                              [column.id]: e.target.value,
                            }))
                          }
                          placeholder={`Search ${column.id}`}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-violet-500 focus:outline-none"
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-sm text-gray-500">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((row: any, rowIndex: any) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    key={`row-${rowIndex}`}
                    className="hover:bg-violet-50 transition duration-100"
                  >
                    {row.cells.map((cell: any, cellIndex: any) => (
                      <td
                        {...cell.getCellProps()}
                        key={`cell-${rowIndex}-${cellIndex}`}
                        className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap"
                      >
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bottom Center */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center px-2 text-sm text-gray-600">
            Page <span className="font-semibold px-1">{page + 1}</span> of <span className="font-semibold px-1">{totalPages || 1}</span>
          </div>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={pageInput}
            onChange={handlePageInput}
            placeholder="Go to page"
            className="w-24 px-2 py-1 border rounded text-sm"
          />
          <button
            onClick={jumpToPage}
            className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-700"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;