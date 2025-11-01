// // hooks/useCurriculum.ts
// import { useState, useCallback, useEffect } from 'react';
// import { Book, Chapter, Page, CurriculumImage, DatabaseImage, UserContext } from '../types';
// import { curriculumService, BookSavePayload, BookCreatePayload } from '../services/curriculum.service';

// const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// // Helper to pad numbers with leading zeros for IDs
// const pad = (num: number, size: number) => String(num).padStart(size, '0');

// export const useCurriculum = (userContext: UserContext | null) => {
//   const [books, setBooks] = useState<Book[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchLanguage, setSearchLanguage] = useState('');
//   const [searchAttempted, setSearchAttempted] = useState(false);
  
//   const [activeBook, setActiveBook] = useState<Book | null>(null);
//   const [isDirty, setIsDirty] = useState(false);
  
//   // State to hold the counters for new ID generation
//   const [idCounters, setIdCounters] = useState({ chapter: 0, page: 0, image: 0 });

//   const [expansionState, setExpansionState] = useState<Record<string, boolean>>({});
//   const [selectedPage, setSelectedPage] = useState<Page | null>(null);
//   const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
//   const username = userContext?.username;
//   const [isStoryLoading, setIsStoryLoading] = useState(false);

//   useEffect(() => {
//     if (notification) {
//       const timer = setTimeout(() => setNotification(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [notification]);

//   const handleSearch = useCallback(async () => {
//     if (!searchQuery.trim()) {
//       setBooks([]);
//       setActiveBook(null);
//       setSearchAttempted(false);
//       return;
//     }
//     setIsLoading(true);
//     setSearchAttempted(true);
//     setBooks([]);
//     setActiveBook(null);
//     try {
//       const results = await curriculumService.searchBooks(searchQuery, searchLanguage);
//       setBooks(results);
//     } catch (error) {
//       console.error("Failed to search for books:", error);
//       setNotification({ message: `Error searching books: ${(error as Error).message}`, type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [searchQuery, searchLanguage]);

//   useEffect(() => {
//     if (!searchQuery.trim()) {
//       setSearchAttempted(false);
//       setBooks([]);
//     }
//   }, [searchQuery]);

//   const createBook = useCallback(async (bookData: Omit<Book, '_id' | 'chapters' | 'chapter_count' | 'page_count' | 'image_count' | 'created_at' | 'updated_at'>) => {
//     setIsLoading(true);
//     if (!username) {
//       setNotification({ message: 'User information is missing. Cannot create book.', type: 'error' });
//       setIsLoading(false);
//       return;
//     }
//     try {
//       const payload: BookCreatePayload = { ...bookData, chapters: [] };
//       const newBook = await curriculumService.saveBook(payload, username);
//       setBooks(prev => [newBook, ...prev]);
//       setActiveBook(newBook);
//       setIdCounters({
//         chapter: newBook.chapter_count || 0,
//         page: newBook.page_count || 0,
//         image: newBook.image_count || 0,
//       });
//       setExpansionState({ [newBook._id]: true });
//       setIsDirty(false); // A new book isn't dirty
//     } catch (error) {
//       console.error("Failed to create book:", error);
//       setNotification({ message: `Error creating book: ${(error as Error).message}`, type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [username]);
  
//   const selectBook = useCallback(async (bookId: string) => {
//     setIsLoading(true);
//     try {
//         const fullBook = await curriculumService.fetchBookDetails(bookId);

//         // Mark all pages as not having images loaded yet to force refetch on selection
//         fullBook.chapters.forEach(c => c.pages.forEach(p => p.imagesLoaded = false));

//         setBooks(prevBooks => prevBooks.map(b => (b._id === bookId ? fullBook : b)));
        
//         setActiveBook(fullBook);
//         setSelectedPage(null);
//         setIdCounters({
//             chapter: fullBook.chapter_count || 0,
//             page: fullBook.page_count || 0,
//             image: fullBook.image_count || 0,
//         });
//         setExpansionState({ [bookId]: true });
//         setIsDirty(false);
//     } catch (error) {
//         console.error("Failed to select and fetch book:", error);
//         setNotification({ message: `Error loading book: ${(error as Error).message}`, type: 'error' });
//     } finally {
//         setIsLoading(false);
//     }
//   }, []);

//   const updateActiveBook = useCallback((updater: (book: Book) => Book, options: { markDirty: boolean } = { markDirty: true }) => {
//     setActiveBook(currentBook => {
//       if (!currentBook) return null;
      
//       const updatedBook = updater(deepClone(currentBook));
      
//       setBooks(currentBooks =>
//         currentBooks.map(b => (b._id === updatedBook._id ? updatedBook : b))
//       );
      
//       if (options.markDirty) {
//         setIsDirty(true);
//       }
//       return updatedBook;
//     });
//   }, [setBooks, setIsDirty]);


//   const handleNodeExpansion = useCallback(async (node: Book | Chapter) => {
//     const isBook = 'chapters' in node;
//     const nodeId = isBook ? (node as Book)._id : (node as Chapter).chapter_id;
//     if (!nodeId) return;
  
//     if (!isBook) {
//       setExpansionState(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
//       return;
//     }
  
//     const bookNode = node as Book;
//     const isCurrentlyExpanded = !!expansionState[nodeId];
  
//     if (isCurrentlyExpanded) {
//       setExpansionState(prev => ({ ...prev, [nodeId]: false }));
//       return;
//     }
    
//     if (bookNode.chapters && bookNode.chapters.length > 0) {
//       setExpansionState(prev => ({ ...prev, [nodeId]: true }));
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const fullBook = await curriculumService.fetchBookDetails(bookNode._id);
      
//       setBooks(prevBooks => prevBooks.map(b => (b._id === fullBook._id ? fullBook : b)));
      
//       setActiveBook(fullBook);
//       setIdCounters({
//         chapter: fullBook.chapter_count || 0,
//         page: fullBook.page_count || 0,
//         image: fullBook.image_count || 0,
//       });
//       setExpansionState(prev => ({ ...prev, [nodeId]: true }));
//     } catch (error) {
//       console.error("Failed to fetch book details on expansion:", error);
//       setNotification({ message: `Error fetching book: ${(error as Error).message}`, type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [expansionState]);

