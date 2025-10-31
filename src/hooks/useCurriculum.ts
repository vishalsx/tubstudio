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

        // Update the book within the main list to persist the search results view
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
        // Don't clear activeBook on error, to avoid view flicker
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateActiveBook = useCallback((updater: (book: Book) => Book, options: { markDirty: boolean } = { markDirty: true }) => {
    setActiveBook(currentBook => {
      if (!currentBook) return null;
      const updatedBook = updater(deepClone(currentBook));
      if (options.markDirty) {
        setIsDirty(true);
      }
      return updatedBook;
    });
  }, []);


  const handleNodeExpansion = useCallback(async (node: Book | Chapter) => {
    const isBook = 'chapters' in node;
    const nodeId = isBook ? (node as Book)._id : (node as Chapter).chapter_id;
    if (!nodeId) return;
  
    // For chapters, just toggle the local expansion state
    if (!isBook) {
      setExpansionState(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
      return;
    }
  
    // For books, fetch details if they haven't been loaded yet
    const bookNode = node as Book;
    const isCurrentlyExpanded = !!expansionState[nodeId];
  
    if (isCurrentlyExpanded) {
      setExpansionState(prev => ({ ...prev, [nodeId]: false }));
      return;
    }
    
    // If chapters are already present, just expand
    if (bookNode.chapters && bookNode.chapters.length > 0) {
      setExpansionState(prev => ({ ...prev, [nodeId]: true }));
      return;
    }

    setIsLoading(true);
    try {
      const fullBook = await curriculumService.fetchBookDetails(bookNode._id);
      
      // Update the book in the main list
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
    const chapter = activeBook?.chapters.find(c => c.pages.some(p => p.page_id === page.page_id));
    const pageFromState = chapter?.pages.find(p => p.page_id === page.page_id);

    if (!pageFromState) {
        setSelectedPage(page);
        return;
    }

    setSelectedPage(pageFromState);

    if (pageFromState.isNew || !activeBook?._id || !pageFromState.page_id || !chapter?.chapter_id) {
        return;
    }

    const areImagesPopulated = pageFromState.images && pageFromState.images.length > 0 && pageFromState.images.every(img => img.thumbnail);
    if (areImagesPopulated) {
        return;
    }

    setIsLoading(true);
    try {
        const fetchedImages = await curriculumService.fetchImagesForPage(activeBook._id, chapter.chapter_id, pageFromState.page_id);
        const pageWithImages = { ...pageFromState, images: fetchedImages };

        setSelectedPage(pageWithImages);
        
        updateActiveBook(book => {
            const chapterToUpdate = book.chapters.find(c => c.chapter_id === chapter!.chapter_id);
            const pageToUpdate = chapterToUpdate?.pages.find(p => p.page_id === pageFromState.page_id);
            if (pageToUpdate) {
                pageToUpdate.images = fetchedImages;
            }
            return book;
        }, { markDirty: false });

    } catch (error) {
        setNotification({ message: `Error fetching images: ${(error as Error).message}`, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  }, [activeBook, updateActiveBook]);

  const addChapter = useCallback(() => {
    if (!activeBook?._id) return;
    const newChapterCount = idCounters.chapter + 1;

    const newChapter: Chapter = {
        chapter_id: `${activeBook._id}-${pad(newChapterCount, 3)}`,
        chapter_number: newChapterCount,
        chapter_name: `New Chapter ${newChapterCount}`,
        pages: [],
        isNew: true,
    };

    updateActiveBook(book => {
        book.chapters.push(newChapter);
        return book;
    });

    setIdCounters(prev => ({ ...prev, chapter: newChapterCount }));
    setExpansionState(prev => ({ ...prev, [activeBook._id]: true, [newChapter.chapter_id!]: true }));
  }, [activeBook, updateActiveBook, idCounters]);

  const deleteChapter = useCallback((chapterId: string) => {
    let shouldClearSelectedPage = false;
    if (selectedPage && activeBook) {
      const chapterOfSelectedPage = activeBook.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
      if (chapterOfSelectedPage && chapterOfSelectedPage.chapter_id === chapterId) {
        shouldClearSelectedPage = true;
      }
    }

    updateActiveBook(book => {
      book.chapters = book.chapters.filter(c => c.chapter_id !== chapterId);
      return book;
    });

    if (shouldClearSelectedPage) {
      setSelectedPage(null);
    }
  }, [activeBook, updateActiveBook, selectedPage]);

  const updateChapterName = useCallback((chapterId: string, newName: string) => {
    updateActiveBook(book => {
        const chapter = book.chapters.find(c => c.chapter_id === chapterId);
        if (chapter) chapter.chapter_name = newName;
        return book;
    });
  }, [updateActiveBook]);

  const addPage = useCallback((chapterId: string) => {
    if (!activeBook?._id) return;
    const newPageCount = idCounters.page + 1;
    
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      if (chapter && chapter.chapter_number) {
        const newPage: Page = {
          page_id: `${book._id}-${pad(chapter.chapter_number, 3)}-${pad(newPageCount, 4)}`,
          page_number: newPageCount,
          title: `New Page ${newPageCount}`,
          images: [],
          isNew: true,
        };
        chapter.pages.push(newPage);
      }
      return book;
    });
    
    setIdCounters(prev => ({ ...prev, page: newPageCount }));
    setExpansionState(prev => ({ ...prev, [chapterId]: true }));
  }, [activeBook, updateActiveBook, idCounters]);

  const deletePage = useCallback((chapterId: string, pageId: string) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      if (chapter) {
        chapter.pages = chapter.pages.filter(p => p.page_id !== pageId);
      }
      return book;
    });

    if (selectedPage && pageId === selectedPage.page_id) {
      setSelectedPage(null);
    }
  }, [updateActiveBook, selectedPage]);
  
  const updatePageTitle = useCallback((chapterId: string, pageId: string, newTitle: string) => {
    let updatedPage: Page | null = null;
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      const page = chapter?.pages.find(p => p.page_id === pageId);
      if (page) {
        page.title = newTitle;
        updatedPage = { ...page };
      }
      return book;
    });

    if (updatedPage && selectedPage && selectedPage.page_id === pageId) {
      setSelectedPage(updatedPage);
    }
  }, [updateActiveBook, selectedPage]);

  const setPageStoryAndMoral = useCallback((pageId: string, story: string, moral: string | undefined) => {
    let wasUpdatedInActiveBook = false;
    
    setActiveBook(currentBook => {
      if (!currentBook) return null;
      
      const newBook = deepClone(currentBook);
      let pageFound = false;

      for (const chapter of newBook.chapters) {
        const page = chapter.pages.find(p => p.page_id === pageId);
        if (page) {
          page.story = story;
          page.moral = moral;
          pageFound = true;
          
          setSelectedPage(currentPage => (currentPage?.page_id === pageId ? { ...page } : currentPage));
          break;
        }
      }
      
      if (pageFound) {
        wasUpdatedInActiveBook = true;
        return newBook;
      }
      return currentBook;
    });
    
    // Also update the main 'books' list to ensure consistency
    setBooks(currentBooks => {
        return currentBooks.map(book => {
            if (book._id !== activeBook?._id) return book;

            const newBook = deepClone(book);
            for (const chapter of newBook.chapters) {
                const page = chapter.pages.find(p => p.page_id === pageId);
                if (page) {
                    page.story = story;
                    page.moral = moral;
                    break;
                }
            }
            return newBook;
        });
    });

    // Only set dirty if the story was successfully added/changed
    if (wasUpdatedInActiveBook) {
        setIsDirty(true);
    }
  }, [activeBook?._id]);

  const generateStoryForPage = useCallback(async (pageId: string, userComments?: string) => {
    if (!activeBook) return;

    let chapterId: string | undefined;
    for (const chapter of activeBook.chapters) {
        if (chapter.pages.some(p => p.page_id === pageId)) {
            chapterId = chapter.chapter_id;
            break;
        }
    }

    if (!chapterId) {
        setNotification({ message: 'Could not find the chapter for this page.', type: 'error' });
        return;
    }

    if (!username) {
        setNotification({ message: 'User information is missing. Cannot generate story.', type: 'error' });
        return;
    }

    setIsStoryLoading(true);
    setNotification(null);
    try {
        const result = await curriculumService.createStory(activeBook._id, chapterId, pageId, userComments);
        setPageStoryAndMoral(pageId, result.story, result.moral);
        setIsDirty(true); // Explicitly set dirty flag after story generation.
        setNotification({ message: 'Story generated successfully!', type: 'success' });
    } catch (error) {
        console.error("Failed to create story:", error);
        setNotification({ message: `Error generating story: ${(error as Error).message}`, type: 'error' });
    } finally {
        setIsStoryLoading(false);
    }
}, [activeBook, setPageStoryAndMoral, username]);
  
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
        updatedPageData = { ...page };
      }
      return book;
    });

    if (updatedPageData) {
      setSelectedPage(updatedPageData);
    }
    setIdCounters(prev => ({ ...prev, image: newImageCount }));
  }, [updateActiveBook, activeBook, selectedPage, idCounters]);
  
  const removeImageFromPage = useCallback((imageHash: string) => {
    if (!selectedPage) return;
    let updatedPageData: Page | null = null;

    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
      const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);
      if (page) {
        page.images = page.images.filter(img => img.image_hash !== imageHash);
        updatedPageData = { ...page };
      }
      return book;
    });

    if (updatedPageData) {
      setSelectedPage(updatedPageData);
    }
  }, [updateActiveBook, selectedPage]);

  const reorderImagesOnPage = useCallback((draggedImageHash: string, targetImageHash: string) => {
    if (!selectedPage || draggedImageHash === targetImageHash) return;
    
    let updatedPageData: Page | null = null;

    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === selectedPage.page_id));
      const page = chapter?.pages.find(p => p.page_id === selectedPage.page_id);

      if (page && page.images) {
        const images = [...page.images];
        const draggedIndex = images.findIndex(img => img.image_hash === draggedImageHash);
        const targetIndex = images.findIndex(img => img.image_hash === targetImageHash);

        if (draggedIndex > -1 && targetIndex > -1) {
          const [draggedItem] = images.splice(draggedIndex, 1);
          images.splice(targetIndex, 0, draggedItem);

          page.images = images.map((img, index) => ({
            ...img,
            position: index + 1,
          }));

          updatedPageData = { ...page };
        }
      }
      return book;
    });

    if (updatedPageData) {
      setSelectedPage(updatedPageData);
    }
  }, [updateActiveBook, selectedPage]);

  const saveBook = useCallback(async () => {
    if (!activeBook) return;
    if (!username) {
        setNotification({ message: 'User information is missing. Cannot save book.', type: 'error' });
        return;
    }
    setIsLoading(true);
    setNotification(null);
    try {
        const payload: BookSavePayload = {
          ...activeBook,
          chapters: activeBook.chapters.map(chapter => {
            const { isNew: chapterIsNew, isEditing: chapterIsEditing, ...chapterToSave } = chapter;
            return {
              ...chapterToSave,
              pages: chapter.pages.map(page => {
                const { isNew: pageIsNew, isEditing: pageIsEditing, ...pageToSave } = page;
                return {
                  ...pageToSave,
                  images: (page.images || []).map(image => {
                    const { isNew: imageIsNew, thumbnail, ...imageToSave } = image;
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
            if (exists) {
                return prev.map(b => (b._id === fullRefreshedBook._id ? fullRefreshedBook : b));
            }
            return [fullRefreshedBook, ...prev.filter(b => b._id !== activeBook._id)];
        });

        setActiveBook(fullRefreshedBook);

        const newExpansionState: Record<string, boolean> = { [fullRefreshedBook._id]: true };
        fullRefreshedBook.chapters.forEach(chapter => {
            if (chapter.chapter_id) newExpansionState[chapter.chapter_id] = true;
        });
        setExpansionState(newExpansionState);

        setIdCounters({
            chapter: fullRefreshedBook.chapter_count || 0,
            page: fullRefreshedBook.page_count || 0,
            image: fullRefreshedBook.image_count || 0,
        });
        setIsDirty(false);
        setSelectedPage(null);
        setNotification({ message: 'Book saved successfully!', type: 'success' });

    } catch (error) {
        console.error("Failed to save book:", error);
        setNotification({ message: `Error saving book: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [activeBook, username]);


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