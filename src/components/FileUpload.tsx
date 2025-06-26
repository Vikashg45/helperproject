import React, { useEffect, useState } from 'react';

interface Props {
  onUpload: () => void;
}

const FileUpload: React.FC<Props> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [recordCount, setRecordCount] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showFinalProgress, setShowFinalProgress] = useState(false);

  const fetchRecordCount = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/record-count');
      const data = await res.json();
      setRecordCount(data.count);

      if (!isUploading) {
        if (data.count >= 10000) setProgress(50);
        else if (data.count >= 5000) setProgress(25);
        else setProgress(0);
      }
    } catch (err) {
      console.error('❌ Failed to fetch count', err);
    }
  };

  useEffect(() => {
    fetchRecordCount();
    const interval = setInterval(fetchRecordCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setMessage('📁 File selected: ' + e.target.files[0].name);
    }
  };

  const simulateProgress = () => {
    let fakeProgress = 0;
    const interval = setInterval(() => {
      if (fakeProgress >= 80 || !isUploading) {
        clearInterval(interval);
        return;
      }
      fakeProgress += Math.floor(Math.random() * 10) + 5;
      setProgress(Math.min(fakeProgress, 80));
    }, 300);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('❌ Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setProgress(0);
      simulateProgress();

      const res = await fetch('http://localhost:3001/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      setMessage(text);

      await fetchRecordCount();
      onUpload();
    } catch (err) {
      setMessage('❌ Upload failed');
      console.error(err);
    } finally {
      setIsUploading(false);
      setProgress(100);
      setShowFinalProgress(true);
      setTimeout(() => setShowFinalProgress(false), 10000);
    }
  };

  const deleteData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/delete-data', {
        method: 'DELETE',
      });

      const text = await res.text();
      setMessage(text);
      setFile(null);
      (document.querySelector('input[type="file"]') as HTMLInputElement).value = '';

      await fetchRecordCount();
      onUpload();
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to delete data');
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">📤 Upload Text File</h2>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-200 transition cursor-pointer"
          />

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition text-sm font-medium disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        <div className="w-full flex flex-col items-center sm:items-end">
          <button
            onClick={deleteData}
            disabled={isUploading}
            className="bg-red-50 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm font-medium disabled:opacity-50"
          >
            Clear Records
          </button>

          <div className="mt-1 flex items-start gap-1 text-xs text-gray-500 italic">
            <svg
              className="w-4 h-4 mt-0.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 20.5C6.753 20.5 2.5 16.247 2.5 11S6.753 1.5 12 1.5 21.5 5.753 21.5 11 17.247 20.5 12 20.5z"
              />
            </svg>
            <span>Clear records to work on a new file</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`text-sm font-medium ${
            message.startsWith('❌')
              ? 'text-red-600'
              : message.startsWith('📁')
              ? 'text-gray-600'
              : 'text-green-600'
          }`}
        >
          {message}
        </div>
      )}

      <div className="text-sm font-medium text-gray-700">
        📊 Total Records: <span className="font-semibold">{recordCount}</span>
      </div>

      {(isUploading || showFinalProgress) && (
        <div className="w-[15%] h-2 bg-gray-200 rounded overflow-hidden">
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