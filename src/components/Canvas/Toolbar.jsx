import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEY, useBoardStore } from "../../store/boardStore";
import { compressImageDataUrl } from "../../utils/imageCompression";
import { getDimensionsFromImageSource } from "../../utils/imageDimensions";
import { canAddImage, getStorageInfo } from "../../utils/storageCheck";
import {
  FiCompass,
  FiPlus,
  FiLink,
  FiUpload,
  FiTrash2,
  FiDownload,
  FiUploadCloud,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

export default function Toolbar({
  onRecenter,
  offsetX = 0,
  offsetY = 0,
  canvasScale = 1,
  isMobile: isMobileFromProps = null,
}) {
  const [url, setUrl] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [isMobileLocal, setIsMobileLocal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [storageFullAlert, setStorageFullAlert] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const addImage = useBoardStore((state) => state.addImage);
  const clearStorage = useBoardStore((state) => state.clearStorage);
  const loadFromImport = useBoardStore((state) => state.loadFromImport);
  const images = useBoardStore((state) => state.images);
  const storageInfo = getStorageInfo();

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

  const handleAddImage = async () => {
    if (!url) return;

    try {
      const dimensions = await getDimensionsFromImageSource(url);
      const centerX = (window.innerWidth / 2 - offsetX) / canvasScale;
      const centerY = (window.innerHeight / 2 - offsetY) / canvasScale;

      if (!canAddImage(url)) {
        setStorageFullAlert(true);
        return;
      }

      addImage({
        url,
        x: centerX - dimensions.width / 2,
        y: centerY - dimensions.height / 2,
        width: dimensions.width,
        height: dimensions.height,
        originalWidth: dimensions.originalWidth,
        originalHeight: dimensions.originalHeight,
      });
      setUrl("");
      setAddMenuOpen(false);
    } catch (error) {
      console.error("Impossible de charger l'image depuis l'URL :", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddImage();
  };

  const handleClearStorage = () => {
    clearStorage();
    setShowClearConfirm(false);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
  };

  const toolbarButtonClasses =
    "text-white text-2xl sm:text-3xl rounded-2xl p-3 border border-white/10 bg-white/10 transition-all duration-200 ease-in-out hover:bg-white/15 hover:border-white/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";

  const dangerButtonClasses =
    "text-white text-2xl sm:text-3xl rounded-2xl p-3 border border-white/10 bg-white/10 transition-all duration-200 ease-in-out hover:bg-red-500/20 hover:border-red-500/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";

  const toolbarBgClass = "bg-slate-950/35";

  const handleDownloadData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
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

  const isToolbarExpanded = !toolbarCollapsed;
  const toggleToolbar = (e) => {
    e.stopPropagation();
    setToolbarCollapsed((prev) => !prev);
  };

  return (
    <>
      <div
        className={`toolbar fixed z-50 pointer-events-none ${isMobile ? "inset-x-0 bottom-0 flex flex-col items-center" : "top-1/2 left-0 -translate-y-1/2 flex items-center"}`}
      >
        {!isMobile && (
          <div className="pointer-events-auto flex items-center transition-all duration-300 ease-out">
            <div
              className={`relative z-20 flex overflow-hidden transition-all duration-300 ease-out ${isToolbarExpanded ? "w-24 opacity-100 translate-x-0 py-4 h-[70vh]" : "w-0 opacity-0 -translate-x-2 py-0 h-0"}`}
            >
              <div
                className={`${toolbarBgClass} border border-white/10 backdrop-blur-3xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] transition-all duration-300 h-full w-full ${isToolbarExpanded ? "rounded-r-[2rem] rounded-l-none" : "rounded-[2rem]"}`}
              >
                <div
                  className={`flex flex-col gap-8 w-full h-full items-center justify-center transition-opacity duration-200 ${isToolbarExpanded ? "opacity-100" : "opacity-0"}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecenter();
                    }}
                    className={toolbarButtonClasses}
                    title="Recentrer"
                  >
                    <FiCompass />
                  </button>

                  <button
                    onClick={handleAddMenuToggle}
                    className={toolbarButtonClasses}
                    title="Ajouter une image"
                  >
                    <FiPlus />
                  </button>

                  <button
                    onClick={handleDownloadData}
                    className={toolbarButtonClasses}
                    title="Télécharger la sauvegarde"
                  >
                    <FiDownload />
                  </button>

                  <button
                    onClick={() => setShowStorageInfo(true)}
                    className={toolbarButtonClasses}
                    title="Voir l'état du stockage"
                  >
                    <FiInfo />
                  </button>

                  <button
                    onClick={() => importInputRef.current?.click()}
                    className={toolbarButtonClasses}
                    title="Importer une sauvegarde"
                  >
                    <FiUploadCloud />
                  </button>

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className={dangerButtonClasses}
                    title="Effacer le moodboard"
                    disabled={images.length === 0}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={toggleToolbar}
              className={`pointer-events-auto relative z-0 flex h-14 w-14 items-center justify-center  ${isToolbarExpanded ? "-ml-3 rounded-r-[2rem]" : "rounded-full"} ${toolbarBgClass} backdrop-blur-3xl text-white shadow-sm shadow-slate-950/20 transition duration-200 hover:ring-2 hover:ring-white/20`}
              title={toolbarCollapsed ? "Ouvrir la barre" : "Fermer la barre"}
            >
              {toolbarCollapsed ? (
                <FiChevronRight className="text-xl" />
              ) : (
                <FiChevronLeft className="text-xl" />
              )}
            </button>
          </div>
        )}

        {isMobile && (
          <div className="pointer-events-auto flex flex-col items-center w-full max-w-full transition-all duration-300 ease-out">
            <button
              onClick={toggleToolbar}
              className={`relative z-0 flex h-14 w-14 items-center justify-center ${isToolbarExpanded ? "rounded-t-[2rem]" : "rounded-full"} ${toolbarBgClass} backdrop-blur-3xl text-white shadow-sm shadow-slate-950/20 transition duration-200 hover:ring-2 hover:ring-white/20`}
              title={toolbarCollapsed ? "Ouvrir la barre" : "Fermer la barre"}
            >
              {toolbarCollapsed ? (
                <FiChevronUp className="text-xl" />
              ) : (
                <FiChevronDown className="text-xl" />
              )}
            </button>

            <div
              className={`relative z-20 w-full overflow-hidden transition-all duration-300 ease-out ${isToolbarExpanded ? "h-auto -mt-2" : "h-0"}`}
            >
              <div
                className={`${toolbarBgClass} border border-white/10 backdrop-blur-3xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] flex flex-row justify-around gap-2 w-full transition-opacity duration-200 ${isToolbarExpanded ? "opacity-100 py-4 " : "opacity-0 py-0 rounded-[2rem]"}`}
                aria-hidden={!isToolbarExpanded}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecenter();
                  }}
                  className={toolbarButtonClasses}
                  title="Recentrer"
                >
                  <FiCompass />
                </button>

                <button
                  onClick={handleAddMenuToggle}
                  className={toolbarButtonClasses}
                  title="Ajouter une image"
                >
                  <FiPlus />
                </button>

                <button
                  onClick={handleDownloadData}
                  className={toolbarButtonClasses}
                  title="Télécharger la sauvegarde"
                >
                  <FiDownload />
                </button>

                <button
                  onClick={() => setShowStorageInfo(true)}
                  className={toolbarButtonClasses}
                  title="Voir l'état du stockage"
                >
                  <FiInfo />
                </button>

                <button
                  onClick={() => importInputRef.current?.click()}
                  className={toolbarButtonClasses}
                  title="Importer une sauvegarde"
                >
                  <FiUploadCloud />
                </button>

                <button
                  onClick={() => setShowClearConfirm(true)}
                  className={dangerButtonClasses}
                  title="Effacer le moodboard"
                  disabled={images.length === 0}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portals pour les modals (en dehors de la Toolbar) */}
      {/* Modal de confirmation */}
      {showClearConfirm &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="rounded-2xl p-6 xs:p-8 w-full max-w-sm shadow-2xl animate-slideUp bg-slate-950/70 backdrop-blur-sm border border-white/10">
                <h3 className="text-white text-lg xs:text-xl font-semibold mb-3 xs:mb-4">
                  Êtes-vous sûr ?
                </h3>
                <p className="text-blue-100 mb-6 text-base xs:text-lg leading-relaxed">
                  Cette action supprimera toutes les images et la session sera
                  réinitialisée.
                </p>
                <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 xs:justify-end">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 xs:px-6 py-3 xs:py-4 text-white rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all 
                      font-medium text-base xs:text-lg min-h-[44px] xs:min-h-[48px] w-full xs:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleClearStorage}
                    className="px-4 xs:px-6 py-3 xs:py-4 bg-red-500/30 border border-red-500/50 text-red-100 rounded-lg 
                      hover:bg-red-500/40 transition-all font-semibold text-base xs:text-lg min-h-[44px] xs:min-h-[48px] w-full xs:w-auto"
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
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setAddMenuOpen(false)}
            />

            {/* Modal/Drawer - Responsive positioning */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed z-50 rounded-2xl shadow-2xl bg-slate-950/90 backdrop-blur-lg border border-white/10 transition-all duration-300 transform origin-center top-4 left-2 right-2 max-h-[calc(100vh-4rem)] md:left-[calc(4rem+0.5rem)] md:right-2 xl:top-1/2 xl:left-[calc(4rem+0.5rem)] xl:right-2 xl:translate-x-0 xl:-translate-y-1/2 xl:w-96 xl:max-h-96 animated-menu"
              style={{
                animation: "menu-appear 0.18s ease-out forwards",
              }}
            >
              {/* Contenu du modal */}
              <div className="flex flex-col h-full p-5 xs:p-7 overflow-y-auto">
                <p className="text-white font-semibold mb-5 text-lg xs:text-xl flex-shrink-0">
                  Ajouter une image
                </p>

                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  type="text"
                  placeholder="https://..."
                  className="px-4 py-3 xs:py-4 rounded-lg text-white placeholder-blue-200/50 border border-blue-400/30 
                    w-full mb-5 text-base xs:text-lg min-h-[44px] 
                    bg-blue-500/10 backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 flex-shrink-0
                    transition-all"
                />

                <div className="flex flex-row gap-3 xs:gap-4 mt-auto flex-shrink-0">
                  <button
                    onClick={handleAddImage}
                    className="flex-1 flex items-center justify-center px-4 py-4 xs:py-5 bg-sky-500/10 border border-sky-500/20 text-white rounded-lg 
                      hover:bg-sky-400/20 active:bg-sky-400/30 transition-all font-medium touch-none
                      text-base xs:text-lg min-h-[44px] xs:min-h-[48px]"
                  >
                    <FiLink className="mr-2" /> URL
                  </button>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="flex-1 flex items-center justify-center px-4 py-4 xs:py-5 bg-sky-500/10 border border-sky-500/20 text-white rounded-lg 
                      hover:bg-sky-400/20 active:bg-sky-400/30 transition-all font-medium touch-none
                      text-base xs:text-lg min-h-[44px] xs:min-h-[48px]"
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
                  reader.onload = async () => {
                    try {
                      const compressed = await compressImageDataUrl(
                        reader.result,
                      );
                      const centerX =
                        (window.innerWidth / 2 - offsetX) / canvasScale;
                      const centerY =
                        (window.innerHeight / 2 - offsetY) / canvasScale;

                      if (!canAddImage(compressed.url)) {
                        setStorageFullAlert(true);
                        return;
                      }

                      addImage({
                        url: compressed.url,
                        x: centerX - compressed.width / 2,
                        y: centerY - compressed.height / 2,
                        width: compressed.width,
                        height: compressed.height,
                        originalWidth: compressed.originalWidth,
                        originalHeight: compressed.originalHeight,
                      });
                      setAddMenuOpen(false);
                    } catch (error) {
                      console.error(
                        "Échec de la compression de l'image importée :",
                        error,
                      );
                    }
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </div>
          </>,
          document.body,
        )}

      {/* Input hidden pour importer une sauvegarde */}
      <input
        type="file"
        ref={importInputRef}
        className="hidden"
        accept=".json"
        onChange={handleImportFile}
      />

      {/* Popup d'alerte - Stockage plein */}
      {storageFullAlert &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[4000]"
              onClick={() => setStorageFullAlert(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[4001] bg-slate-950 border border-red-500/30 rounded-2xl p-6 shadow-2xl max-w-md">
              <h2 className="text-xl font-bold text-white mb-3">
                Stockage plein ⚠️
              </h2>
              <p className="text-gray-300 mb-6">
                Vous avez atteint la limite de stockage. Impossible d'ajouter
                plus d'images.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                💡 Conseil: Supprimez des images ou videz le moodboard pour
                libérer de l'espace.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStorageFullAlert(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Modal d'information sur le stockage */}
      {showStorageInfo &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowStorageInfo(false)}
            />
            <div className="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-slate-950/95 border border-white/10 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Statut du stockage
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Poids utilisé et quota maximal du moodboard.
                  </p>
                </div>
                <button
                  className="text-slate-300 text-xl hover:text-white"
                  onClick={() => setShowStorageInfo(false)}
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/10">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Utilisé</span>
                    <span>{formatBytes(storageInfo.used)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${Math.min(storageInfo.percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/10">
                    <div className="text-slate-400">Quota max</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {formatBytes(5 * 1024 * 1024)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/10">
                    <div className="text-slate-400">Pourcentage</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {storageInfo.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {storageInfo.nearQuota && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Vous êtes proche du quota. Supprimez des images si
                    nécessaire.
                  </div>
                )}
                {storageInfo.quotaExceeded && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                    Le quota est dépassé, certaines actions peuvent échouer.
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
