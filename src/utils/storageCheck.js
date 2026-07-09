const STORAGE_QUOTA = 5 * 1024 * 1024; // 5MB quota typique
const WARNING_THRESHOLD = 0.9; // Alerte à 90%

export function getStorageSize() {
  const data = localStorage.getItem("moodboard_state");
  return data ? new Blob([data]).size : 0;
}

export function estimateAddedSize(newImageDataUrl) {
  // Estimer la taille en ajoutant ~100 bytes pour les métadonnées
  return new Blob([newImageDataUrl]).size + 100;
}

export function canAddImage(newImageDataUrl) {
  const currentSize = getStorageSize();
  const addedSize = estimateAddedSize(newImageDataUrl);
  const totalSize = currentSize + addedSize;

  return totalSize < STORAGE_QUOTA;
}

export function getStoragePercentage() {
  const currentSize = getStorageSize();
  return (currentSize / STORAGE_QUOTA) * 100;
}

export function isNearQuota() {
  return getStoragePercentage() >= WARNING_THRESHOLD * 100;
}

export function getStorageInfo() {
  const used = getStorageSize();
  const percentage = getStoragePercentage();
  const remaining = Math.max(0, STORAGE_QUOTA - used);

  return {
    used,
    remaining,
    percentage,
    quotaExceeded: percentage >= 100,
    nearQuota: percentage >= WARNING_THRESHOLD * 100,
  };
}
