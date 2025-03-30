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

  const goToSettings = () => {
    console.log('Navigating to settings...');
    navigate('/settings');
  };

  return (
    <div className="control-bar">
      <div className="control-items-left">
        <div
          className="control-item shortcut-heading"
          style={{ cursor: 'default', pointerEvents: 'none' }}
        >
          <span className="shortcut">⌘G</span>
          <span className="label">Stealth Mode</span>
        </div>
        <div
          className="control-item shortcut-heading"
          style={{ cursor: 'default', pointerEvents: 'none' }}
        >
          <span className="shortcut">⌘B</span>
          <span className="label">Show/Hide</span>
        </div>
        <div
          className="control-item shortcut-heading"
          style={{ cursor: 'default', pointerEvents: 'none' }}
        >
          <span className="shortcut">⌘H</span>
          <span className="label">Screenshot</span>
        </div>
        <div
          className="control-item shortcut-heading"
          style={{ cursor: 'default', pointerEvents: 'none' }}
        >
          <span className="shortcut">⌘R</span>
          <span className="label">Start Over</span>
        </div>
        <div
          className="control-item shortcut-heading"
          style={{ cursor: 'default', pointerEvents: 'none' }}
        >
          <span className="shortcut">⌘I</span>
          <span className="label">Click Through</span>
        </div>
      </div>

      <div className="control-items-right">
        <button
          type="button"
          className="control-item settings-button"
          onClick={goToSettings}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <span className="label">⚙️ Settings</span>
        </button>
      </div>
    </div>
  );
}

export default ControlBar;
