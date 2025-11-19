# File Upload/Download Examples

## JavaScript/TypeScript Examples

### 1. Upload a File

```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      credentials: 'include', // Important for cookies
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('File uploaded:', result.file);
      return result.file;
    } else {
      console.error('Upload failed:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Usage with file input
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await uploadFile(file);
  }
});
```

### 2. Download a File

```javascript
async function downloadFile(fileId, filename) {
  try {
    const response = await fetch(`/api/files/${fileId}/download`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Usage
downloadFile('file-uuid-here', 'myfile.txt');
```

### 3. List Files

```javascript
async function listFiles(limit = 50, offset = 0) {
  try {
    const response = await fetch(
      `/api/files?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        credentials: 'include'
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Files:', result.files);
      return result.files;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

// Usage
const files = await listFiles();
files.forEach(file => {
  console.log(`${file.original_name} (${file.file_size} bytes)`);
});
```

### 4. Get File Metadata

```javascript
async function getFileMetadata(fileId) {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('File metadata:', result.file);
      return result.file;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
}
```

### 5. Delete a File

```javascript
async function deleteFile(fileId) {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('File deleted successfully');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
```

### 6. Get Storage Usage

```javascript
async function getStorageUsage() {
  try {
    const response = await fetch('/api/files/storage/usage', {
      method: 'GET',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Storage usage:', result.storage);
      return result.storage;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error getting storage usage:', error);
    throw error;
  }
}

// Usage
const storage = await getStorageUsage();
console.log(`Used: ${storage.usedFormatted} / ${storage.maxFormatted}`);
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function FileManager() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [storage, setStorage] = useState(null);

  // Load files on mount
  useEffect(() => {
    loadFiles();
    loadStorageUsage();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadStorageUsage = async () => {
    try {
      const response = await fetch('/api/files/storage/usage', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setStorage(result.storage);
      }
    } catch (error) {
      console.error('Error loading storage:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        // Reload files and storage
        await loadFiles();
        await loadStorageUsage();
        alert('File uploaded successfully!');
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`, {
        credentials: 'include'
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const result = await response.json();
      if (result.success) {
        await loadFiles();
        await loadStorageUsage();
        alert('File deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  return (
    <div>
      <h1>File Manager</h1>
      
      {storage && (
        <div>
          <p>Storage: {storage.usedFormatted} / {storage.maxFormatted}</p>
        </div>
      )}
      
      <div>
        <input 
          type="file" 
          onChange={handleFileUpload} 
          disabled={uploading}
        />
        {uploading && <span>Uploading...</span>}
      </div>
      
      <div>
        <h2>Your Files</h2>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <ul>
            {files.map(file => (
              <li key={file.file_id}>
                <span>{file.original_name}</span>
                <span> ({(file.file_size / 1024).toFixed(2)} KB)</span>
                <button onClick={() => handleDownload(file.file_id, file.original_name)}>
                  Download
                </button>
                <button onClick={() => handleDelete(file.file_id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FileManager;
```

## HTML Form Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>File Upload Example</title>
</head>
<body>
  <h1>Upload File</h1>
  
  <form id="uploadForm">
    <input type="file" id="fileInput" required>
    <button type="submit">Upload</button>
  </form>
  
  <div id="status"></div>
  
  <h2>Your Files</h2>
  <ul id="fileList"></ul>

  <script>
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const status = document.getElementById('status');
    const fileList = document.getElementById('fileList');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      status.textContent = 'Uploading...';

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          status.textContent = 'Upload successful!';
          fileInput.value = '';
          loadFiles();
        } else {
          status.textContent = `Upload failed: ${result.message}`;
        }
      } catch (error) {
        status.textContent = 'Upload error';
        console.error(error);
      }
    });

    async function loadFiles() {
      try {
        const response = await fetch('/api/files', {
          credentials: 'include'
        });
        const result = await response.json();

        if (result.success) {
          fileList.innerHTML = result.files.map(file => `
            <li>
              ${file.original_name} (${(file.file_size / 1024).toFixed(2)} KB)
              <button onclick="downloadFile('${file.file_id}', '${file.original_name}')">
                Download
              </button>
              <button onclick="deleteFile('${file.file_id}')">
                Delete
              </button>
            </li>
          `).join('');
        }
      } catch (error) {
        console.error('Error loading files:', error);
      }
    }

    async function downloadFile(fileId, filename) {
      try {
        const response = await fetch(`/api/files/${fileId}/download`, {
          credentials: 'include'
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download error:', error);
      }
    }

    async function deleteFile(fileId) {
      if (!confirm('Delete this file?')) return;

      try {
        const response = await fetch(`/api/files/${fileId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
          loadFiles();
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    // Load files on page load
    loadFiles();
  </script>
</body>
</html>
```

## Important Notes

1. **Credentials**: Always include `credentials: 'include'` in fetch requests to send session cookies
2. **Error Handling**: Always handle errors appropriately
3. **File Size**: Check file size before uploading (default limit is 100MB)
4. **Progress**: For large files, consider implementing upload progress tracking
5. **MIME Types**: The API automatically detects MIME types, but you can verify on the client side
