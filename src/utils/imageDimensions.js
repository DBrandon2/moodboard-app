export const DEFAULT_DISPLAY_MAX_WIDTH = 200;

export function getScaledDimensions(
  naturalWidth,
  naturalHeight,
  maxWidth = DEFAULT_DISPLAY_MAX_WIDTH,
) {
  if (!naturalWidth || !naturalHeight) {
    return {
      width: maxWidth,
      height: maxWidth,
      originalWidth: naturalWidth || maxWidth,
      originalHeight: naturalHeight || maxWidth,
    };
  }

  const scale = naturalWidth > maxWidth ? maxWidth / naturalWidth : 1;

  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
    originalWidth: naturalWidth,
    originalHeight: naturalHeight,
  };
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function getDimensionsFromImageSource(
  src,
  maxWidth = DEFAULT_DISPLAY_MAX_WIDTH,
) {
  const img = await loadImageElement(src);
  return getScaledDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxWidth,
  );
}
