import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile, resetUploadState } from '../features/upload/uploadSlice';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

const FileUploader = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const { uploading, progress, success, error, lastResult } = useSelector((state) => state.upload);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      dispatch(resetUploadState());
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    dispatch(uploadFile(selectedFile));
  };

  const clearSelection = () => {
    setSelectedFile(null);
    dispatch(resetUploadState());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUploadSummary = () => {
    if (!lastResult || !lastResult.results) return null;
    const total = lastResult.results.length;
    const succeeded = lastResult.results.filter(r => r.status === 'success').length;
    const failed = total - succeeded;
    return { total, succeeded, failed };
  };

  const summary = getUploadSummary();

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-blue-500" />
        File Distribution
      </h2>

      {!selectedFile ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Click or drag file to this area to upload</p>
          <p className="text-sm text-gray-400 mt-1">Files will be propagated to all active nodes</p>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 overflow-hidden">
              <File className="w-8 h-8 text-blue-500 flex-shrink-0" />
              <div className="truncate">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!uploading && (
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading to CMS...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{error.message || 'An error occurred during upload.'}</p>
                {error.error && <p className="text-xs mt-1 opacity-70">Error code: {error.error}</p>}
              </div>
            </div>
          )}

          {success && lastResult && (
            <div className={`flex items-start gap-2 text-sm p-3 rounded border ${summary?.failed > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-green-700 bg-green-50 border-green-200'}`}>
              {summary?.failed > 0 ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <div>
                <p className="font-medium">
                  {summary?.failed === 0 
                    ? 'File successfully broadcasted to all nodes.' 
                    : `Partial success: Broadcasted to ${summary?.succeeded}/${summary?.total} nodes.`}
                </p>
                <p className="text-xs mt-1 opacity-80">
                  File ID: {lastResult.fileId}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={clearSelection}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || success}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upload & Broadcast'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
