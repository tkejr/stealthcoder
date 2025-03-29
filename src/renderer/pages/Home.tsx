import { useState, useEffect, useCallback } from 'react';
import CodeRenderer from '../components/CodeRenderer';

// Add this before the component
interface Analysis {
  thoughts: string[];
  solution: string;
  language: string;
}

function SkeletonLoader() {
  return (
    <div
      style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        height: '150px',
        animation: 'pulse 1.5s infinite',
        marginBottom: '1rem',
      }}
    />
  );
}

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);

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

      setLoading(true);
      setError('');
      setAnalysis(null); // Clear previous analysis

      const response = await fetch('http://localhost:3000/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Input: base64Data.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || data.details || 'Failed to analyze image',
        );
      }

      setAnalysis(data); // Server now sends { thoughts, solution } directly
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
    <div
      className="content-area"
      style={{
        backgroundColor: '#1a1a1a',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#e1e1e1',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {screenshot && (
          <div style={{ marginBottom: '2rem' }}>
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
          <h3
            style={{
              marginBottom: '1rem',
              fontSize: '1.5rem',
            }}
          >
            My Thoughts
          </h3>
          {loading && <SkeletonLoader />}
          {!loading && analysis && (
            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  margin: 0,
                  color: '#e1e1e1',
                  lineHeight: '1.6',
                }}
              >
                {analysis.thoughts.map((thought: string) => (
                  <div
                    key={`thought-${thought.slice(0, 10)}`}
                    style={{ display: 'flex', marginBottom: '0.5rem' }}
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
              marginBottom: '1rem',
              fontSize: '1.5rem',
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
  );
}
