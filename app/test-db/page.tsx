'use client';

import { useState, useEffect } from 'react';

export default function TestDbPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch('/api/test-db');
        
        // Handle non-JSON responses (e.g., HTML error pages)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response body preview: ${text.substring(0, 200)}...`);
        }

        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          setDetails(`User count: ${data.userCount}`);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to connect');
          setDetails(data.error || 'Unknown error');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error');
        setDetails(error instanceof Error ? error.message : String(error));
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      {status === 'loading' && (
        <div className="text-gray-600">Testing connection...</div>
      )}
      
      {status === 'success' && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h2 className="font-bold">Success!</h2>
          <p>{message}</p>
          <pre className="mt-2 text-sm">{details}</pre>
        </div>
      )}
      
      {status === 'error' && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold">Error</h2>
          <p>{message}</p>
          <pre className="mt-2 text-sm overflow-auto">{details}</pre>
        </div>
      )}
    </div>
  );
}
