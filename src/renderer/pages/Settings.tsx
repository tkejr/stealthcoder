import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function Settings(): React.ReactElement {
  const navigate = useNavigate();
  const [opacity, setOpacity] = useState(0.9);

  useEffect(() => {
    // Load saved opacity from main process
    window.electron.windowControl
      .getOpacity()
      .then((value) => {
        setOpacity(value);
        return value;
      })
      .catch((error) => {
        console.error('Failed to get opacity:', error);
        // Fall back to default opacity on error
        setOpacity(0.9);
        return 0.9;
      });
  }, []);

  useEffect(() => {
    // Remove body opacity setting since we'll handle it via CSS
    // window.electron.windowControl.setOpacity(opacity) will handle the window opacity
    window.electron.windowControl.setOpacity(opacity);
  }, [opacity]);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="content-area">
      <div className="settings-header">
        <button type="button" onClick={handleBack} className="back-button">
          ←
        </button>
        <h2>Settings</h2>
      </div>
      <div className="settings-section">
        <h3>Window Opacity</h3>
        <div className="opacity-control">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
          />
          <span>{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

export default Settings;
