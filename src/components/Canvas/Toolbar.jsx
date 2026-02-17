import React, { useState } from "react";
import { useBoardStore } from "../../store/boardStore";

export default function Toolbar({ onRecenter, offsetX = 0, offsetY = 0 }) {
  const [url, setUrl] = useState("");
  const addImage = useBoardStore((state) => state.addimage);

  const handleAddImage = () => {
    if (!url) return;

    const img = new Image();
    img.src = url;

    img.onload = () => {
      const maxWidth = 200;
      const scale = maxWidth / img.width;

      const width = maxWidth;
      const height = img.height * scale;

      // Centrer l'image au centre de l'écran visible
      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = (window.innerHeight - 64) / 2; // 64px pour la toolbar

      addImage({
        url,
        x: screenCenterX - offsetX - width / 2,
        y: screenCenterY - offsetY - height / 2,
        width,
        height,
      });
      setUrl("");
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddImage();
    }
  };

  return (
    <div className="toolbar w-full h-16 bg-gray-700 border-b-2 border-gray-600 p-4 flex gap-2 flex-shrink-0 z-20">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        type="text"
        placeholder="https://... (ou Ctrl+V pour coller une image)"
        className="flex-1 px-3 py-2 rounded text-black border border-gray-400 focus:border-blue-500 focus:outline-none"
      />
      <button
        onClick={handleAddImage}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
      >
        Ajouter Image
      </button>
      <button
        onClick={onRecenter}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors font-medium whitespace-nowrap"
        title="Recentrer la vue"
      >
        ⊙ Centrer
      </button>
    </div>
  );
}
