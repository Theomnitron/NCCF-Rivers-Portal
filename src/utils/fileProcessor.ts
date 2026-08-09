/**
 * Client-Side File Processing Engine
 * Downscales/compresses image payloads on canvas before storing in state.
 * Formats file sizes for display.
 */

export interface ProcessedFileResult {
  fileName: string;
  fileType: 'image';
  originalSizeText: string;
  processedSizeText: string;
  dataUrl: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export interface ProcessFileOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  skipCompression?: boolean;
}

export async function processClientSideFile(
  file: File,
  optionsOrWidth?: ProcessFileOptions | number,
  paramMaxHeight = 1200,
  paramQuality = 0.8
): Promise<ProcessedFileResult> {
  let maxWidth = 1200;
  let maxHeight = paramMaxHeight;
  let quality = paramQuality;
  let skipCompression = false;

  if (typeof optionsOrWidth === 'object' && optionsOrWidth !== null) {
    if (optionsOrWidth.maxWidth !== undefined) maxWidth = optionsOrWidth.maxWidth;
    if (optionsOrWidth.maxHeight !== undefined) maxHeight = optionsOrWidth.maxHeight;
    if (optionsOrWidth.quality !== undefined) quality = optionsOrWidth.quality;
    if (optionsOrWidth.skipCompression !== undefined) skipCompression = optionsOrWidth.skipCompression;
  } else if (typeof optionsOrWidth === 'number') {
    maxWidth = optionsOrWidth;
  }

  const originalSizeText = formatBytes(file.size);

  // Direct raw payload reading if compression is explicitly skipped (e.g., bank receipt images)
  if (skipCompression) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        resolve({
          fileName: file.name,
          fileType: 'image',
          originalSizeText,
          processedSizeText: originalSizeText,
          dataUrl,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Check if Image
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Downscale proportionally if needed
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({
              fileName: file.name,
              fileType: 'image',
              originalSizeText,
              processedSizeText: originalSizeText,
              dataUrl: event.target?.result as string,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Calculate compressed size approximately
          const head = 'data:image/jpeg;base64,';
          const base64Length = compressedDataUrl.length - head.length;
          const compressedBytes = Math.round((base64Length * 3) / 4);
          const processedSizeText = formatBytes(compressedBytes);

          resolve({
            fileName: file.name,
            fileType: 'image',
            originalSizeText,
            processedSizeText,
            dataUrl: compressedDataUrl,
          });
        };

        img.onerror = () => {
          resolve({
            fileName: file.name,
            fileType: 'image',
            originalSizeText,
            processedSizeText: originalSizeText,
            dataUrl: event.target?.result as string,
          });
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Fallback for other file types
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       resolve({
//         fileName: file.name,
//         fileType: 'other',
//         originalSizeText,
//         processedSizeText: originalSizeText,
//         dataUrl: reader.result as string,
//       });
//     };
//     reader.onerror = (err) => reject(err);
//     reader.readAsDataURL(file);
//   });
}
