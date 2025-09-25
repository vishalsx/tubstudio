// services/translation.service.ts
import { apiClient } from './api';
import { LanguageResult, CommonData } from '../types';

export class TranslationService {
  async identifyObject(file: File, language: string, imageHash?: string | null): Promise<any> {
    const formData = new FormData();
    
    if (imageHash) {
      formData.append("image_hash", imageHash);
    } else if (file) {
      formData.append("image", file);
    } else {
      throw new Error("Please provide either an image file or an image hash.");
    }
    
    formData.append("language", language);
    return apiClient.post('identify/object', formData);
  }

  async saveToDatabase(
    commonAttributes: any, 
    languageAttributes: any[], 
    action: string, 
    file?: File
  ): Promise<any> {
    const formData = new FormData();
    
    if (file) {
      formData.append("image", file);
    }
    
    formData.append("common_attributes", JSON.stringify(commonAttributes));
    formData.append("language_attributes", JSON.stringify(languageAttributes));
    formData.append("permission_action", action);
    
    return apiClient.post('update/object', formData);
  }

  async getTranslationById(translationId: string): Promise<any> {
    return apiClient.get(`translations/${translationId}`);
  }

  async skipToUnlock(translationId: string): Promise<any> {
    return apiClient.put('translations/skipToUnlock', { translation_id: translationId });
  }

  async fetchWorklist(languages: string[]): Promise<any> {
    return apiClient.get(`worklist/queue?languages=${languages.join(",")}`);
  }

  async fetchThumbnails(username: string): Promise<any> {
    const formData = new FormData();
    formData.append("username", username);
    return apiClient.post('thumbnail', formData);
  }
}

export const translationService = new TranslationService();