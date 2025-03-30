import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function Settings(): React.ReactElement {
  const navigate = useNavigate();
  const [opacity, setOpacity] = useState(0.9);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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

  useEffect(() => {
    // @ts-ignore - API exists in runtime but not in type definitions
    window.electron.api
      .getOpenAIKey()
      .then((key: string) => {
        setApiKey(key || '');
        return key;
      })
      .catch((error: Error) => {
        console.error('Failed to get API key:', error);
        return null;
      });
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleSaveApiKey = () => {
    setIsSaving(true);
    setSaveMessage('');

    // @ts-ignore - API exists in runtime but not in type definitions
    return window.electron.api
      .setOpenAIKey(apiKey)
      .then(() => {
        setSaveMessage('API key saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        return true;
      })
      .catch((error: Error) => {
        console.error('Failed to save API key:', error);
        setSaveMessage('Failed to save API key');
        return false;
      })
      .finally(() => {
        setIsSaving(false);
      });
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

      <div className="settings-section">
        <h3>OpenAI API Key</h3>
        <div className="api-key-control">
          <div className="input-with-button">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="api-key-input"
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {saveMessage && <div className="save-message">{saveMessage}</div>}
        </div>
      </div>
    </div>
  );
}

export default Settings;
