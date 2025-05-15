import React, { useState, useEffect } from 'react';

interface ManualEntityFormProps {
  lat?: number;
  lng?: number;
  onClose: () => void;
  onSaved: () => void;
}

// Define options based on the values in c4i_table
const FRIENDLY_OPTIONS = ['Friendly', 'Hostile', 'Neutral', 'Unknown'];
const ECHLON_OPTIONS = ['Team', 'Squad', 'Platoon', 'Company', 'Battalion', 'Regiment'];
const DESTROYED_OPTIONS = ['Active', 'Moving', 'Destroyed', 'Concealed', 'En Route', 'Tracking'];

// Update the API URL determination to force using the full URL in development
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

const ManualEntityForm: React.FC<ManualEntityFormProps> = ({ lat, lng, onClose, onSaved }) => {
  const [id, setId] = useState('');
  const [friendly, setFriendly] = useState(FRIENDLY_OPTIONS[0]);
  const [echlon, setEchlon] = useState(ECHLON_OPTIONS[0]);
  const [destroyed, setDestroyed] = useState(DESTROYED_OPTIONS[0]);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof lat === 'number' && !isNaN(lat)) {
      setY(lat);
    }
    if (typeof lng === 'number' && !isNaN(lng)) {
      setX(lng);
    }
  }, [lat, lng]);

  // Add debug option to show full information about the API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo(null);
    
    if (!id) {
      setError('ID is required');
      return;
    }
    if (isNaN(x) || isNaN(y)) {
      setError('Invalid coordinates');
      return;
    }
    
    setLoading(true);
    const payload = { id, friendly, echlon, destroyed, x, y, z };
    const url = `${API_URL}/manual-entities`;
    setDebugInfo(`Sending to: ${url}\nPayload: ${JSON.stringify(payload, null, 2)}`);
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // Get response as text first for debugging
      const responseText = await res.text();
      setDebugInfo(prev => `${prev}\n\nResponse status: ${res.status}\nResponse text: ${responseText}`);
      
      if (!res.ok) {
        let errorMessage = 'Failed to add entity';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          // If can't parse as JSON, use the raw text
          errorMessage = `${errorMessage}: ${responseText}`;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      onSaved();
    } catch (err: any) {
      setError(`Network error: ${err.message || 'Unknown error'}`);
      setDebugInfo(prev => `${prev}\n\nCaught exception: ${err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">Add Manual Entity</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">ID *</label>
            <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Friendly</label>
            <select 
              value={friendly} 
              onChange={e => setFriendly(e.target.value)} 
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              {FRIENDLY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Echlon</label>
            <select 
              value={echlon} 
              onChange={e => setEchlon(e.target.value)} 
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              {ECHLON_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select 
              value={destroyed} 
              onChange={e => setDestroyed(e.target.value)} 
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              {DESTROYED_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">X (Longitude)</label>
            <input type="number" value={x} onChange={e => setX(Number(e.target.value))} className="w-full p-2 rounded bg-gray-800 text-white" step="any" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Y (Latitude)</label>
            <input type="number" value={y} onChange={e => setY(Number(e.target.value))} className="w-full p-2 rounded bg-gray-800 text-white" step="any" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Z</label>
            <input type="number" value={z} onChange={e => setZ(Number(e.target.value))} className="w-full p-2 rounded bg-gray-800 text-white" step="any" />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {debugInfo && (
            <div className="mt-2 p-2 bg-gray-800 text-xs text-gray-400 rounded-md overflow-auto max-h-32">
              <pre>{debugInfo}</pre>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntityForm; 