//   const selectPage = useCallback(async (page: Page) => {
//     if (!activeBook?._id || !page.page_id) return;

//     const chapter = activeBook.chapters.find(c => c.pages.some(p => p.page_id === page.page_id));
//     if (!chapter?.chapter_id) return;

//     setSelectedPage(page);

//     if (page.imagesLoaded) return;

//     if (page.isNew) {
//       updateActiveBook(book => {
//         const chapterToUpdate = book.chapters.find(c => c.chapter_id === chapter!.chapter_id);
//         const pageToUpdate = chapterToUpdate?.pages.find(p => p.page_id === page.page_id);
//         if (pageToUpdate) pageToUpdate.imagesLoaded = true;
//         return book;
//       }, { markDirty: false });
//       return;
//     }

//     setIsLoading(true);
//     try {
//         const fetchedImages = await curriculumService.fetchImagesForPage(activeBook._id, chapter.chapter_id, page.page_id);
//         const pageWithImages = { ...page, images: fetchedImages, imagesLoaded: true };

//         setSelectedPage(pageWithImages);
        
//         updateActiveBook(book => {
//             const chapterToUpdate = book.chapters.find(c => c.chapter_id === chapter!.chapter_id);
//             if (chapterToUpdate) {
//                 const pageIndex = chapterToUpdate.pages.findIndex(p => p.page_id === page.page_id);
//                 if (pageIndex > -1) {
//                     chapterToUpdate.pages[pageIndex] = pageWithImages;
//                 }
//             }
//             return book;
//         }, { markDirty: false });

//     } catch (error) {
//         setNotification({ message: `Error fetching images: ${(error as Error).message}`, type: 'error' });
//     } finally {
//         setIsLoading(false);
//     }
//   }, [activeBook, updateActiveBook]);

//   const performActionOnBook = async (bookId: string, action: (book: Book) => Book) => {
//     setIsLoading(true);
//     try {
//       let bookToUpdate = activeBook;
      
//       if (!bookToUpdate || bookToUpdate._id !== bookId || bookToUpdate.chapters.length < (bookToUpdate.chapter_count ?? 0)) {
//         bookToUpdate = await curriculumService.fetchBookDetails(bookId);
//       }
      
//       const updatedBook = action(deepClone(bookToUpdate));

//       setBooks(prev => prev.map(b => b._id === bookId ? updatedBook : b));
//       setActiveBook(updatedBook);
//       setIsDirty(true);

//     } catch (error) {
//       setNotification({ message: `Failed to update book: ${(error as Error).message}`, type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const addChapter = useCallback(async (bookId: string) => {
//     await performActionOnBook(bookId, (book) => {
//       const newChapterCount = book.chapters.length + 1;
//       const newChapter: Chapter = {
//           chapter_id: `${book._id}-new-${Date.now()}`,
//           chapter_number: newChapterCount,
//           chapter_name: `New Chapter ${newChapterCount}`,
//           pages: [],
//           isNew: true,
//           isModified: true,
//       };
//       book.chapters.push(newChapter);
//       setExpansionState(prev => ({ ...prev, [book._id]: true, [newChapter.chapter_id!]: true }));
//       return book;
//     });
//   }, []);

//   const addPage = useCallback(async (bookId: string, chapterId: string) => {
//     await performActionOnBook(bookId, (book) => {
//       const chapter = book.chapters.find(c => c.chapter_id === chapterId);
//       if (chapter) {
//         const newPageCount = chapter.pages.length + 1;
//         const newPage: Page = {
//           page_id: `${chapterId}-new-${Date.now()}`,
//           page_number: newPageCount,
//           title: `New Page ${newPageCount}`,
//           images: [],
//           isNew: true,
//           isModified: true,
//         };
//         chapter.pages.push(newPage);
//         chapter.isModified = true;
//         setExpansionState(prev => ({ ...prev, [chapterId]: true }));
//       }
//       return book;
//     });
//   }, []);
  
//   const deleteChapter = useCallback((chapterId: string) => {
//     if (selectedPage && activeBook?.chapters.find(c => c.chapter_id === chapterId)?.pages.some(p => p.page_id === selectedPage.page_id)) {
//       setSelectedPage(null);
//     }

//     updateActiveBook(book => {
//       book.chapters = book.chapters.filter(c => c.chapter_id !== chapterId);
//       return book;
//     });
//   }, [updateActiveBook, activeBook, selectedPage]);

//   const updateChapterName = useCallback((chapterId: string, newName: string) => {
//     updateActiveBook(book => {
//         const chapter = book.chapters.find(c => c.chapter_id === chapterId);
//         if (chapter) {
//             chapter.chapter_name = newName;
//             chapter.isModified = true;
//         }
//         return book;
//     });
//   }, [updateActiveBook]);
  
//   const deletePage = useCallback((chapterId: string, pageId: string) => {
//     updateActiveBook(book => {
//       const chapter = book.chapters.find(c => c.chapter_id === chapterId);
//       if (chapter) {
//         chapter.pages = chapter.pages.filter(p => p.page_id !== pageId);
//         chapter.isModified = true;
//       }
//       return book;
//     });

//     if (selectedPage?.page_id === pageId) {
//       setSelectedPage(null);
//     }
//   }, [updateActiveBook, selectedPage]);
  
//   const updatePageTitle = useCallback((chapterId: string, pageId: string, newTitle: string) => {
//     let updatedPage: Page | null = null;
//     updateActiveBook(book => {
//       const chapter = book.chapters.find(c => c.chapter_id === chapterId);
//       const page = chapter?.pages.find(p => p.page_id === pageId);
//       if (page && chapter) {
//         page.title = newTitle;
//         page.isModified = true;
//         chapter.isModified = true;
//         updatedPage = { ...page };
//       }
//       return book;
//     });

//     if (updatedPage && selectedPage?.page_id === pageId) {
//       setSelectedPage(updatedPage);
//     }
//   }, [updateActiveBook, selectedPage]);

