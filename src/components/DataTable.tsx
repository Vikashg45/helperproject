import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface RecordData {
  [key: string]: string;
}

function DataTable() {
  const [data, setData] = useState<RecordData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/data', {
        params: { page, limit, search }
      });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 User Records</h2>

      <input
        type="text"
        placeholder="🔍 Search f1 (e.g. name)..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        style={{ marginBottom: '10px', padding: '5px' }}
      />

      <div style={{ maxHeight: '400px', overflowY: 'scroll', border: '1px solid #ccc' }}>
        <table border={1} width="100%" cellPadding={5}>
          <thead>
            <tr>
              {data[0] && Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '10px' }}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>⬅ Prev</button>
        <span style={{ margin: '0 10px' }}>Page {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next ➡</button>
      </div>
    </div>
  );
}

export default DataTable;
