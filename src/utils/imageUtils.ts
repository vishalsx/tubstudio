// utils/imageUtils.ts
import { VALID_IMAGE_TYPES } from './constants';

export const isValidFileType = (file: File): boolean => {
  return VALID_IMAGE_TYPES.includes(file.type);
};

export const base64ToFile = (base64: string, filename: string): File => {
  // Remove data URI prefix if present
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteString = atob(cleanBase64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  // Get file extension and determine MIME type
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpeg';
  
  // Handle the jpg exception, otherwise use image/extension format
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  return new File([arrayBuffer], filename, { type: mimeType });
};

export const resizeImage = (file: File, maxWidth: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          }
        }, file.type);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
};

export const getImageDimensions = (base64: string, extension: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/${extension};base64,${base64}`;
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};