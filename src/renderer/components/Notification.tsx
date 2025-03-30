import { useState, useEffect } from 'react';

export default function Notification() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    window.electron.notifications.onNotification((msg: string) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 2000); // Hide after 2 seconds
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        transition: 'opacity 0.3s',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  );
} 