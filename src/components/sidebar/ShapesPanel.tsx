import React from 'react';
import { MapPin, LineChart, Triangle, Square, Circle, ArrowRight, Edit2, Trash2, Crosshair } from 'lucide-react';
import { MapShape } from '../../types/shapes';

const shapeTypeIcon: Record<MapShape['type'], React.ElementType> = {
  point: MapPin,
  polyline: LineChart,
  polygon: Triangle,
  rectangle: Square,
  circle: Circle,
  arrow: ArrowRight
};

interface ShapesPanelProps {
  shapes: MapShape[];
  onShapeEdit?: (shape: MapShape) => void;
  onShapeDelete?: (shapeId: string) => void;
  onShapeCenter?: (shape: MapShape) => void;
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({ shapes, onShapeEdit, onShapeDelete, onShapeCenter }) => {
  return (
    <div className="overflow-y-auto h-[calc(100%-56px)] rounded-b-lg p-2">
      <div className="h-full bg-black/40 rounded-lg border border-gray-800/30">
        {shapes.length === 0 && (
          <div className="text-gray-400 text-center py-8">No shapes on map</div>
        )}
        {shapes.map((shape, idx) => {
          const Icon = shapeTypeIcon[shape.type] || MapPin;
          return (
            <div
              key={shape.id}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors border-b border-white/10 ${shape.isEnemy ? 'bg-red-950/20' : ''}`}
            >
              <Icon 
                size={20} 
                className={shape.isEnemy ? "text-red-600" : "text-green-400"} 
              />
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-xs ${shape.isEnemy ? 'text-red-300' : 'text-white'} truncate`}>
                  {shape.name} {shape.isEnemy && '⚠️'}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} 
                  {shape.isEnemy && <span className="text-red-400 ml-1">- Enemy</span>}
                </div>
              </div>
              <button
                className="p-1 hover:bg-gray-700/50 rounded-md transition-colors"
                title="Center on Map"
                onClick={() => onShapeCenter && onShapeCenter(shape)}
              >
                <Crosshair size={14} className="text-blue-400" />
              </button>
              <button
                className="p-1 hover:bg-gray-700/50 rounded-md transition-colors"
                title="Edit"
                onClick={() => onShapeEdit && onShapeEdit(shape)}
              >
                <Edit2 size={14} className="text-yellow-400" />
              </button>
              <button
                className="p-1 hover:bg-gray-700/50 rounded-md transition-colors"
                title="Delete"
                onClick={() => onShapeDelete && onShapeDelete(shape.id)}
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapesPanel; 