//   const generateStoryForPage = useCallback(async (pageId: string, userComments?: string) => {
//     if (!activeBook) return;

//     let chapterId: string | undefined;
//     for (const chapter of activeBook.chapters) {
//         if (chapter.pages.some(p => p.page_id === pageId)) {
//             chapterId = chapter.chapter_id;
//             break;
//         }
//     }

//     if (!chapterId || !username) {
//         setNotification({ message: 'Could not generate story. Missing required information.', type: 'error' });
//         return;
//     }

//     setIsStoryLoading(true);
//     setNotification(null);
//     try {
//         const result = await curriculumService.createStory(activeBook._id, chapterId, pageId, userComments);
//         updateActiveBook(book => {
//             const chapter = book.chapters.find(c => c.chapter_id === chapterId);
//             const page = chapter?.pages.find(p => p.page_id === pageId);
//             if (page) {
//                 page.story = result.story;
//                 page.moral = result.moral;
//                 page.isModified = true;
//                 if (chapter) chapter.isModified = true;
//                 setSelectedPage(currentPage => (currentPage?.page_id === pageId ? { ...page } : currentPage));
//             }
//             return book;
//         });
//         setNotification({ message: 'Story generated successfully!', type: 'success' });
//     } catch (error) {
//         setNotification({ message: `Error generating story: ${(error as Error).message}`, type: 'error' });
//     } finally {
//         setIsStoryLoading(false);
//     }
//   }, [activeBook, username, updateActiveBook]);
  
//   const addImageToPage = useCallback((dbImage: DatabaseImage) => {
//     if (!selectedPage || !activeBook?._id) return;
//     const newImageCount = idCounters.image + 1;
//     let updatedPageData: Page | null = null;
    
//     updateActiveBook(book => {
//       const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
//       const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);
//       if (page && chapter?.chapter_number && page.page_number) {
//         const newPosition = (page.images?.length || 0) + 1;
//         const newImage: CurriculumImage = {
//           image_id: `${book._id}-${pad(chapter.chapter_number, 3)}-${pad(page.page_number, 4)}-${pad(newImageCount, 5)}`,
//           image_hash: dbImage.object.image_hash,
//           position: newPosition,
//           thumbnail: `data:image/jpeg;base64,${dbImage.object.thumbnail}`,
//           object_name: dbImage.common_data.object_name_en,
//           isNew: true,
//         };
//         if (!page.images) page.images = [];
//         page.images.push(newImage);
//         page.isModified = true;
//         chapter.isModified = true;
//         updatedPageData = { ...page };
//       }
//       return book;
//     });

//     if (updatedPageData) setSelectedPage(updatedPageData);
//     setIdCounters(prev => ({ ...prev, image: newImageCount }));
//   }, [updateActiveBook, activeBook, selectedPage, idCounters]);


  
//   // const removeImageFromPage = useCallback((imageHash: string) => {
//   //   if (!selectedPage) return;
//   //   let updatedPageData: Page | null = null;
  
//   //   updateActiveBook(book => {
//   //     const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
//   //     const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);
//   //     if (page && chapter) {
//   //       const remainingImages = page.images.filter(img => img.image_hash !== imageHash);
//   //       // Recalculate positions after removal
//   //       page.images = remainingImages.map((img, index) => ({
//   //         ...img,
//   //         position: index + 1
//   //       }));
//   //       page.isModified = true;
//   //       chapter.isModified = true;
//   //       updatedPageData = { ...page };
//   //     }
//   //     return book;
//   //   });
  
//   //   if (updatedPageData) setSelectedPage(updatedPageData);
//   // }, [updateActiveBook, selectedPage]);

//   const removeImageFromPage = useCallback((imageHash: string) => {
//     if (!selectedPage?.page_id) return;
//     const pageId = selectedPage.page_id;
  
//     // This variable will be set inside the updater and used afterward.
//     // This pattern is safe for getting a result from a state updater function.
//     let pageAfterUpdate: Page | null = null;
//     console.log(`Removing image with hash ${imageHash} from page ID ${pageId} with selected page value as: `, selectedPage);
//     updateActiveBook(book => {
//       // Use the stable pageId instead of the selectedPage object from the closure.
//       const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === pageId));
//       const page = chapter?.pages.find(p => p.page_id === pageId);
  
//       if (page && chapter) {
//         // Filter out the image to remove.
//         const remainingImages = page.images.filter(img => img.image_hash !== imageHash);
        
//         // Re-calculate positions for the remaining images to ensure the sequence is correct.
//         page.images = remainingImages.map((img, index) => ({
//           ...img,
//           position: index + 1 // Position is 1-based.
//         }));
//         console.log(`Remaining images after removal: `, page.images);
//         // Mark the page and chapter as modified for save tracking.
//         page.isModified = true;
//         chapter.isModified = true;
  
//         // Capture the updated page data to refresh the selectedPage state.
        
//         pageAfterUpdate = { ...page };
//         console.log(`Updated page after removing image: `, pageAfterUpdate);

//       }
//       ///////////

// //       page.images = reorderedImages;
// //       updatedPageData = { ...page };
// //     }
// //     return book;
// //   });

// //   if (updatedPageData) {
// //     setSelectedPage(updatedPageData);
// //     setIsDirty(true);
// //   }
// // }, [updateActiveBook, selectedPage]);

//       ///////////
//       return book;
//     });
  
//     // After updating the activeBook, update the selectedPage state.
//     // This ensures the UI (e.g., MiddlePanel) re-renders with the correct data.
//     if (pageAfterUpdate) {
//       setSelectedPage(pageAfterUpdate);
//       setIsDirty(true);
//     }
//   }, [updateActiveBook, selectedPage, setSelectedPage]);



//   // // const reorderImagesOnPage = useCallback((draggedIndex: number, targetIndex: number) => {
//   // //   if (!selectedPage) return;

//   // //   let updatedPage: Page | null = null;
    
//   // //   // Update the master `activeBook` state
//   // //   updateActiveBook(book => {
//   // //       const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
//   // //       const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);

