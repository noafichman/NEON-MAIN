import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AlertEntity } from '../../hooks/useMilitaryEntities';
import { createSymbol } from '../../utils/symbolUtils';

interface AlertPanelProps {
  alerts: AlertEntity[];
  onDismiss: (id: string) => void;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="absolute top-16 right-4 z-50 w-80 space-y-2">
      {alerts.map(alert => (
        <div 
          key={`${alert.id}-${alert.timestamp}`}
          className="bg-red-900/40 backdrop-blur-sm border border-red-800/30 rounded-lg overflow-hidden animate-slideIn"
        >
          <div className="flex items-center justify-between bg-red-950/50 px-3 py-2 border-b border-red-800/30">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={16} />
              <span className="font-medium text-sm">New Hostile Entity</span>
            </div>
            <button 
              onClick={() => onDismiss(alert.id)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-3 text-sm">
            <div className="flex items-start gap-2">
              <div 
                className="w-8 h-8 flex items-center justify-center bg-black/50 rounded-md"
                dangerouslySetInnerHTML={{ 
                  __html: createSymbol(alert.sidc, { size: 24 }) 
                }} 
              />
              <div>
                <div className="font-medium text-white">{alert.id}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Position: ({alert.position.latitude.toFixed(2)}, {alert.position.longitude.toFixed(2)})
                </div>
                <div className="text-xs text-red-400 mt-1">
                  Detected: {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertPanel; 