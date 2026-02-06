import { Minus, Square, X } from "lucide-react";
import { useState, useEffect } from "react";

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.windowControl.isMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI.windowControl.minimize();
  };

  const handleMaximize = async () => {
    window.electronAPI.windowControl.maximize();
    const maximized = await window.electronAPI.windowControl.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI.windowControl.close();
  };

  return (
    <div className="fixed top-0 right-0 z-50 flex items-center h-8">
      <button onClick={handleMinimize} className="flex items-center justify-center w-12 h-8 hover:bg-muted transition-colors" aria-label="Minimize">
        <Minus className="w-4 h-4" />
      </button>
      <button onClick={handleMaximize} className="flex items-center justify-center w-12 h-8 hover:bg-muted transition-colors" aria-label="Maximize">
        <Square className="w-3 h-3" />
      </button>
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-12 h-8 hover:bg-red-500 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
