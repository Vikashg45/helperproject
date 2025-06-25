import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';

const App: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1); // force DataTable to re-fetch
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">
      <FileUpload onUpload={triggerRefresh} />
      <DataTable key={refreshKey} />
    </div>
  );
};

export default App;
