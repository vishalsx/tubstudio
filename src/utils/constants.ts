// utils/constants.ts
// FIX: Cast import.meta to any to access Vite env variables without the `vite/client` type definitions.
export const API_URL = ((import.meta as any).env && (import.meta as any).env.VITE_FASTAPI_URL) || 'http://localhost:8000/';
export const GAME_BASE_URL = ((import.meta as any).env && (import.meta as any).env.VITE_GAME_BASE_URL) || 'http://localhost:3000';

export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff'
];

export const FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
  '.webp',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif'
];

export const PERMISSION_TYPES = {
  METADATA: 0,
  LANGUAGE: 1
} as const;

export const SAVE_STATUSES = {
  SAVED: 'saved' as const,
  UNSAVED: 'unsaved' as const
};

export const UI_MESSAGES = {
  ERRORS: {
    NO_FILE: 'Please upload an image first.',
    INVALID_FILE_TYPE: 'Unsupported file type. Please upload a valid image (jpg, jpeg, png, heic, heif, webp, gif, bmp, tiff).',
    NO_LANGUAGES: 'Please select at least one language.',
    UPLOAD_FAILED: 'Failed to upload image.',
    SAVE_FAILED: 'Failed to save to database',
    LOGIN_FAILED: 'Login failed',
    WORKLIST_EMPTY: 'Relax! Your worklist is empty',
    NO_WORKLIST_DATA: 'No worklist data found for',
    INAPPROPRIATE_CONTENT: 'Inappropriate content. Redirecting..',
    SOMETHING_WRONG: 'Oops! Something fell apart!'
  },
  SUCCESS: {
    DATA_SAVED: 'data saved successfully!',
    MIGRATION_COMPLETED: 'Migration completed!'
  },
  LOADING: {
    PROCESSING: 'Processing...',
    LOADING_PROPERTIES: 'Loading Image Properties...',
    LOADING_TRANSLATION: 'Loading translation...'
  }
};

export const DEFAULT_COMMON_DATA = {
  object_name_en: "",
  object_name: "",
  object_category: "",
  tags: [],
  field_of_study: "",
  age_appropriate: "",
  image_status: "",
  object_id: "",
  image_base64: "",
  flag_object: false
};

export const DEFAULT_FILE_INFO = {
  filename: '',
  size: '',
  mimeType: '',
  dimensions: '',
  created_by: '',
  created_at: '',
  updated_by: '',
  updated_at: '',
};