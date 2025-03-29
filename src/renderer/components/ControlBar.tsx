import React, { useEffect, useState } from 'react';
import './ControlBar.css';

const ControlBar = () => {
  const [lastScreenshot, setLastScreenshot] = useState<string>('');

  useEffect(() => {
    // Listen for screenshot completion
    window.electron.screenshot.onComplete((path) => {
      setLastScreenshot(path);
      // Show notification
      new Notification('Screenshot taken!', {
        body: `Saved to: ${path}`,
      });
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
      <div className="control-item" onClick={() => window.electron.ipcRenderer.sendMessage('toggle-window')}>
        <span className="shortcut">⌘B</span>
        <span className="label">Show/Hide</span>
      </div>
      <div className="control-item" onClick={handleScreenshot}>
        <span className="shortcut">⌘H</span>
        <span className="label">Screenshot</span>
      </div>
      <div className="control-item" onClick={() => window.location.reload()}>
        <span className="shortcut">⌘R</span>
        <span className="label">Start Over</span>
      </div>
      {lastScreenshot && (
        <div className="screenshot-preview" title={lastScreenshot}>
          Last saved ✓
        </div>
      )}
    </div>
  );
};

export default ControlBar; 