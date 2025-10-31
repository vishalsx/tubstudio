// src/components/common/ImageSearchModal.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, StarIcon, PlusCircleIcon, CheckIcon } from '@heroicons/react/24/solid';
import { DatabaseImage } from '../../types';
import { translationService } from '../../services/translation.service';
import { formatFileSize } from '../../utils/imageUtils';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (image: DatabaseImage) => void;
  language: string;
  onAddNewImage: (searchQuery: string) => void;
  existingImageHashes: string[];
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onImageSelect, 
  language, 
  onAddNewImage,
  existingImageHashes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DatabaseImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  
  const [addedHashes, setAddedHashes] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ hash: string; message: string } | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAddedHashes(new Set(existingImageHashes));
    } else {
      // Reset position when modal is closed
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, existingImageHashes]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const showNotification = (hash: string, message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ hash, message });
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 1500);
  };
  
  const handleImageClick = (image: DatabaseImage) => {
    const hash = image.object.image_hash;
    if (addedHashes.has(hash)) {
      showNotification(hash, 'Already added!');
      return;
    }

    onImageSelect(image);
    setAddedHashes(prev => new Set(prev).add(hash));
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartOffset.current.x,
        y: e.clientY - dragStartOffset.current.y
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = ''; // Re-enable text selection
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const processPoolImagesResponse = (data: any[]) => {
    if (!data || data.length === 0) {
      setSearchResults([]);
      return;
    }
    const formattedImages: DatabaseImage[] = data.map((item: any) => ({
      object: {
        thumbnail: item.poolImage.thumbnail_base64,
        image_base64: item.poolImage.image_base64,
        image_hash: item.poolImage.image_hash,
      },
      file_info: {
        filename: item.file_info.file_name,
        size: formatFileSize(item.file_info.file_size),
        mimeType: item.file_info.mime_type,
        created_at: item.file_info.created_at,
        updated_at: item.file_info.updated_at,
        dimensions: '', created_by: '', updated_by: '',
      },
      common_data: {
        object_name_en: item.poolImage.object_name_en,
        object_category: "", tags: [], field_of_study: "", age_appropriate: "",
        image_status: "", object_id: item.poolImage.object_id || "",
        image_base64: "", flag_object: false
      },
      popularity_stars: item.poolImage.popularity_stars,
      total_vote_count: item.poolImage.total_vote_count,
    }));
    setSearchResults(formattedImages);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchAttempted(false);
      return;
    }
    setError(null);
    setIsLoading(true);
    setSearchAttempted(true);
    try {
      const data = await translationService.fetchPopularImages(searchQuery, language);
      processPoolImagesResponse(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch images.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, language]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        onClick={e => e.stopPropagation()}
      >
        <div
          onMouseDown={handleMouseDown}
          className="p-4 border-b flex justify-between items-center flex-shrink-0 cursor-move"
        >
          <h2 className="text-lg font-semibold">Search for an Image</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="p-4 flex items-center gap-2 border-b flex-shrink-0">
          <input
            type="text"
            placeholder="Search by object name, category, etc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-[#00AEEF] focus:border-[#00AEEF]"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-[#00AEEF] text-white rounded-lg hover:bg-[#0096CC] transition flex items-center justify-center text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="text-red-500 text-center">{error}</p>}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {searchResults.map((image) => {
                const isAdded = addedHashes.has(image.object.image_hash);
                const showNotif = notification?.hash === image.object.image_hash;
                return (
                  <div
                    key={image.object.image_hash || image.common_data.object_id}
                    className={`relative group rounded-xl overflow-hidden shadow-md h-24 transition-opacity ${isAdded ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => handleImageClick(image)}
                    title={image.common_data.object_name_en || image.file_info.filename}
                  >
                    <img
                      src={`data:image/jpeg;base64,${image.object.thumbnail}`}
                      alt={image.common_data.object_name_en || ''}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                      <p className="text-white font-bold text-xs text-center truncate">
                        {image.common_data.object_name_en || 'Untitled'}
                      </p>
                    </div>
                    {(image.popularity_stars !== undefined && image.total_vote_count !== undefined) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                        <div className="flex items-center text-white"><StarIcon className="w-5 h-5 text-yellow-400" /><span className="ml-1 font-bold">{typeof image.popularity_stars === 'number' ? image.popularity_stars.toFixed(1) : ''}</span></div>
                        <span className="text-xs text-gray-200 mt-1">{image.total_vote_count} votes</span>
                      </div>
                    )}
                    {isAdded && !showNotif && (
                      <div className="absolute inset-0 bg-green-800 bg-opacity-60 flex items-center justify-center pointer-events-none">
                        <span className="text-white font-bold text-sm flex items-center">
                          <CheckIcon className="w-4 h-4 mr-1" /> Added
                        </span>
                      </div>
                    )}
                    {showNotif && (
                      <div className="absolute inset-0 bg-orange-600 bg-opacity-80 flex items-center justify-center pointer-events-none transition-all duration-200">
                        <span className="text-white font-bold text-sm">
                          {notification?.message}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 italic">
              {isLoading ? 'Searching...' : searchAttempted ? 'No images found.' : 'Enter a search term and click the search button.'}
            </div>
          )}
        </div>
        
        {searchAttempted && !isLoading && searchQuery.trim() && (
          <div className="p-3 mt-auto border-t bg-gray-50 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Can't find what you're looking for?</p>
              <button
                onClick={() => onAddNewImage(searchQuery)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add New Image Named "{searchQuery}"
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
