import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "../../store/boardStore";
import Toolbar from "./Toolbar";

export default function Canvas() {
  const images = useBoardStore((state) => state.images);
  const selectedImageIds = useBoardStore((state) => state.selectedImageIds);
  const addImage = useBoardStore((state) => state.addimage);
  const updateMultipleImagePositions = useBoardStore(
    (state) => state.updateMultipleImagePositions,
  );
  const selectImages = useBoardStore((state) => state.selectImages);
  const clearSelection = useBoardStore((state) => state.clearSelection);
  const [openPanel, setOpenPanel] = useState(null);

  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const dragStartRef = useRef({ x: 0, y: 0 });

  // Boîte de sélection
  const selectionBoxRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const panningRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    prevOffsetX: 0,
    prevOffsetY: 0,
  });

  const draggingRef = useRef({
    active: false,
    imageIds: [],
    startX: 0,
    startY: 0,
    prevPositions: {},
  });

  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [selectionBox, setSelectionBox] = useState(null);

  useEffect(() => {
    offsetRef.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Coller image depuis clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const files = e.clipboardData.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const maxWidth = 200;
          const scaleImg = maxWidth / img.width;
          const centerX =
            (window.innerWidth / 2 - offsetRef.current.x) / scaleRef.current;
          const centerY =
            (window.innerHeight / 2 - offsetRef.current.y) / scaleRef.current;

          addImage({
            url: reader.result,
            x: centerX - (img.width * scaleImg) / 2,
            y: centerY - (img.height * scaleImg) / 2,
            width: img.width * scaleImg,
            height: img.height * scaleImg,
          });
        };
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addImage]);

  const handleMouseDown = (e) => {
    if (e.target.closest(".toolbar")) return;

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX =
      (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
    const mouseY =
      (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

    if (e.button === 0) {
      // Vérifier clic sur image
      let clickedImageId = null;
      for (let i = images.length - 1; i >= 0; i--) {
        const img = images[i];
        if (
          mouseX >= img.x &&
          mouseX <= img.x + img.width &&
          mouseY >= img.y &&
          mouseY <= img.y + img.height
        ) {
          clickedImageId = img.id;
          break;
        }
      }

      if (clickedImageId) {
        // Drag images
        if (!selectedImageIds.includes(clickedImageId))
          selectImages([clickedImageId]);
        draggingRef.current.active = true;
        draggingRef.current.imageIds = selectedImageIds.includes(clickedImageId)
          ? [...selectedImageIds]
          : [clickedImageId];
        draggingRef.current.startX = e.clientX;
        draggingRef.current.startY = e.clientY;
        draggingRef.current.prevPositions = {};
        draggingRef.current.imageIds.forEach((id) => {
          const img = images.find((i) => i.id === id);
          if (img)
            draggingRef.current.prevPositions[id] = { x: img.x, y: img.y };
        });
      } else {
        // Boîte de sélection
        selectionBoxRef.current.active = true;
        selectionBoxRef.current.startX = mouseX;
        selectionBoxRef.current.startY = mouseY;
        selectionBoxRef.current.currentX = mouseX;
        selectionBoxRef.current.currentY = mouseY;
        clearSelection();
      }
    }

    // Clic droit : panning
    if (e.button === 2) {
      panningRef.current.active = true;
      setIsPanning(true);
      panningRef.current.startX = e.clientX;
      panningRef.current.startY = e.clientY;
      panningRef.current.prevOffsetX = offsetRef.current.x;
      panningRef.current.prevOffsetY = offsetRef.current.y;
    }
  };

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();

    // Boîte de sélection
    if (selectionBoxRef.current.active) {
      const mouseX =
        (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const mouseY =
        (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;
      selectionBoxRef.current.currentX = mouseX;
      selectionBoxRef.current.currentY = mouseY;

      const minX = Math.min(selectionBoxRef.current.startX, mouseX);
      const minY = Math.min(selectionBoxRef.current.startY, mouseY);
      const maxX = Math.max(selectionBoxRef.current.startX, mouseX);
      const maxY = Math.max(selectionBoxRef.current.startY, mouseY);

      setSelectionBox({
        startX: minX,
        startY: minY,
        currentX: maxX,
        currentY: maxY,
      });

      // Sélection images
      const selectedIds = images
        .filter(
          (img) =>
            img.x + img.width > minX &&
            img.x < maxX &&
            img.y + img.height > minY &&
            img.y < maxY,
        )
        .map((img) => img.id);

      selectImages(selectedIds);
      return;
    }

    // Drag images
    if (draggingRef.current.active) {
      const deltaX =
        (e.clientX - draggingRef.current.startX) / scaleRef.current;
      const deltaY =
        (e.clientY - draggingRef.current.startY) / scaleRef.current;
      updateMultipleImagePositions(
        draggingRef.current.imageIds,
        deltaX,
        deltaY,
      );
      draggingRef.current.startX = e.clientX;
      draggingRef.current.startY = e.clientY;
      return;
    }

    // Panning
    if (panningRef.current.active) {
      const dx = e.clientX - panningRef.current.startX;
      const dy = e.clientY - panningRef.current.startY;
      setOffsetX(panningRef.current.prevOffsetX + dx);
      setOffsetY(panningRef.current.prevOffsetY + dy);
    }
  };

  const handleMouseUp = () => {
    panningRef.current.active = false;
    setIsPanning(false);
    draggingRef.current.active = false;
    selectionBoxRef.current.active = false;
    setSelectionBox(null);
  };

  const handleCanvasClick = (e) => {
    const dragDistance = Math.hypot(
      e.clientX - dragStartRef.current.x,
      e.clientY - dragStartRef.current.y,
    );
    if (dragDistance > 5) return;
    if (e.target.closest(".toolbar")) return;

    // Si clic sur image, ne rien faire
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX =
      (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
    const mouseY =
      (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;
    for (let i = images.length - 1; i >= 0; i--) {
      const img = images[i];
      if (
        mouseX >= img.x &&
        mouseX <= img.x + img.width &&
        mouseY >= img.y &&
        mouseY <= img.y + img.height
      )
        return;
    }

    clearSelection();
    setOpenPanel(null);
  };

  // Zoom
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newScale = Math.min(
        Math.max(scaleRef.current - e.deltaY * zoomSpeed, 0.1),
        4,
      );
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const offsetXNew =
        mouseX - ((mouseX - offsetRef.current.x) * newScale) / scaleRef.current;
      const offsetYNew =
        mouseY - ((mouseY - offsetRef.current.y) * newScale) / scaleRef.current;

      setScale(newScale);
      setOffsetX(offsetXNew);
      setOffsetY(offsetYNew);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("contextmenu", (e) => e.preventDefault());
      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("contextmenu", (e) => e.preventDefault());
      };
    }
  }, []);

  // Empêcher le navigateur d'ouvrir les fichiers directement
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  const handleRecenter = () => {
    setOffsetX(0);
    setOffsetY(0);
    setScale(1);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const dropX =
      (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current;
    const dropY =
      (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current;

    // Traiter les fichiers
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const maxWidth = 200;
          const scaleImg = maxWidth / img.width;
          addImage({
            url: reader.result,
            x: dropX - (img.width * scaleImg) / 2,
            y: dropY - (img.height * scaleImg) / 2,
            width: img.width * scaleImg,
            height: img.height * scaleImg,
          });
        };
      };
      reader.readAsDataURL(file);
    } else {
      // Traiter les URLs (drag depuis navigateur)
      const url = e.dataTransfer.getData("text/uri-list");
      if (url) {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 200;
          const scaleImg = maxWidth / img.width;
          addImage({
            url,
            x: dropX - (img.width * scaleImg) / 2,
            y: dropY - (img.height * scaleImg) / 2,
            width: img.width * scaleImg,
            height: img.height * scaleImg,
          });
        };
        img.src = url;
      }
    }
  };

  return (
    <div className="flex w-screen h-screen select-none">
      <Toolbar
        openPanel={openPanel}
        setOpenPanel={setOpenPanel}
        onRecenter={handleRecenter}
        offsetX={offsetX}
        offsetY={offsetY}
      />

      <div
        ref={containerRef}
        className={`flex-1 bg-gray-900 overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Grille */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(0deg, #fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        {/* Contenu avec offset & zoom */}
        <div
          ref={contentRef}
          className="absolute"
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            transformOrigin: "top left",
            width: "1000000px",
            height: "1000000px",
          }}
        >
          {/* Box de sélection */}
          {selectionBox && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 opacity-20 pointer-events-none"
              style={{
                top: selectionBox.startY,
                left: selectionBox.startX,
                width: selectionBox.currentX - selectionBox.startX,
                height: selectionBox.currentY - selectionBox.startY,
              }}
            />
          )}

          {/* Images */}
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                position: "absolute",
                top: img.y,
                left: img.x,
                width: img.width,
                height: img.height,
              }}
            >
              <img
                src={img.url}
                alt=""
                draggable="false"
                className={`absolute w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing ${
                  selectedImageIds.includes(img.id)
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