//   // //       if (page?.images && chapter) {
//   // //           const reorderedImages = [...page.images];
//   // //           const [draggedItem] = reorderedImages.splice(draggedIndex, 1);
//   // //           reorderedImages.splice(targetIndex, 0, draggedItem);
            
//   // //           // Assign new positions and update the page
//   // //           page.images = reorderedImages.map((img, index) => ({ ...img, position: index + 1 }));
//   // //           page.isModified = true;
//   // //           chapter.isModified = true;
            
//   // //           // Keep a reference to the updated page data
//   // //           updatedPage = page;
//   // //       }
//   // //       return book;
//   // //   });

//   // //   // If the page was updated, also update the specific `selectedPage` state
//   // //   // to ensure all components have the latest data for re-rendering.
//   // //   if (updatedPage) {
//   // //       setSelectedPage(updatedPage);
//   // //   }
//   // // }, [selectedPage, updateActiveBook]);
//   // const reorderImagesOnPage = useCallback((draggedImageHash: string, targetImageHash: string) => {
//   //   if (!selectedPage || draggedImageHash === targetImageHash) return;
    
//   //   let updatedPageData: Page | null = null;

//   //   updateActiveBook(book => {
//   //     const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
//   //     const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);

//   //     if (page && page.images) {
//   //       const images = [...page.images];
//   //       const draggedIndex = images.findIndex(img => img.image_hash === draggedImageHash);
//   //       const targetIndex = images.findIndex(img => img.image_hash === targetImageHash);

//   //       if (draggedIndex > -1 && targetIndex > -1) {
//   //         const [draggedItem] = images.splice(draggedIndex, 1);
//   //         images.splice(targetIndex, 0, draggedItem);

//   //         page.images = images.map((img, index) => ({
//   //           ...img,
//   //           position: index + 1,
//   //         }));

//   //         updatedPageData = { ...page };
//   //       }
//   //     }
//   //     return book;
//   //   });

//   //   if (updatedPageData) {
//   //     setSelectedPage(updatedPageData);
//   //     setIsDirty(true);
//   //   }
//   // }, [updateActiveBook, selectedPage]);

//   // const reorderImagesOnPage = useCallback((draggedImageHash: string, targetImageHash: string) => {
//   //   if (!selectedPage || draggedImageHash === targetImageHash) return;
    
//   //   let updatedPageData: Page | null = null;
  
//   //   updateActiveBook(book => {
//   //     const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
//   //     const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);
  
//   //     if (page && page.images) {
//   //       // Create a deep copy to avoid mutations
//   //       const images = [...page.images];
        
//   //       // Find indices
//   //       const draggedIndex = images.findIndex(img => img.image_hash === draggedImageHash);
//   //       const targetIndex = images.findIndex(img => img.image_hash === targetImageHash);
  
//   //       if (draggedIndex > -1 && targetIndex > -1) {
//   //         console.log('Before reorder:');
//   //         images.forEach((img, idx) => console.log(`  [${idx}] position=${img.position} hash=${img.image_hash}`));
          
//   //         // Remove the dragged item from array
//   //         const [draggedItem] = images.splice(draggedIndex, 1);
          
//   //         // Insert it at the target position
//   //         // This automatically shifts all other items
//   //         images.splice(targetIndex, 0, draggedItem);
          
//   //         console.log('After splice:');
//   //         images.forEach((img, idx) => console.log(`  [${idx}] hash=${img.image_hash}`));
  
//   //         // Reassign positions to ALL images based on their new array order
//   //         // This ensures no positions are lost or duplicated
//   //         page.images = images.map((img, index) => ({
//   //           ...img,
//   //           position: index + 1, // Position is 1-indexed
//   //         }));
          
//   //         console.log('After position update:');
//   //         page.images.forEach(img => console.log(`  position=${img.position} hash=${img.image_hash}`));
  
//   //         updatedPageData = { ...page };
//   //       }
//   //     }
//   //     return book;
//   //   });
  
//   //   if (updatedPageData) {
//   //     setSelectedPage(updatedPageData);
//   //     setIsDirty(true);
//   //   }
//   // }, [updateActiveBook, selectedPage]);

// // CORRECTED IMPLEMENTATION - Fixed position calculation logic

// const reorderImagesOnPage = useCallback((draggedImageHash: string, targetImageHash: string) => {
//   if (!selectedPage || draggedImageHash === targetImageHash) return;
  
//   let updatedPageData: Page | null = null;

//   updateActiveBook(book => {
//     const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
//     const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);

//     if (page && page.images) {
//       // Create a deep copy to avoid mutations
//       const images = [...page.images];
      
//       // Find the actual current positions (not array indices)
//       const draggedImage = images.find(img => img.image_hash === draggedImageHash);
//       const targetImage = images.find(img => img.image_hash === targetImageHash);
      
//       if (!draggedImage || !targetImage) {
//         console.error('Could not find dragged or target image');
//         return book;
//       }

//       const draggedPosition = draggedImage.position;
//       const targetPosition = targetImage.position;

//       console.log('=== REORDER OPERATION ===');
//       console.log(`Dragging: position ${draggedPosition} → position ${targetPosition}`);
//       console.log('Before reorder:');
//       images.forEach(img => console.log(`  position=${img.position} hash=${img.image_hash} name=${img.object_name}`));
      
//       // Calculate new positions for ALL images
//       const reorderedImages = images.map(img => {
//         // Early return if position is undefined
//         if (typeof img.position !== 'number') return img;

//         if (img.image_hash === draggedImageHash) {
//           // The dragged image takes the target position
//           return { ...img, position: targetPosition };
//         } else if (typeof draggedPosition === 'number' && typeof targetPosition === 'number' && draggedPosition < targetPosition) {
//           // Dragging DOWN: Images between dragged and target shift UP (decrease position)
//           if (img.position > draggedPosition && img.position <= targetPosition) {
//             return { ...img, position: img.position - 1 };
//           }
//         } else if (typeof draggedPosition === 'number' && typeof targetPosition === 'number' && draggedPosition > targetPosition) {
//           // Dragging UP: Images between target and dragged shift DOWN (increase position)
//           if (img.position >= targetPosition && img.position < draggedPosition) {
//             return { ...img, position: img.position + 1 };
//           }
//         }
//         // All other images keep their position
//         return img;
//       });
      
