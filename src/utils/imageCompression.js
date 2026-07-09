import { getScaledDimensions } from "./imageDimensions";

export async function compressImageDataUrl(
  sourceUrl,
  displayWidth = 200,
  maxStoredWidth = 900,
  quality = 0.96,
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;
      const storedWidth = Math.min(naturalWidth, maxStoredWidth);
      const storedHeight = Math.round(
        (naturalHeight * storedWidth) / naturalWidth,
      );

      const canvas = document.createElement("canvas");
      canvas.width = storedWidth;
      canvas.height = storedHeight;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, storedWidth, storedHeight);

      let compressedUrl;
      try {
        compressedUrl = canvas.toDataURL("image/webp", quality);
        if (!compressedUrl.startsWith("data:image/webp")) {
          compressedUrl = canvas.toDataURL("image/jpeg", quality);
        }
      } catch {
        compressedUrl = canvas.toDataURL("image/jpeg", quality);
      }

      const displayDimensions = getScaledDimensions(
        naturalWidth,
        naturalHeight,
        displayWidth,
      );

      resolve({
        url: compressedUrl,
        ...displayDimensions,
      });
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
}
