import React from 'react';
import './App.css';
import DataTable from './components/DataTable';

function App() {
  return (
    <div className="App">
      <h1>React + Tauri + SQLite</h1>
      <DataTable />
    </div>
  );
}

export default App;
