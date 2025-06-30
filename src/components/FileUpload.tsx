// FileUpload.tsx
import React, { useEffect, useState } from 'react';

interface Props {
  onUpload?: () => void;
}

const FileUpload: React.FC<Props> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showFinalProgress, setShowFinalProgress] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const fetchRecordCount = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/record-count');
      const data = await res.json();
      if (res.ok) setRecordCount(data.count || 0);
    } catch (err) {
      console.error('❌ Failed to fetch record count:', err);
    }
  };

  useEffect(() => {
    fetchRecordCount();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setMessage('📁 File selected: ' + e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('❌ Please select a file.');
      return;
    }

    try {
      setMessage('');
      setIsUploading(true);
      setProgress(0);

      // ✅ Wait for backend to be ready
      let ready = false;
      for (let i = 0; i < 10; i++) {
        try {
          const ping = await fetch('http://localhost:3001/api/record-count');
          if (ping.ok) {
            ready = true;
            break;
          }
        } catch {
          // Wait 500ms before retrying
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (!ready) {
        throw new Error('Backend server did not start.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:3001/api/upload-file', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      setMessage('✅ File uploaded successfully!');
      await fetchRecordCount();
      onUpload?.();
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setProgress(100);
      setShowFinalProgress(true);
      setTimeout(() => setShowFinalProgress(false), 3000);
    }
  };

  const deleteData = async () => {
    try {
      setMessage('');
      const res = await fetch('http://localhost:3001/api/delete-data', {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete data');

      setMessage('✅ Deleted all records');
      setFile(null);
      (document.querySelector('input[type="file"]') as HTMLInputElement).value = '';
      await fetchRecordCount();
      onUpload?.();
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to delete data');
    }
  };

  return (
    <div className="w-full max-w-8xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-md space-y-2">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        📤 Upload Text File
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2 items-center">
          <label className="relative bg-blue-50 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded-md cursor-pointer transition text-sm">
            Choose File
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="relative bg-blue-50 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded-md transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : '📥 Load File'}
          </button>
        </div>

        <div className="flex flex-col sm:items-end">
          <button
            onClick={deleteData}
            disabled={isUploading}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-md font-semibold text-sm hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            🗑 Clear Records
          </button>
          <div className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
            <span>ⓘ</span> <span>Clear records to work on a new file</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`text-sm font-medium ${
            message.startsWith('❌')
              ? 'text-red-600'
              : message.startsWith('📁')
              ? 'text-gray-700'
              : 'text-green-600'
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        📊 Total Records:{' '}
        <span className="font-bold text-gray-900 text-base">{recordCount}</span>
      </div>

      {(isUploading || showFinalProgress) && (
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mt-2">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
