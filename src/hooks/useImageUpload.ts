// hooks/useImageUpload.ts
import { useState, useCallback, useRef } from 'react';
import { isValidFileType, base64ToFile, resizeImage } from '../utils/imageUtils';
import { UI_MESSAGES } from '../utils/constants';

export const useImageUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [isThumbnailUpdate, setIsThumbnailUpdate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = useCallback(async (selectedFile: File) => {
    if (!isValidFileType(selectedFile)) {
      setError(UI_MESSAGES.ERRORS.INVALID_FILE_TYPE);
      return;
    }
    
    setError(null);
    
    try {
      // Resize the image
      const resizedFile = await resizeImage(selectedFile);
      setFile(resizedFile);
      
      // Create preview URL
      const url = URL.createObjectURL(resizedFile);
      setPreviewUrl(url);
      
      // Clear previous image hash
      setImageHash(null);
      
    } catch (err) {
      setError('Failed to process image');
      console.error('Image processing error:', err);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  }, [handleFileChange]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleThumbnailFile = useCallback(async (base64: string, filename: string) => {
    try {
      const newFile = base64ToFile(base64, filename);
      
      // Simulate manual file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(newFile);
        fileInputRef.current.files = dataTransfer.files;
        
        // Dispatch change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
      
      // Set file and preview
      setFile(newFile);
      setPreviewUrl(URL.createObjectURL(newFile));
      setIsThumbnailUpdate(true);
      
      return newFile;
    } catch (err) {
      setError('Failed to process thumbnail image');
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetUpload = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setImageHash(null);
    setIsThumbnailUpdate(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    file,
    previewUrl,
    error,
    imageHash,
    isThumbnailUpdate,
    fileInputRef,
    setFile,
    setPreviewUrl,
    setError,
    setImageHash,
    setIsThumbnailUpdate,
    handleFileChange,
    handleDrop,
    handleClick,
    handleThumbnailFile,
    clearError,
    resetUpload
  };
};