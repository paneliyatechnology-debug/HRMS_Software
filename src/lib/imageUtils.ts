/**
 * Client-side utility for image processing and compression
 */

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (PNG, JPG, JPEG, WEBP, or GIF).',
    };
  }

  // Max 10MB input check
  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Image size should be less than 10MB.',
    };
  }

  return { valid: true };
}

/**
 * Returns a crisp high-DPR Cloudinary avatar URL when applicable so tiny circles
 * do not suffer from heavy browser downscaling artifacts.
 */
export function getSharpAvatarUrl(url?: string, size = 160): string {
  const clean = (url || '').trim();
  if (!clean) return '';
  const uploadMarker = '/image/upload/';
  if (clean.includes('res.cloudinary.com') && clean.includes(uploadMarker)) {
    const idx = clean.indexOf(uploadMarker) + uploadMarker.length;
    const afterUpload = clean.slice(idx);
    // Only inject transform if not already transformed (next segment is version v123... or public_id)
    if (/^v\d+\//.test(afterUpload) || !afterUpload.includes(',')) {
      return `${clean.slice(0, idx)}c_fill,g_face,w_${size},h_${size},dpr_2.0,q_auto:best,f_auto/${afterUpload}`;
    }
  }
  return clean;
}

/**
 * Resizes and compresses an image file to a lightweight Base64 data URL
 * Perfect for avatars and profile pictures stored in local storage and databases.
 */
export function compressImage(
  file: File,
  maxWidth = 720,
  maxHeight = 720,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image smoothly with high quality resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG or WebP data URL
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(event.target?.result as string);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.readAsDataURL(file);
  });
}