//       // Sort by new position to maintain array order
//       reorderedImages.sort((a, b) => {
//         const posA = a.position ?? Number.MAX_SAFE_INTEGER;
//         const posB = b.position ?? Number.MAX_SAFE_INTEGER;
//         return posA - posB;
//       });
      
//       console.log('After reorder:');
//       reorderedImages.forEach(img => console.log(`  position=${img.position} hash=${img.image_hash} name=${img.object_name}`));
//       console.log('======================\n');

//       page.images = reorderedImages;
//       updatedPageData = { ...page };
//     }
//     return book;
//   });

//   if (updatedPageData) {
//     setSelectedPage(updatedPageData);
//     setIsDirty(true);
//   }
// }, [updateActiveBook, selectedPage]);

// // DETAILED EXPLANATION WITH YOUR EXAMPLE:
// // 
// // Example: Drag position 8 → position 2 (10 total images)
// // 
// // Initial state:
// // pos=1 (hash_1), pos=2 (hash_2), pos=3 (hash_3), pos=4 (hash_4), pos=5 (hash_5),
// // pos=6 (hash_6), pos=7 (hash_7), pos=8 (hash_8 - DRAGGED), pos=9 (hash_9), pos=10 (hash_10)
// //
// // Since draggedPosition (8) > targetPosition (2), we're dragging UP
// // 
// // Logic for each image:
// // - hash_1: position=1, not in range [2,8), keep position=1 ✓
// // - hash_2: position=2, in range [2,8), shift DOWN: 2+1=3 ✓ (TARGET IMAGE SHIFTS)
// // - hash_3: position=3, in range [2,8), shift DOWN: 3+1=4 ✓
// // - hash_4: position=4, in range [2,8), shift DOWN: 4+1=5 ✓
// // - hash_5: position=5, in range [2,8), shift DOWN: 5+1=6 ✓
// // - hash_6: position=6, in range [2,8), shift DOWN: 6+1=7 ✓
// // - hash_7: position=7, in range [2,8), shift DOWN: 7+1=8 ✓
// // - hash_8: DRAGGED IMAGE, gets targetPosition=2 ✓
// // - hash_9: position=9, not in range [2,8), keep position=9 ✓
// // - hash_10: position=10, not in range [2,8), keep position=10 ✓
// //
// // Final state (after sort):
// // pos=1 (hash_1), pos=2 (hash_8 - MOVED HERE), pos=3 (hash_2), pos=4 (hash_3), pos=5 (hash_4),
// // pos=6 (hash_5), pos=7 (hash_6), pos=8 (hash_7), pos=9 (hash_9), pos=10 (hash_10)
// //
// // KEY DIFFERENCES FROM PREVIOUS APPROACH:
// // 1. We DON'T use array indices - we use the actual position property
// // 2. We calculate shifts based on position values, not array manipulation
// // 3. We preserve all images and only modify their position property
// // 4. We sort at the end to ensure array order matches position order

// // ============================================
// // BACKEND API FUNCTION (if you need to persist immediately)
// // ============================================

// /**
//  * Call this function to persist the new order to your backend
//  */
// // const savePageImageOrder = async (pageId: string, images: CurriculumImage[]) => {
// //   try {
// //     const imageOrders = images.map((img, index) => ({
// //       image_id: img.image_id,
// //       image_hash: img.image_hash,
// //       position: index + 1
// //     }));
    
