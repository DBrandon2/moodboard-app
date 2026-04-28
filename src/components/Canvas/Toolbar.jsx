import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBoardStore } from "../../store/boardStore";
import {
  FiCompass,
  FiPlus,
  FiLink,
  FiUpload,
  FiTrash2,
  FiDownload,
  FiUploadCloud,
} from "react-icons/fi";

export default function Toolbar({
  onRecenter,
  offsetX = 0,
  offsetY = 0,
  isMobile: isMobileFromProps = null,
}) {
  const [url, setUrl] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [isMobileLocal, setIsMobileLocal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const addImage = useBoardStore((state) => state.addimage);
  const clearStorage = useBoardStore((state) => state.clearStorage);
  const loadFromImport = useBoardStore((state) => state.loadFromImport);
  const images = useBoardStore((state) => state.images);

  // Si isMobile est passé en prop, l'utiliser directement, sinon détecter localement
  const isMobile =
    isMobileFromProps !== null ? isMobileFromProps : isMobileLocal;

  // Détecter si mobile (fallback si pas de prop)
  useEffect(() => {
    if (isMobileFromProps === null) {
      const checkMobile = () => {
        const mobile =
          window.innerWidth < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );
        setIsMobileLocal(mobile);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, [isMobileFromProps]);

  const handleAddImage = () => {
    if (!url) return;

    const img = new Image();
    img.src = url;

    img.onload = () => {
      const maxWidth = 200;
      const scale = maxWidth / img.width;

      const width = maxWidth;
      const height = img.height * scale;

      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;

      addImage({
        url,
        x: screenCenterX - offsetX - width / 2,
        y: screenCenterY - offsetY - height / 2,
        width,
        height,
        originalWidth: img.width,
        originalHeight: img.height,
      });
      setUrl("");
      setAddMenuOpen(false);
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddImage();
  };

  const handleClearStorage = () => {
    clearStorage();
    setShowClearConfirm(false);
  };

  const handleDownloadData = () => {
    const storageKey = "moodboard_state";
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      alert("Aucune donnée à télécharger");
      return;
    }

    const dataStr = JSON.stringify(JSON.parse(stored), null, 2);
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/json;charset=utf-8," + encodeURIComponent(dataStr),
    );
    element.setAttribute(
      "download",
      `moodboard_backup_${new Date().toISOString().split("T")[0]}.json`,
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImportFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        loadFromImport(importedData);
        alert("✓ Moodboard importé avec succès !");
      } catch (error) {
        alert(`Erreur lors de l'import: ${error.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddMenuToggle = (e) => {
    e.stopPropagation();
    setAddMenuOpen(!addMenuOpen);
  };

  // fermer menu si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-add-menu]")) {
        setAddMenuOpen(false);
      }
    };
    if (addMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [addMenuOpen]);

  return (
    <>
      <div
        className="flex items-center justify-center gap-2 sm:gap-4 bg-gray-800/90 toolbar touch-none border-gray-700"
        style={{
          position: "fixed",
          bottom: isMobile ? "0" : "auto",
          top: isMobile ? "auto" : "0",
          left: "0",
          right: "0",
          zIndex: 2000,
          width: isMobile ? "100%" : "4rem",
          height: isMobile ? "4rem" : "100%",
          flexDirection: isMobile ? "row" : "column",
          padding: isMobile
            ? "max(0.5rem, env(safe-area-inset-bottom))"
            : "1rem",
          borderTop: isMobile ? "1px solid #374151" : "none",
          borderRight: isMobile ? "none" : "1px solid #374151",
          backdropFilter: "blur(10px)",
        }}
        data-mobile={isMobile}
      >
        {/* Bouton Recentrer */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRecenter();
          }}
          className="text-white text-2xl sm:text-3xl p-2 sm:p-3 hover:bg-gray-700 rounded transition-colors active:bg-gray-600"
          title="Recentrer"
        >
          <FiCompass />
        </button>

        {/* Bouton Add (plus) */}
        <button
          onClick={handleAddMenuToggle}
          className="text-white text-2xl sm:text-3xl p-2 sm:p-3 hover:bg-gray-700 rounded transition-colors active:bg-gray-600"
          title="Ajouter une image"
        >
          <FiPlus />
        </button>

        {/* Bouton Télécharger données */}
        <button
          onClick={handleDownloadData}
          className="text-white text-2xl sm:text-3xl p-2 sm:p-3 hover:bg-gray-700 rounded transition-colors active:bg-gray-600"
          title="Télécharger la sauvegarde"
        >
          <FiDownload />
        </button>

        {/* Bouton Importer données */}
        <button
          onClick={() => importInputRef.current?.click()}
          className="text-white text-2xl sm:text-3xl p-2 sm:p-3 hover:bg-gray-700 rounded transition-colors active:bg-gray-600"
          title="Importer une sauvegarde"
        >
          <FiUploadCloud />
        </button>
        <input
          type="file"
          ref={importInputRef}
          className="hidden"
          accept=".json"
          onChange={handleImportFile}
        />

        {/* Bouton Effacer données */}
        <div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-white text-2xl sm:text-3xl p-2 sm:p-3 hover:bg-red-700 rounded transition-colors active:bg-red-800"
            title="Effacer le moodboard"
            disabled={images.length === 0}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Portals pour les modals (en dehors de la Toolbar) */}
      {/* Modal de confirmation */}
      {showClearConfirm &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowClearConfirm(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 xs:p-8 w-full max-w-sm border border-gray-700 shadow-2xl">
                <h3 className="text-white text-lg xs:text-xl font-semibold mb-3 xs:mb-4">
                  Êtes-vous sûr ?
                </h3>
                <p className="text-gray-300 mb-6 text-base xs:text-lg">
                  Cette action supprimera toutes les images et la session sera
                  réinitialisée.
                </p>
                <div className="flex flex-col xs:flex-row gap-3 gap-y-3 xs:gap-x-4 xs:justify-end">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 xs:px-6 py-3 xs:py-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors 
                    font-medium text-base xs:text-lg min-h-[44px] xs:min-h-[48px] w-full xs:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleClearStorage}
                    className="px-4 xs:px-6 py-3 xs:py-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors 
                    font-semibold text-base xs:text-lg min-h-[44px] xs:min-h-[48px] w-full xs:w-auto"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Modal d'ajout d'image */}
      {addMenuOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setAddMenuOpen(false)}
            />

            {/* Modal/Drawer - Responsive positioning */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`
              fixed z-50 bg-amber-50 border border-gray-300 rounded-lg shadow-2xl
              transition-all duration-300 transform origin-center
              ${
                isMobile
                  ? "bottom-16 left-2 right-2 max-h-96"
                  : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-h-96"
              }
              animated-menu
            `}
              style={{
                animation: "menu-appear 0.18s ease-out forwards",
              }}
            >
              {/* Contenu du modal */}
              <div className="flex flex-col h-full p-4 xs:p-6 overflow-y-auto">
                <p className="text-gray-900 font-semibold mb-4 text-lg xs:text-xl flex-shrink-0">
                  Ajouter une image
                </p>

                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  type="text"
                  placeholder="https://..."
                  className="px-4 py-3 xs:py-4 rounded text-gray-900 border border-gray-400 w-full mb-4 text-base xs:text-lg 
                  min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-700 flex-shrink-0"
                />

                <div className="flex flex-col gap-2 xs:gap-3 mt-auto flex-shrink-0">
                  <button
                    onClick={handleAddImage}
                    className="flex items-center justify-center px-4 py-4 xs:py-5 bg-gray-800 text-white rounded 
                    hover:bg-gray-900 active:bg-gray-950 transition-colors font-medium touch-none
                    text-base xs:text-lg min-h-[44px] xs:min-h-[48px] w-full"
                  >
                    <FiLink className="mr-2" /> URL
                  </button>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center justify-center px-4 py-4 xs:py-5 bg-gray-800 text-white rounded 
                    hover:bg-gray-900 active:bg-gray-950 transition-colors font-medium touch-none
                    text-base xs:text-lg min-h-[44px] xs:min-h-[48px] w-full"
                  >
                    <FiUpload className="mr-2" /> Fichier
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file || !file.type.startsWith("image/")) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = () => {
                      const maxWidth = 200;
                      const scale = maxWidth / img.width;
                      const width = maxWidth;
                      const height = img.height * scale;
                      const screenCenterX = window.innerWidth / 2;
                      const screenCenterY = window.innerHeight / 2;

                      addImage({
                        url: reader.result,
                        x: screenCenterX - offsetX - width / 2,
                        y: screenCenterY - offsetY - height / 2,
                        width,
                        height,
                        originalWidth: img.width,
                        originalHeight: img.height,
                      });
                      setAddMenuOpen(false);
                    };
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
