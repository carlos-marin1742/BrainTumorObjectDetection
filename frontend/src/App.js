import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Create a preview URL so the user sees their MRI
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an MRI scan.");

    setLoading(true);
    const formData = new FormData();
    formData.append('mri-image', file);

    try {
      const response = await fetch('http://localhost:3000/analyze-mri', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Backend server is not responding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧠 Brain Tumor AI Detector</h1>
        
        <div className="upload-section">
          <input type="file" onChange={handleFileChange} accept="image/*" id="file-input" />
          <label htmlFor="file-input" className="custom-button">
            {file ? "Change Image" : "Select MRI Scan"}
          </label>
          
          {preview && <img src={preview} alt="MRI Preview" className="mri-preview" />}
          
          <button onClick={handleUpload} disabled={loading} className="analyze-button">
            {loading ? "Analyzing with YOLO..." : "Run AI Analysis"}
          </button>
        </div>

        {result && (
          <div className="result-card">
            {result.status === "success" ? (
              <>
                <h3>Detection: {result.detections[0]?.label}</h3>
                <p>Confidence: <strong>{result.detections[0]?.confidence}%</strong></p>
              </>
            ) : (
              <p className="error">Error: {result.message}</p>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;