// //     const response = await fetch(`/api/curriculum/pages/${pageId}/image-order`, {
// //       method: 'PUT',
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify({
// //         images: imageOrders
// //       })
// //     });
    
// //     if (!response.ok) {
// //       throw new Error('Failed to save image order');
// //     }
    
// //     console.log('Image order saved successfully');
// //     return await response.json();
// //   } catch (error) {
// //     console.error('Error saving image order:', error);
// //     throw error;
// //   }
// // };



//   const saveBook = useCallback(async () => {
//     if (!activeBook || !username) return;

//     setIsLoading(true);
//     setNotification(null);
//     try {
//         const payload: BookSavePayload = {
//           ...activeBook,
//           chapters: activeBook.chapters.map(chapter => {
//             const { isNew, isEditing, isModified, ...chapterToSave } = chapter;
//             return {
//               ...chapterToSave,
//               pages: chapter.pages.map(page => {
//                 const { isNew, isEditing, isModified, imagesLoaded, ...pageToSave } = page;
//                 return {
//                   ...pageToSave,
//                   images: (page.images || []).map(image => {
//                     const { isNew, thumbnail, ...imageToSave } = image;
//                     return imageToSave;
//                   }),
//                 };
//               }),
//             };
//           }),
//         };
        
//         const savedBook = await curriculumService.saveBook(payload, username);
//         const fullRefreshedBook = await curriculumService.fetchBookDetails(savedBook._id);

//         setBooks(prev => {
//             const exists = prev.some(b => b._id === fullRefreshedBook._id);
//             if (exists) return prev.map(b => (b._id === fullRefreshedBook._id ? fullRefreshedBook : b));
//             return [fullRefreshedBook, ...prev.filter(b => b._id !== activeBook._id)];
//         });

//         setActiveBook(fullRefreshedBook);

//         const newExpansionState: Record<string, boolean> = { [fullRefreshedBook._id]: true };
//         fullRefreshedBook.chapters.forEach(c => c.chapter_id && (newExpansionState[c.chapter_id] = !!expansionState[c.chapter_id]));
//         setExpansionState(newExpansionState);

//         setIdCounters({ chapter: fullRefreshedBook.chapter_count || 0, page: fullRefreshedBook.page_count || 0, image: fullRefreshedBook.image_count || 0 });
//         setIsDirty(false);
//         setSelectedPage(null);
//         setNotification({ message: 'Book saved successfully!', type: 'success' });

//     } catch (error) {
//         setNotification({ message: `Error saving book: ${(error as Error).message}`, type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [activeBook, username, expansionState]);


//   return {
//     books,
//     activeBook,
//     isLoading,
//     isStoryLoading,
//     searchQuery,
//     searchLanguage,
//     selectedPageData: selectedPage,
//     isDirty,
//     expansionState,
//     notification,
//     searchAttempted,
//     setSearchQuery,
//     setSearchLanguage,
//     handleSearch,
//     createBook,
//     selectBook,
//     saveBook,
//     handleNodeExpansion,
//     selectPage,
//     addChapter,
//     deleteChapter,
//     updateChapterName,
//     addPage,
//     deletePage,
//     updatePageTitle,
//     addImageToPage,
//     removeImageFromPage,
//     generateStoryForPage,
//     reorderImagesOnPage,
//   };
// };



// hooks/useCurriculum.ts
import { useState, useCallback, useEffect } from 'react';
import { Book, Chapter, Page, CurriculumImage, DatabaseImage, UserContext } from '../types';
import { curriculumService, BookSavePayload, BookCreatePayload } from '../services/curriculum.service';

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper to pad numbers with leading zeros for IDs
const pad = (num: number, size: number) => String(num).padStart(size, '0');

export const useCurriculum = (userContext: UserContext | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // State to hold the counters for new ID generation
  const [idCounters, setIdCounters] = useState({ chapter: 0, page: 0, image: 0 });

  const [expansionState, setExpansionState] = useState<Record<string, boolean>>({});
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const username = userContext?.username;
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setBooks([]);
      setActiveBook(null);
      setSearchAttempted(false);
      return;
    }
    setIsLoading(true);
    setSearchAttempted(true);
    setBooks([]);
    setActiveBook(null);
    try {
      const results = await curriculumService.searchBooks(searchQuery, searchLanguage);
      setBooks(results);
    } catch (error) {
      console.error("Failed to search for books:", error);
      setNotification({ message: `Error searching books: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchLanguage]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchAttempted(false);
      setBooks([]);
    }
  }, [searchQuery]);

  const createBook = useCallback(async (bookData: Omit<Book, '_id' | 'chapters' | 'chapter_count' | 'page_count' | 'image_count' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    if (!username) {
      setNotification({ message: 'User information is missing. Cannot create book.', type: 'error' });
      setIsLoading(false);
      return;
    }
    try {
      const payload: BookCreatePayload = { ...bookData, chapters: [] };
      const newBook = await curriculumService.saveBook(payload, username);
      setBooks(prev => [newBook, ...prev]);
      setActiveBook(newBook);
      setIdCounters({
        chapter: newBook.chapter_count || 0,
        page: newBook.page_count || 0,
        image: newBook.image_count || 0,
      });
      setExpansionState({ [newBook._id]: true });
      setIsDirty(false); // A new book isn't dirty
    } catch (error) {
      console.error("Failed to create book:", error);
      setNotification({ message: `Error creating book: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [username]);
  
  const selectBook = useCallback(async (bookId: string) => {
    setIsLoading(true);
    try {
        const fullBook = await curriculumService.fetchBookDetails(bookId);

        // Mark all pages as not having images loaded yet to force refetch on selection
        fullBook.chapters.forEach(c => c.pages.forEach(p => p.imagesLoaded = false));

        setBooks(prevBooks => prevBooks.map(b => (b._id === bookId ? fullBook : b)));
        
        setActiveBook(fullBook);
        setSelectedPage(null);
        setIdCounters({
            chapter: fullBook.chapter_count || 0,
            page: fullBook.page_count || 0,
            image: fullBook.image_count || 0,
        });
        setExpansionState({ [bookId]: true });
        setIsDirty(false);
    } catch (error) {
        console.error("Failed to select and fetch book:", error);
        setNotification({ message: `Error loading book: ${(error as Error).message}`, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateActiveBook = useCallback((updater: (book: Book) => Book, options: { markDirty: boolean } = { markDirty: true }) => {
    setActiveBook(currentBook => {
      if (!currentBook) return null;
      
      const updatedBook = updater(deepClone(currentBook));
      
      setBooks(currentBooks =>
        currentBooks.map(b => (b._id === updatedBook._id ? updatedBook : b))
      );
      
      if (options.markDirty) {
        setIsDirty(true);
      }
      return updatedBook;
    });
  }, [setBooks, setIsDirty]);


  const handleNodeExpansion = useCallback(async (node: Book | Chapter) => {
    const isBook = 'chapters' in node;
    const nodeId = isBook ? (node as Book)._id : (node as Chapter).chapter_id;
    if (!nodeId) return;
  
    if (!isBook) {
      setExpansionState(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
      return;
    }
  
    const bookNode = node as Book;
    const isCurrentlyExpanded = !!expansionState[nodeId];
  
    if (isCurrentlyExpanded) {
      setExpansionState(prev => ({ ...prev, [nodeId]: false }));
      return;
    }
    
    if (bookNode.chapters && bookNode.chapters.length > 0) {
      setExpansionState(prev => ({ ...prev, [nodeId]: true }));
      return;
    }

    setIsLoading(true);
    try {
      const fullBook = await curriculumService.fetchBookDetails(bookNode._id);
      
      setBooks(prevBooks => prevBooks.map(b => (b._id === fullBook._id ? fullBook : b)));
      
      setActiveBook(fullBook);
      setIdCounters({
        chapter: fullBook.chapter_count || 0,
        page: fullBook.page_count || 0,
        image: fullBook.image_count || 0,
      });
      setExpansionState(prev => ({ ...prev, [nodeId]: true }));
    } catch (error) {
      console.error("Failed to fetch book details on expansion:", error);
      setNotification({ message: `Error fetching book: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [expansionState]);

  const selectPage = useCallback(async (page: Page) => {
    if (!activeBook?._id || !page.page_id) return;

    const chapter = activeBook.chapters.find(c => c.pages.some(p => p.page_id === page.page_id));
    if (!chapter?.chapter_id) return;

    setSelectedPage(page);

    if (page.imagesLoaded) return;

    if (page.isNew) {
      updateActiveBook(book => {
        const chapterToUpdate = book.chapters.find(c => c.chapter_id === chapter!.chapter_id);
        const pageToUpdate = chapterToUpdate?.pages.find(p => p.page_id === page.page_id);
        if (pageToUpdate) pageToUpdate.imagesLoaded = true;
        return book;
      }, { markDirty: false });
      return;
    }

    setIsLoading(true);
    try {
        const fetchedImages = await curriculumService.fetchImagesForPage(activeBook._id, chapter.chapter_id, page.page_id);
        const pageWithImages = { ...page, images: fetchedImages, imagesLoaded: true };

        setSelectedPage(pageWithImages);
        
        updateActiveBook(book => {
            const chapterToUpdate = book.chapters.find(c => c.chapter_id === chapter!.chapter_id);
            if (chapterToUpdate) {
                const pageIndex = chapterToUpdate.pages.findIndex(p => p.page_id === page.page_id);
                if (pageIndex > -1) {
                    chapterToUpdate.pages[pageIndex] = pageWithImages;
                }
            }
            return book;
        }, { markDirty: false });

    } catch (error) {
        setNotification({ message: `Error fetching images: ${(error as Error).message}`, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  }, [activeBook, updateActiveBook]);

  const performActionOnBook = async (bookId: string, action: (book: Book) => Book) => {
    setIsLoading(true);
    try {
      let bookToUpdate = activeBook;
      
      if (!bookToUpdate || bookToUpdate._id !== bookId || bookToUpdate.chapters.length < (bookToUpdate.chapter_count ?? 0)) {
        bookToUpdate = await curriculumService.fetchBookDetails(bookId);
      }
      
      const updatedBook = action(deepClone(bookToUpdate));

      setBooks(prev => prev.map(b => b._id === bookId ? updatedBook : b));
      setActiveBook(updatedBook);
      setIsDirty(true);

    } catch (error) {
      setNotification({ message: `Failed to update book: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const addChapter = useCallback(async (bookId: string) => {
    await performActionOnBook(bookId, (book) => {
      const newChapterCount = book.chapters.length + 1;
      const newChapter: Chapter = {
          chapter_id: `${book._id}-new-${Date.now()}`,
          chapter_number: newChapterCount,
          chapter_name: `New Chapter ${newChapterCount}`,
          pages: [],
          isNew: true,
          isModified: true,
      };
      book.chapters.push(newChapter);
      setExpansionState(prev => ({ ...prev, [book._id]: true, [newChapter.chapter_id!]: true }));
      return book;
    });
  }, []);

  const addPage = useCallback(async (bookId: string, chapterId: string) => {
    await performActionOnBook(bookId, (book) => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      if (chapter) {
        const newPageCount = chapter.pages.length + 1;
        const newPage: Page = {
          page_id: `${chapterId}-new-${Date.now()}`,
          page_number: newPageCount,
          title: `New Page ${newPageCount}`,
          images: [],
          isNew: true,
          isModified: true,
        };
        chapter.pages.push(newPage);
        chapter.isModified = true;
        setExpansionState(prev => ({ ...prev, [chapterId]: true }));
      }
      return book;
    });
  }, []);
  
  const deleteChapter = useCallback((chapterId: string) => {
    if (selectedPage && activeBook?.chapters.find(c => c.chapter_id === chapterId)?.pages.some(p => p.page_id === selectedPage.page_id)) {
      setSelectedPage(null);
    }

    updateActiveBook(book => {
      book.chapters = book.chapters.filter(c => c.chapter_id !== chapterId);
      return book;
    });
  }, [updateActiveBook, activeBook, selectedPage]);

  const updateChapterName = useCallback((chapterId: string, newName: string) => {
    updateActiveBook(book => {
        const chapter = book.chapters.find(c => c.chapter_id === chapterId);
        if (chapter) {
            chapter.chapter_name = newName;
            chapter.isModified = true;
        }
        return book;
    });
  }, [updateActiveBook]);
  
  const deletePage = useCallback((chapterId: string, pageId: string) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      if (chapter) {
        chapter.pages = chapter.pages.filter(p => p.page_id !== pageId);
        chapter.isModified = true;
      }
      return book;
    });

    if (selectedPage?.page_id === pageId) {
      setSelectedPage(null);
    }
  }, [updateActiveBook, selectedPage]);
  
  const updatePageTitle = useCallback((chapterId: string, pageId: string, newTitle: string) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      const page = chapter?.pages.find(p => p.page_id === pageId);
      if (page && chapter) {
        page.title = newTitle;
        page.isModified = true;
        chapter.isModified = true;
        
        // If the updated page is the currently selected one, update that state too.
        if (selectedPage?.page_id === pageId) {
          setSelectedPage({ ...page });
        }
      }
      return book;
    });
  }, [updateActiveBook, selectedPage, setSelectedPage]);

  const generateStoryForPage = useCallback(async (pageId: string, userComments?: string) => {
    if (!activeBook) return;

    let chapterId: string | undefined;
    for (const chapter of activeBook.chapters) {
        if (chapter.pages.some(p => p.page_id === pageId)) {
            chapterId = chapter.chapter_id;
            break;
        }
    }

    if (!chapterId || !username) {
        setNotification({ message: 'Could not generate story. Missing required information.', type: 'error' });
        return;
    }

    setIsStoryLoading(true);
    setNotification(null);
    try {
        const result = await curriculumService.createStory(activeBook._id, chapterId, pageId, userComments);
        updateActiveBook(book => {
            const chapter = book.chapters.find(c => c.chapter_id === chapterId);
            const page = chapter?.pages.find(p => p.page_id === pageId);
            if (page) {
                page.story = result.story;
                page.moral = result.moral;
                page.isModified = true;
                if (chapter) chapter.isModified = true;
                setSelectedPage(currentPage => (currentPage?.page_id === pageId ? { ...page } : currentPage));
            }
            return book;
        });
        setNotification({ message: 'Story generated successfully!', type: 'success' });
    } catch (error) {
        setNotification({ message: `Error generating story: ${(error as Error).message}`, type: 'error' });
    } finally {
        setIsStoryLoading(false);
    }
  }, [activeBook, username, updateActiveBook]);
  
  const addImageToPage = useCallback((dbImage: DatabaseImage) => {
    if (!selectedPage || !activeBook?._id) return;
    const newImageCount = idCounters.image + 1;
    let updatedPageData: Page | null = null;
    
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
      const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);
      if (page && chapter?.chapter_number && page.page_number) {
        const newPosition = (page.images?.length || 0) + 1;
        const newImage: CurriculumImage = {
          image_id: `${book._id}-${pad(chapter.chapter_number, 3)}-${pad(page.page_number, 4)}-${pad(newImageCount, 5)}`,
          image_hash: dbImage.object.image_hash,
          position: newPosition,
          thumbnail: `data:image/jpeg;base64,${dbImage.object.thumbnail}`,
          object_name: dbImage.common_data.object_name_en,
          isNew: true,
        };
        if (!page.images) page.images = [];
        page.images.push(newImage);
        page.isModified = true;
        chapter.isModified = true;
        updatedPageData = { ...page };
      }
      return book;
    });

    if (updatedPageData) setSelectedPage(updatedPageData);
    setIdCounters(prev => ({ ...prev, image: newImageCount }));
  }, [updateActiveBook, activeBook, selectedPage, idCounters]);
  
  const removeImageFromPage = useCallback((imageHash: string) => {
    const pageId = selectedPage?.page_id;
    if (!pageId) return;

    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === pageId));
      const page = chapter?.pages.find(p => p.page_id === pageId);

      if (page && chapter) {
        const remainingImages = page.images.filter(img => img.image_hash !== imageHash);

        page.images = remainingImages.map((img, index) => ({
          ...img,
          position: index + 1
        }));

        page.isModified = true;
        chapter.isModified = true;

        // By calling setSelectedPage here, inside the updater for activeBook,
        // we ensure both state updates are queued in the same batch using the
        // most up-to-date data, preventing the UI from showing stale state.
        setSelectedPage({ ...page });
      }
      return book;
    });
  }, [selectedPage, updateActiveBook, setSelectedPage]);

  const reorderImagesOnPage = useCallback((draggedImageHash: string, targetImageHash: string) => {
    const pageId = selectedPage?.page_id;
    if (!pageId) return;

    updateActiveBook(book => {
        const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === pageId));
        const page = chapter?.pages.find(p => p.page_id === pageId);

        if (page?.images && chapter) {
            const draggedIndex = page.images.findIndex(img => img.image_hash === draggedImageHash);
            const targetIndex = page.images.findIndex(img => img.image_hash === targetImageHash);

            if (draggedIndex === -1 || targetIndex === -1) {
              console.error("Could not find dragged or target image for reordering.");
              return book;
            }

            const reorderedImages = [...page.images];
            const [draggedItem] = reorderedImages.splice(draggedIndex, 1);
            reorderedImages.splice(targetIndex, 0, draggedItem);
            
            page.images = reorderedImages.map((img, index) => ({ ...img, position: index + 1 }));
            page.isModified = true;
            chapter.isModified = true;
            
            // Immediately update selectedPage state as well to sync the UI
            setSelectedPage({ ...page });
        }
        return book;
    });
  }, [selectedPage, updateActiveBook, setSelectedPage]);

  const saveBook = useCallback(async () => {
    if (!activeBook || !username) return;

    setIsLoading(true);
    setNotification(null);
    try {
        const payload: BookSavePayload = {
          ...activeBook,
          chapters: activeBook.chapters.map(chapter => {
            const { isNew, isEditing, isModified, ...chapterToSave } = chapter;
            return {
              ...chapterToSave,
              pages: chapter.pages.map(page => {
                const { isNew, isEditing, isModified, imagesLoaded, ...pageToSave } = page;
                return {
                  ...pageToSave,
                  images: (page.images || []).map(image => {
                    const { isNew, thumbnail, ...imageToSave } = image;
                    return imageToSave;
                  }),
                };
              }),
            };
          }),
        };
        
        const savedBook = await curriculumService.saveBook(payload, username);
        const fullRefreshedBook = await curriculumService.fetchBookDetails(savedBook._id);

        setBooks(prev => {
            const exists = prev.some(b => b._id === fullRefreshedBook._id);
            if (exists) return prev.map(b => (b._id === fullRefreshedBook._id ? fullRefreshedBook : b));
            return [fullRefreshedBook, ...prev.filter(b => b._id !== activeBook._id)];
        });

        setActiveBook(fullRefreshedBook);

        const newExpansionState: Record<string, boolean> = { [fullRefreshedBook._id]: true };
        fullRefreshedBook.chapters.forEach(c => c.chapter_id && (newExpansionState[c.chapter_id] = !!expansionState[c.chapter_id]));
        setExpansionState(newExpansionState);

        setIdCounters({ chapter: fullRefreshedBook.chapter_count || 0, page: fullRefreshedBook.page_count || 0, image: fullRefreshedBook.image_count || 0 });
        setIsDirty(false);
        setSelectedPage(null);
        setNotification({ message: 'Book saved successfully!', type: 'success' });

    } catch (error) {
        setNotification({ message: `Error saving book: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [activeBook, username, expansionState]);


  return {
    books,
    activeBook,
    isLoading,
    isStoryLoading,
    searchQuery,
    searchLanguage,
    selectedPageData: selectedPage,
    isDirty,
    expansionState,
    notification,
    searchAttempted,
    setSearchQuery,
    setSearchLanguage,
    handleSearch,
    createBook,
    selectBook,
    saveBook,
    handleNodeExpansion,
    selectPage,
    addChapter,
    deleteChapter,
    updateChapterName,
    addPage,
    deletePage,
    updatePageTitle,
    addImageToPage,
    removeImageFromPage,
    generateStoryForPage,
    reorderImagesOnPage,
  };
};
