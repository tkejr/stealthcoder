import { useState, useEffect, useCallback } from 'react';
import CodeRenderer from '../components/CodeRenderer';
import Notification from '../components/Notification';

// Add this before the component
interface Analysis {
  thoughts: string[];
  solution: string;
  language: string;
}

function SkeletonLoader() {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {[1, 2, 3].map((line) => (
        <div
          key={line}
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            height: '24px',
            marginBottom: '12px',
            animation: 'pulse 1.5s infinite',
            width: `${Math.floor(Math.random() * (95 - 70) + 70)}%`, // Random width between 70-95%
          }}
        />
      ))}
    </div>
  );
}

// Add a helper function to handle local storage
const getStoredState = () => {
  try {
    const storedAnalysis = localStorage.getItem('analysis');
    const storedScreenshot = localStorage.getItem('screenshot');
    return {
      analysis: storedAnalysis ? JSON.parse(storedAnalysis) : null,
      screenshot: storedScreenshot,
    };
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return { analysis: null, screenshot: null };
  }
};

export default function Home() {
  // Initialize state from localStorage
  const { analysis: storedAnalysis, screenshot: storedScreenshot } =
    getStoredState();
  const [analysis, setAnalysis] = useState<Analysis | null>(storedAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(storedScreenshot);

  // Update localStorage when state changes
  useEffect(() => {
    if (analysis) {
      localStorage.setItem('analysis', JSON.stringify(analysis));
    }
    if (screenshot) {
      localStorage.setItem('screenshot', screenshot);
    }
  }, [analysis, screenshot]);

  const validateBase64 = (input: string) => {
    // Remove any whitespace and potential data URL prefix
    const cleanInput = input.trim().replace(/^data:image\/\w+;base64,/, '');

    // Base64 validation regex that allows for standard and URL-safe variants
    const base64Regex = /^[A-Za-z0-9+/\-_]*={0,2}$/;

    return cleanInput.length % 4 === 0 && base64Regex.test(cleanInput);
  };

  const handleAnalyze = useCallback(async (base64Data: string) => {
    try {
      if (!validateBase64(base64Data)) {
        setError('Invalid screenshot data');
        return;
      }

      // Get the API key
      const apiKey = await window.electron.api
        ?.getOpenAIKey()
        .catch((err: Error) => {
          console.error('Failed to get API key:', err);
          return null;
        });
      
      if (!apiKey) {
        setError('OpenAI API key not found. Please add it in settings.');
        return;
      }

      setLoading(true);
      setError('');
      setAnalysis(null); // Clear previous analysis

      const response = await fetch('http://localhost:3000/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Input: base64Data.trim(),
          apiKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || data.details || 'Failed to analyze image',
        );
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.electron.screenshot.onComplete((base64) => {
      setScreenshot(`data:image/png;base64,${base64}`);
      handleAnalyze(base64);
    });
  }, [handleAnalyze]);

  return (
    <div className="content-area" style={{ position: 'relative' }}>
      <Notification />
      <div
        className="content-area"
        style={{
          backgroundColor: '#1a1a1a',
          minHeight: '100vh',
          padding: '1rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          color: '#e1e1e1',
          fontSize: '14px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {screenshot && (
            <div style={{ marginBottom: '1rem' }}>
              <img
                src={screenshot}
                alt="Latest Screenshot"
                style={{
                  maxWidth: '10%',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                }}
              />
            </div>
          )}

          <div>
            {(loading || analysis) && (
              <>
                <h3
                  style={{
                    marginBottom: '0.75rem',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    color: '#e1e1e1',
                  }}
                >
                  My Thoughts
                </h3>
                {loading && <SkeletonLoader />}
                {!loading && analysis && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div
                      style={{
                        margin: 0,
                        color: '#e1e1e1',
                        lineHeight: '1.4',
                      }}
                    >
                      {analysis.thoughts.map((thought: string) => (
                        <div
                          key={`thought-${thought.slice(0, 10)}`}
                          style={{ display: 'flex', marginBottom: '0.4rem' }}
                        >
                          <span style={{ marginRight: '0.5rem' }}>•</span>
                          <span>{thought}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3
                  style={{
                    marginBottom: '0.75rem',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    color: '#e1e1e1',
                  }}
                >
                  Solution
                </h3>
                {loading && <SkeletonLoader />}
                {!loading && analysis && (
                  <div>
                    <CodeRenderer
                      code={analysis.solution}
                      language={analysis.language}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#2c1518',
                color: '#ff8a8a',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem',
                border: '1px solid #4a1f23',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    </div>
  );
}
