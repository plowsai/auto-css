import React, { useState } from 'react';
import './FileUploader.css';

function FileUploader({ onUploadComplete, onUploadStart, onUploadError, isUploading: externalIsUploading }) {
  const [isLocalUploading, setIsLocalUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Use external isUploading state if provided, otherwise use local state
  const isUploading = externalIsUploading !== undefined ? externalIsUploading : isLocalUploading;

  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLocalUploading(true);
    setError(null);
    setUploadProgress(0);
    
    // Notify parent component that upload has started
    onUploadStart && onUploadStart();

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
      // Use the new API endpoint for processing projects
      const response = await fetch('/api/process-project', {
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
      
      if (!data.success) {
        throw new Error(data.error || 'Error processing project');
      }
      
      onUploadComplete && onUploadComplete(data);
    } catch (err) {
      const errorMessage = err.message || 'Error uploading folder';
      setError(errorMessage);
      onUploadError && onUploadError(errorMessage);
    } finally {
      setIsLocalUploading(false);
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