import React, { useState } from 'react';
import './FileUploader.css';

function FileUploader({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    // Create a FormData object to send files
    const formData = new FormData();
    
    // Add all files to the FormData
    for (let i = 0; i < files.length; i++) {
      // Add the path information to help reconstruct folder structure
      const relativePath = files[i].webkitRelativePath;
      formData.append('files', files[i]);
      formData.append('paths', relativePath);
    }

    try {
      const response = await fetch('/api/upload-folder', {
        method: 'POST',
        body: formData,
        // For upload progress tracking
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload folder');
      }

      const data = await response.json();
      onUploadComplete && onUploadComplete(data);
    } catch (err) {
      setError(err.message || 'Error uploading folder');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-uploader">
      <div className="upload-container">
        <label className="upload-label">
          <input
            type="file"
            webkitdirectory="true"
            directory="true"
            onChange={handleFolderUpload}
            disabled={isUploading}
            className="file-input"
          />
          <div className="upload-button">
            {isUploading ? 'Uploading...' : 'Select Folder to Upload'}
          </div>
        </label>
        
        {isUploading && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <div className="progress-text">{uploadProgress}%</div>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default FileUploader; 