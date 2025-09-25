// types/index.ts
export interface CommonData {
  object_name_en?: string;
  object_category?: string;
  tags?: string[];
  field_of_study?: string;
  age_appropriate?: string;
  image_status?: string;
  object_id?: string;
  image_base64?: string;
  flag_object?: boolean;
}

export interface LanguageResult {
  object_name: string;
  object_description: string;
  object_hint: string;
  object_short_hint: string;
  translation_status?: string;
  translation_id?: string;
  isLoading?: boolean;
  error?: string; 
  flag_translation?: boolean;
}

export interface ImageMetadata {
  object_name_en: string;
  object_category: string;
  tags: string[];
  field_of_study?: string;
  age_appropriate?: string;
  image_status?: string;
  object_id: string;
  flag_object: boolean;
}

export interface FileInfo {
  filename: string;
  size: string;
  mimeType: string;
  dimensions: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

// Updated UserContext to match permissions.ts
export interface UserContext {
  access_token: string;
  token_type?: string;
  username: string;
  roles: string[];
  permissions: string[];
  languages_allowed: string[];
  permission_rules: PermissionRulesDict;
}

// Permission interfaces from permissions.ts
export interface PermissionRuleSimple {
  metadata: (string | null)[];
  language: (string | null)[];
}

export type PermissionRulesDict = Record<string, PermissionRuleSimple>;

export interface RecentTranslation {
  object: {
    thumbnail: string;
    image_base64: string;
    image_hash: string;
  };
  translation: {
    requested_language: string;
    translation_status: string;
  };
  file_info: {
    filename: string;
    size: string;
    mime_type: string;
    dimensions: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
  };
}

export type SaveStatus = 'unsaved' | 'saved';
export type CheckType = "metadata" | "language";

export interface PermissionCheck {
  metadata: boolean;
  language: boolean;
}