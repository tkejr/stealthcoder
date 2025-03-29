import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ControlBar.css';

declare global {
  interface Window {
    electron: {
      screenshot: {
        capture: () => Promise<void>;
        onComplete: (callback: (path: string) => void) => void;
      };
      ipcRenderer: {
        sendMessage: (channel: string, args?: unknown[]) => void;
      };
      windowControl: {
        setOpacity: (value: number) => Promise<void>;
        getOpacity: () => Promise<number>;
      };
    };
  }
}

function ControlBar() {
  const navigate = useNavigate();
  const [lastScreenshot, setLastScreenshot] = useState<string>('');

  useEffect(() => {
    // Listen for screenshot completion
    window.electron.screenshot.onComplete((path) => {
      console.log('Screenshot completed: in control barx', path);
      setLastScreenshot(path);
    });
  }, []);

  const handleScreenshot = async () => {
    try {
      await window.electron.screenshot.capture();
    } catch (err) {
      console.error('Failed to take screenshot:', err);
    }
  };

  return (
    <div className="control-bar">
      <div className="control-items-left">
        <button
          type="button"
          className="control-item"
          onClick={() =>
            window.electron.ipcRenderer.sendMessage('toggle-window')
          }
        >
          <span className="shortcut">⌘B</span>
          <span className="label">Show/Hide</span>
        </button>
        <button
          type="button"
          className="control-item"
          onClick={handleScreenshot}
        >
          <span className="shortcut">⌘H</span>
          <span className="label">Screenshot</span>
        </button>
        <button
          type="button"
          className="control-item"
          onClick={() => window.location.reload()}
        >
          <span className="shortcut">⌘R</span>
          <span className="label">Start Over</span>
        </button>
      </div>

      <div className="control-items-right">
        {lastScreenshot && (
          <div className="screenshot-preview" title={lastScreenshot}>
            Last saved ✓
          </div>
        )}
        <button
          type="button"
          className="control-item settings-button"
          onClick={() => navigate('/settings')}
        >
          <span className="label">⚙️ Settings</span>
        </button>
      </div>
    </div>
  );
}

export default ControlBar;
