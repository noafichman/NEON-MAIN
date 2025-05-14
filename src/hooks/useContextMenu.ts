import { useState, useCallback } from 'react';
import { ContextMenuPosition } from '../types/contextMenu';

export const useContextMenu = () => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  
  const showMenu = useCallback((pos: ContextMenuPosition) => {
    setPosition(pos);
    setVisible(true);
  }, []);
  
  const hideMenu = useCallback(() => {
    setVisible(false);
  }, []);
  
  return {
    visible,
    position,
    showMenu,
    hideMenu
  };
};