// // services/curriculum.service.ts
// import { apiClient } from './api';
// import { Book, CurriculumImage } from '../types';

// // The data type for saving a book. It can optionally include an _id for updates.
// export type BookSavePayload = Omit < Book, 'created_at' | 'updated_at' > ;
// export type BookCreatePayload = Omit < Book, '_id' | 'created_at' | 'updated_at' > ;


// // ---------- STORY MODELS ----------
// export interface PageStoryRequest {
//     book_id: string;
//     chapter_id: string;
//     page_id: string;
//     user_comments ? : string;
// }

// export interface StoryResponse {
//     book_id: string;
//     chapter_id: string;
//     page_id: string;
//     language: string;
//     object_names: string[];
//     story: string;
//     moral ? : string;
//     created_at: string; // Assuming datetime is serialized as string
// }


// class CurriculumService {
//     /**
//      * Searches for books based on a query and language.
//      * This should return a lightweight list of books, not the full structure.
//      */
//     async searchBooks(searchText: string, language: string | null): Promise < Book[] > {
//         const params = new URLSearchParams();
//         params.append('search_text', searchText);
//         if (language) {
//             params.append('language', language);
//         }

//         const endpoint = `curriculum/books/search?${params.toString()}`;
//         return apiClient.get(endpoint);
//     }

//     /**
//      * Fetches the entire structure of a single book, including all chapters and pages.
//      */
//     async fetchBookDetails(bookId: string): Promise < Book > {
//         // Per user instruction, this endpoint gets the full book structure.
//         return apiClient.get(`curriculum/books/${bookId}/book`);
//     }

//     /**
//      * Creates or updates a book. The same endpoint handles both.
//      */
//     async saveBook(bookData: BookSavePayload | BookCreatePayload, username: string): Promise < Book > {
//         console.log("Saving book data for user:", username, bookData);
//         // Add user information to the payload for auditing/attribution on the backend.
//         const payload = { ...bookData,
//             updated_by: username
//         };
//         return apiClient.post('curriculum/books/create_book', payload);
//     }

//     /**
//      * Fetches all images for a given page.
//      */
//     async fetchImagesForPage(book_id: string, chapter_identifier: string, page_identifier: string): Promise < CurriculumImage[] > {
//         console.log(`Fetching images for book ${book_id}, chapter ${chapter_identifier}, page ${page_identifier}`);
//         const endpoint = `curriculum/books/${book_id}/chapters/${chapter_identifier}/pages/${page_identifier}/images`;
//         const response = await apiClient.get(endpoint);
//         return (response.images || []).map((img: any) => ({
//             image_id: img.image_id,
//             image_hash: img.image_hash,
//             position: img.position,
//             object_name: img.object_name || 'Untitled Image',
//             thumbnail: `data:image/jpeg;base64,${img.thumbnail_base64}`,
//             image_base64: img.image_base64,
//         }));
//     }

//     /**
//      * Generates a story for a given page based on its images.
//      */
//     async createStory(bookId: string, chapterId: string, pageId: string, userComments ? : string): Promise < StoryResponse > {
//         const endpoint = 'curriculum/story/create_story';
//         const payload: PageStoryRequest = {
//             book_id: bookId,
//             chapter_id: chapterId,
//             page_id: pageId,
//         };
//         if (userComments) {
//             payload.user_comments = userComments;
//         }
//         return apiClient.post(endpoint, payload);
//     }
// }

// export const curriculumService = new CurriculumService();

// services/curriculum.service.ts
import { apiClient } from './api';
import { Book, CurriculumImage } from '../types';

// The data type for saving a book. It can optionally include an _id for updates.
export type BookSavePayload = Omit < Book, 'created_at' | 'updated_at' > ;
export type BookCreatePayload = Omit < Book, '_id' | 'created_at' | 'updated_at' > ;


// ---------- STORY MODELS ----------
export interface PageStoryRequest {
    book_id: string;
    chapter_id: string;
    page_id: string;
    user_comments ? : string;
}

export interface StoryResponse {
    book_id: string;
    chapter_id: string;
    page_id: string;
    language: string;
    object_names: string[];
    story: string;
    moral ? : string;
    created_at: string; // Assuming datetime is serialized as string
}


class CurriculumService {
    /**
     * Searches for books based on a query and language.
     * This should return a lightweight list of books, not the full structure.
     */
    async searchBooks(searchText: string, language: string | null): Promise < Book[] > {
        const params = new URLSearchParams();
        params.append('search_text', searchText);
        if (language) {
            params.append('language', language);
        }

        const endpoint = `curriculum/books/search?${params.toString()}`;
        return apiClient.get(endpoint);
    }

    /**
     * Fetches the entire structure of a single book, including all chapters and pages.
     */
    async fetchBookDetails(bookId: string): Promise < Book > {
        // Per user instruction, this endpoint gets the full book structure.
        return apiClient.get(`curriculum/books/${bookId}/book`);
    }

    /**
     * Creates or updates a book. The same endpoint handles both.
     */
    async saveBook(bookData: BookSavePayload | BookCreatePayload, username: string): Promise < Book > {
        console.log("Saving book data for user:", username, bookData);
        // Add user information to the payload for auditing/attribution on the backend.
        const payload = { ...bookData,
            updated_by: username
        };
        return apiClient.post('curriculum/books/create_book', payload);
    }

    /**
     * Fetches all images for a given page.
     */
    async fetchImagesForPage(book_id: string, chapter_identifier: string, page_identifier: string): Promise < CurriculumImage[] > {
        console.log(`Fetching images for book ${book_id}, chapter ${chapter_identifier}, page ${page_identifier}`);
        const endpoint = `curriculum/books/${book_id}/chapters/${chapter_identifier}/pages/${page_identifier}/images`;
        const response = await apiClient.get(endpoint);
        return (response.images || []).map((img: any) => ({
            image_id: img.image_id,
            image_hash: img.image_hash,
            position: img.position,
            object_name: img.object_name || 'Untitled Image',
            thumbnail: `data:image/jpeg;base64,${img.thumbnail_base64}`,
            image_base64: img.image_base64,
        }));
    }

    /**
     * Fetches details for a single image on a page.
     * The backend returns a response with an "images" array containing one image.
     */
    async fetchImageDetails(book_id: string, chapter_identifier: string, page_identifier: string, image_id: string): Promise<CurriculumImage> {
        const endpoint = `curriculum/books/${book_id}/chapters/${chapter_identifier}/pages/${page_identifier}/images?image_id=${image_id}`;
        const response = await apiClient.get(endpoint);

        if (!response.images || response.images.length === 0) {
            throw new Error(`Image with ID ${image_id} not found for the specified page.`);
        }
        
        const img = response.images[0];
        
        return {
            image_id: img.image_id,
            image_hash: img.image_hash,
            position: img.position,
            object_name: img.object_name || 'Untitled Image',
            thumbnail: `data:image/jpeg;base64,${img.thumbnail_base64}`,
            image_base64: img.image_base64,
        };
    }


    /**
     * Generates a story for a given page based on its images.
     */
    async createStory(bookId: string, chapterId: string, pageId: string, userComments ? : string): Promise < StoryResponse > {
        const endpoint = 'curriculum/story/create_story';
        const payload: PageStoryRequest = {
            book_id: bookId,
            chapter_id: chapterId,
            page_id: pageId,
        };
        if (userComments) {
            payload.user_comments = userComments;
        }
        return apiClient.post(endpoint, payload);
    }
}

export const curriculumService = new CurriculumService();