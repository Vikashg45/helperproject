import React, { useState } from 'react';

interface Props {
  onUpload: () => void;
}

const FileUpload: React.FC<Props> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

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

    const formData = new FormData();
    formData.append('file', file);

    try {
     const res = await fetch('http://localhost:3001/api/upload-file', {
  method: 'POST',
  body: formData,
});
      const text = await res.text();
      setMessage(text);

      // ✅ Trigger parent to refresh DataTable
      onUpload();
    } catch (err) {
      setMessage('❌ Upload failed');
      console.error(err);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">📤 Upload Text File</h2>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-medium
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100 transition cursor-pointer"
        />

        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Upload & Load
        </button>
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
    </div>
  );
};

export default FileUpload;
