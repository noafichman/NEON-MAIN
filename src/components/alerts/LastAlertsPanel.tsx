import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AlertEntity } from '../../hooks/useMilitaryEntities';
import { createSymbol } from '../../utils/symbolUtils';

interface LastAlertsPanelProps {
  alerts: AlertEntity[];
  visible: boolean;
  onClose: () => void;
}

const LastAlertsPanel: React.FC<LastAlertsPanelProps> = ({ alerts, visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="absolute top-16 right-4 z-50 w-80 bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg overflow-hidden animate-slideIn">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/30 bg-gray-900/40">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="font-medium text-sm text-white">Recent Alerts</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-4 text-sm text-gray-400 text-center">
            No recent alerts
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={`${alert.id}-${alert.timestamp}`}
              className="p-3 border-b border-gray-800/30 last:border-0"
            >
              <div className="flex items-start gap-2">
                <div 
                  className="w-8 h-8 flex items-center justify-center bg-black/50 rounded-md"
                  dangerouslySetInnerHTML={{ 
                    __html: createSymbol(alert.sidc, { size: 24 }) 
                  }} 
                />
                <div>
                  <div className="font-medium text-sm text-white">{alert.id}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Position: ({alert.position.latitude.toFixed(2)}, {alert.position.longitude.toFixed(2)})
                  </div>
                  <div className="text-xs text-red-400 mt-1">
                    Detected: {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LastAlertsPanel; 