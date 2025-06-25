// components/DataTable.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useTable,
  useSortBy,
} from 'react-table';
import { getData } from '../utils/api';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';

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
  const [search, setSearch] = useState('');
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
    const filtered = data.filter((item) =>
      item.f1?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredData(filtered);
    setPage(0);
  }, [data, search]);

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

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="w-full px-4 py-6 space-y-6 bg-white rounded-xl shadow-sm">
      {/* Search and page info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by f1..."
            value={search}
            onChange={onSearchChange}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>
        <div className="text-sm text-gray-600">
          Showing page <span className="font-semibold">{page + 1}</span> of <span className="font-semibold">{totalPages || 1}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            {headerGroups.map((headerGroup:any, i:any) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={`header-${i}`}>
                {headerGroup.headers.map((column:any, j:any) => (
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
              rows.map((row:any, rowIndex:any) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    key={`row-${rowIndex}`}
                    className="hover:bg-violet-50 transition duration-100"
                  >
                    {row.cells.map((cell:any, cellIndex:any) => (
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

      {/* Pagination */}
      <div className="flex justify-center gap-3 pt-2">
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
    </div>
  );
};

export default DataTable;
