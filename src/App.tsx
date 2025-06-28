// App.tsx
import React, { useRef } from 'react';
import FileUpload from './components/FileUpload';
import DataTable, { DataTableHandle } from './components/DataTable';

const App = () => {
  const dataTableRef = useRef<DataTableHandle>(null);

  const handleUploadSuccess = () => {
    dataTableRef.current?.refresh(); // 🔁 reload table after file upload
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <FileUpload onUpload={handleUploadSuccess} />
      <DataTable ref={dataTableRef} />
    </div>
  );
};

export default App;
