import { supabase } from '../lib/supabase';

/**
 * Converts a base64 Data URL string to a standard Blob object for upload
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1] || parts[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('[Storage Utils] Failed to convert dataUrl to Blob:', err);
    return new Blob([], { type: 'image/png' });
  }
}

export interface UploadResult {
  publicUrl: string;
  filePath: string;
  success: boolean;
}

/**
 * Uploads media files (proof of payment receipts or supporting travel letters)
 * directly to Supabase Private Storage (`receipts` or `letters` bucket).
 * 
 * Returns the permanent public storage URL/path.
 */
export async function uploadFileToStorage(
  fileOrDataUrl: File | Blob | string,
  bucket: 'receipts' | 'letters' | 'travel_letters' | 'avatars' | 'announcements' | 'flyers',
  customFileName?: string
): Promise<UploadResult> {
  const targetBucket = (bucket === 'travel_letters' ? 'letters' : bucket === 'announcements' ? 'flyers' : bucket) as 'receipts' | 'letters' | 'avatars' | 'flyers';
  try {
    // If it's already an HTTP URL (e.g. Unsplash or external host), return as is
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
      return {
        publicUrl: fileOrDataUrl,
        filePath: fileOrDataUrl,
        success: true,
      };
    }

    let blobPayload: Blob;
    let fileExt = 'jpg';

    if (fileOrDataUrl instanceof File) {
      blobPayload = fileOrDataUrl;
      fileExt = fileOrDataUrl.name.split('.').pop() || 'png';
    } else if (fileOrDataUrl instanceof Blob) {
      blobPayload = fileOrDataUrl;
      fileExt = fileOrDataUrl.type.split('/')[1] || 'jpg';
    } else if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      blobPayload = dataUrlToBlob(fileOrDataUrl);
      const mimeMatch = fileOrDataUrl.match(/data:(.*?);/);
      fileExt = mimeMatch ? mimeMatch[1].split('/')[1] || 'jpg' : 'jpg';
    } else {
      // Fallback
      blobPayload = new Blob([fileOrDataUrl as any], { type: 'text/plain' });
    }

    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const fileName = customFileName || `${uniqueId}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    let { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, blobPayload, {
        cacheControl: '3600',
        upsert: true,
      });

    let effectiveBucket = targetBucket;

    if (error && targetBucket === 'avatars') {
      console.warn(`[Supabase Storage] Notice uploading to 'avatars' bucket (${error.message}). Trying fallback to 'receipts' bucket.`);
      const fbResult = await supabase.storage
        .from('receipts')
        .upload(filePath, blobPayload, {
          cacheControl: '3600',
          upsert: true,
        });
      if (!fbResult.error) {
        data = fbResult.data;
        error = null;
        effectiveBucket = 'receipts';
      }
    }

    if (error) {
      console.warn(`[Supabase Storage] Notice uploading to '${targetBucket}' bucket: ${error.message}. Using fallback payload storage.`);
      // Return dataUrl or temporary fallback if bucket is missing or restricted
      const fallbackUrl = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : (fileOrDataUrl instanceof File ? URL.createObjectURL(fileOrDataUrl) : '');
      return {
        publicUrl: fallbackUrl,
        filePath,
        success: false,
      };
    }

    const { data: urlData } = supabase.storage
      .from(effectiveBucket)
      .getPublicUrl(data?.path || filePath);

    const publicUrl = urlData?.publicUrl || filePath;

    return {
      publicUrl,
      filePath: data?.path || filePath,
      success: true,
    };
  } catch (err) {
    console.error(`[Supabase Storage] Exception during upload to bucket '${targetBucket}':`, err);
    const fallbackUrl = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
    return {
      publicUrl: fallbackUrl,
      filePath: customFileName || 'fallback_path',
      success: false,
    };
  }
}
