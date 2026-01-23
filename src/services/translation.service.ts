// services/translation.service.ts
import { apiClient } from './api';
import { LanguageResult, CommonData } from '../types';

export class TranslationService {
  // async identifyObject(file: File, language: string, imageHash?: string | null): Promise<any> {
  async identifyObject(file: File, language: string, imageHash?: string | null, signal?: AbortSignal, additionalContext?: string): Promise<any> {

    const formData = new FormData();

    if (imageHash) {
      formData.append("image_hash", imageHash);
    } else if (file) {
      formData.append("image", file);
    } else {
      throw new Error("Please provide either an image file or an image hash.");
    }

    formData.append("language", language);
    if (additionalContext) {
      formData.append("additional_context", additionalContext);
    }
    console.log("Identify Object Request:", formData);
    return apiClient.post('identify/object', formData, { signal });
  }

  async saveToDatabase(
    commonAttributes: any,
    languageAttributes: any[],
    action: string,
    file?: File,
    imageHash?: string | null
  ): Promise<any> {
    const formData = new FormData();

    if (imageHash) {
      console.log("saveToDatabase: Using image_hash:", imageHash);
      formData.append("image_hash", imageHash);
    } else if (file) {
      console.log("saveToDatabase: Using file upload:", file.name);
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

  async updateQuizQA(translationId: string): Promise<any> {
    const formData = new FormData();
    formData.append("translation_id_str", translationId);
    return apiClient.post('translations/update-quiz-qa', formData);
  }

  async fetchThumbnails(username: string): Promise<any> {
    const formData = new FormData();
    formData.append("username", username);
    return apiClient.post('thumbnail', formData);
  }

  async fetchPopularImages(
    searchQuery?: string,
    language?: string,
    limit: number = 25,
    useVectorSearch: boolean = true,
    skip: number = 0,
    lastObjectId?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim() !== '') {
      params.append('search_query', searchQuery);
    }
    if (language) {
      params.append('language', language);
    }
    params.append('limit', limit.toString());
    params.append('use_vector_search', useVectorSearch.toString());
    params.append('skip', skip.toString());
    if (lastObjectId) {
      params.append('last_object_id', lastObjectId);
    }

    let endpoint = 'pool/recommendations';
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return apiClient.post(endpoint, null);
  }

  async getTranslationByHash(imageHash: string, language: string): Promise<any> {
    return apiClient.get(`translations/search?image_hash=${imageHash}&language=${language}`);
  }

  async importContent(imageHash: string, language: string): Promise<any> {
    return apiClient.get(`import_content?image_hash=${imageHash}&language=${language}`);
  }

  async getRepository(
    language: string,
    searchText?: string,
    lastTxnId?: string,
    limit: number = 25,
    skip: number = 0,
    useVectorSearch: boolean = true
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('language', language);
    if (searchText) params.append('search_text', searchText);
    if (lastTxnId) params.append('last_txn_id', lastTxnId);
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    params.append('use_vector_search', useVectorSearch.toString());
    return apiClient.get(`repository/get_repository?${params.toString()}`);
  }

  // Legacy method - kept for backwards compatibility if needed
  async fetchOrgObjects(language: string, searchQuery: string, skip: number = 0, limit: number = 25): Promise<any> {
    const params = new URLSearchParams();
    params.append('language', language);
    if (searchQuery) params.append('search_query', searchQuery);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    return apiClient.get(`organization/objects?${params.toString()}`);
  }
}

export const translationService = new TranslationService();