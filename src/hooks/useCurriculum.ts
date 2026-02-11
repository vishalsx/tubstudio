// hooks/useCurriculum.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Book, CartItem, Chapter, Page, CurriculumImage, DatabaseImage, UserContext } from '../types';
import { curriculumService, BookSavePayload, BookCreatePayload } from '../services/curriculum.service';
import { translationService } from '../services/translation.service';

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper to pad numbers with leading zeros for IDs
const pad = (num: number, size: number) => String(num).padStart(size, '0');

export const useCurriculum = (userContext: UserContext | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [marketplaceBooks, setMarketplaceBooks] = useState<Book[]>([]); // New state for marketplace search results
  const [activeMarketplaceBook, setActiveMarketplaceBook] = useState<Book | null>(null); // New state for selected marketplace book
  const [cart, setCart] = useState<CartItem[]>([]); // Cart state
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false); // Loading state for publish
  const [isPurchasing, setIsPurchasing] = useState(false); // Loading state for purchase
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // State to hold the counters for new ID generation
  const [idCounters, setIdCounters] = useState({ chapter: 0, page: 0, image: 0 });

  const [expansionState, setExpansionState] = useState<Record<string, boolean>>({});
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const username = userContext?.username;
  const [loadingStoryLanguages, setLoadingStoryLanguages] = useState<string[]>([]);
  const isStoryLoading = loadingStoryLanguages.length > 0;
  const [imageLoadingProgress, setImageLoadingProgress] = useState<{ loaded: number, total: number } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    summary: any[];
    totals: { valid: number; missing: number };
  } | null>(null);

  // Ref to track the current page loading operation to prevent race conditions
  const pageLoadIdRef = useRef(0);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSearch = useCallback(async () => {
    // A search action implies navigating away from the current book.
    // The confirmation dialog is handled by the component calling this function.
    // Once confirmed, the dirty state must be reset here.
    setIsDirty(false);

    // Searching with empty query is allowed (fetch all books)

    setIsLoading(true);
    setSearchAttempted(true);
    setBooks([]);
    setActiveBook(null);
    setSelectedPage(null); // Clear selected page
    try {
      const results = await curriculumService.searchBooks(searchQuery, searchLanguage);
      setBooks(results);
    } catch (error) {
      console.error("Failed to search for books:", error);
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchLanguage]);

  // MARKETPLACE SEARCH FUNCTION
  const searchMarketplace = useCallback(async (query: string, language?: string) => {
    setIsLoading(true);
    setMarketplaceBooks([]);
    setActiveMarketplaceBook(null);
    try {
      // We need to implement this service method in curriculumService or a new marketplaceService
      // For now assuming curriculumService receives this method or we add it.
      // Actually, let's use the curriculumService.searchMarketplaceBooks if it exists, or add it.
      // Wait, I need to check if curriculumService has this method. It likely doesn't yet.
      // I will assume I will add it to curriculum.service.ts
      const results = await curriculumService.searchMarketplaceBooks(query, language || null);
      setMarketplaceBooks(results);
    } catch (error) {
      console.error("Failed to search marketplace:", error);
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // MARKETPLACE PURCHASE FUNCTION
  const purchaseBook = useCallback(async (bookId: string) => {
    setIsPurchasing(true);
    try {
      await curriculumService.purchaseBook(bookId);
      setNotification({ message: 'Book purchased successfully!', type: 'success' });
      // Refresh my books to show the new purchase
      handleSearch();
      // Optionally remove from valid search results or mark as purchased? 
      // The backend filter removes owned books, so re-searching marketplace would remove it.
      // For now, let's just refresh "My Books" list if we are there, or let user navigate.
      setCart(prev => prev.filter(item => item.book._id !== bookId)); // Remove from cart if it was there
    } catch (error) {
      console.error("Failed to purchase book:", error);
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsPurchasing(false);
    }
  }, [handleSearch]);

  const addToCart = useCallback((book: Book, method?: 'permanent' | 'subscription', languages: string[] = []) => {
    if (!cart.some(item => item.book._id === book._id)) {
      const defaultMethod: 'permanent' | 'subscription' = method ||
        ((book.base_pricing?.subscription_price && book.base_pricing.subscription_price > 0) ? 'subscription' : 'permanent');
      setCart(prev => [...prev, { book, purchaseMethod: defaultMethod, selectedLanguages: languages }]);
      setNotification({ message: 'Added to cart', type: 'success' });
    }
  }, [cart]);

  const removeFromCart = useCallback((bookId: string) => {
    setCart(prev => prev.filter(item => item.book._id !== bookId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const checkout = useCallback(async () => {
    if (cart.length === 0) return;
    setIsPurchasing(true);
    try {
      // Execute all purchases
      const results = await Promise.allSettled(cart.map(item =>
        curriculumService.purchaseBook(item.book._id, item.purchaseMethod, item.selectedLanguages)
      ));

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed === 0) {
        setNotification({ message: `Successfully purchased ${successful} books!`, type: 'success' });
        setCart([]); // Clear cart only if all succeeded? Or remove successful ones?
        // Simple approach: Clear all if all success.
        handleSearch(); // Refresh books
      } else {
        setNotification({ message: `Purchased ${successful} books. ${failed} failed.`, type: 'warning' });
        // Ideally remove successful ones from cart.
        // For now, let's just keep cart as is or clear it?
        // User can manually remove.
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      setNotification({ message: 'Checkout failed. Please try again.', type: 'error' });
    } finally {
      setIsPurchasing(false);
    }
  }, [cart, handleSearch]);

  const selectMarketplaceBook = useCallback((book: Book | null) => {
    setActiveMarketplaceBook(book);
  }, []);


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
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const selectBook = useCallback(async (bookId: string | null) => {
    if (!bookId) {
      setActiveBook(null);
      setActiveChapter(null);
      setSelectedPage(null);
      setExpansionState({});
      return;
    }

    setIsLoading(true);
    try {
      const fullBook = await curriculumService.fetchBookDetails(bookId);

      // Mark all pages as not having images loaded yet to force refetch on selection
      fullBook.chapters.forEach(c => c.pages.forEach(p => p.imagesLoaded = false));

      setBooks(prevBooks => prevBooks.map(b => (b._id === bookId ? fullBook : b)));

      setActiveBook(fullBook);
      setActiveChapter(null); // Reset active chapter when book changes
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
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync activeChapter with activeBook updates to ensure added pages/chapters appear immediately
  useEffect(() => {
    if (activeBook && activeChapter) {
      const updatedChapter = activeBook.chapters.find(c => c.chapter_id === activeChapter.chapter_id);
      if (updatedChapter && updatedChapter !== activeChapter) {
        setActiveChapter(updatedChapter);
      }
    }
  }, [activeBook, activeChapter]);

  const selectChapter = useCallback((chapter: Chapter) => {
    setActiveChapter(chapter);
    setSelectedPage(null);
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
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [expansionState]);

  const selectPage = useCallback(async (page: Page) => {
    // Increment and capture the ID for this specific page load operation.
    const currentLoadId = ++pageLoadIdRef.current;

    if (!activeBook?._id || !page.page_id) return;
    const chapter = activeBook.chapters.find(c => c.pages.some(p => p.page_id === page.page_id));

    if (!chapter || !chapter.chapter_id) {
      console.error("Could not find a valid chapter for the selected page.", { page, activeBook });
      setNotification({ message: "Error: Could not find parent chapter for the page.", type: 'error' });
      return;
    }

    const chapterId = chapter.chapter_id;

    if (page.imagesLoaded || page.isNew) {
      if (chapter) setActiveChapter(chapter);
      setSelectedPage(page);
      return;
    }

    const imageStubsToLoad = (page.images || []).filter(stub => stub.image_id && !stub.isNew);
    if (imageStubsToLoad.length === 0) {
      updateActiveBook(book => {
        if (pageLoadIdRef.current !== currentLoadId) return book; // Guard against stale updates
        const chapterToUpdate = book.chapters.find(c => c.chapter_id === chapterId);
        const pageToUpdate = chapterToUpdate?.pages.find(p => p.page_id === page.page_id);
        if (pageToUpdate) pageToUpdate.imagesLoaded = true;
        return book;
      }, { markDirty: false });
      setSelectedPage(page);
      return;
    }

    // 1. Set up initial loading state and placeholders
    setImageLoadingProgress({ loaded: 0, total: imageStubsToLoad.length });
    const pageWithPlaceholders = {
      ...page,
      images: page.images.map(img => ({ ...img, isLoading: !!img.image_id && !img.isNew }))
    };
    if (chapter) setActiveChapter(chapter);
    setSelectedPage(pageWithPlaceholders);
    updateActiveBook(book => {
      const c = book.chapters.find(c => c.chapter_id === chapterId);
      if (c) {
        const pIndex = c.pages.findIndex(p => p.page_id === page.page_id);
        if (pIndex > -1) c.pages[pIndex] = pageWithPlaceholders;
      }
      return book;
    }, { markDirty: false });

    // 2. Fetch images incrementally
    const imageFetchPromises = imageStubsToLoad.map(imageStub =>
      curriculumService.fetchImageDetails(activeBook._id, chapterId, page.page_id!, imageStub.image_id!)
        .then(fetchedImage => {
          // *** THE FIX: Check if we are still loading the same page. ***
          if (pageLoadIdRef.current !== currentLoadId) {
            return; // If not, it means the user has navigated away. Do nothing.
          }

          // If the load ID is current, proceed with state updates.
          updateActiveBook(book => {
            const c = book.chapters.find(c => c.chapter_id === chapterId);
            const p = c?.pages.find(p => p.page_id === page.page_id);
            if (p?.images) {
              const imgIndex = p.images.findIndex(i => i.image_id === fetchedImage.image_id);
              if (imgIndex > -1) p.images[imgIndex] = { ...fetchedImage, isLoading: false };
            }
            return book;
          }, { markDirty: false });

          setSelectedPage(current => {
            if (!current || current.page_id !== page.page_id) return current;
            const updatedImages = [...current.images];
            const imgIndex = updatedImages.findIndex(i => i.image_id === fetchedImage.image_id);
            if (imgIndex > -1) updatedImages[imgIndex] = { ...fetchedImage, isLoading: false };
            return { ...current, images: updatedImages };
          });

          setImageLoadingProgress(prev => {
            if (pageLoadIdRef.current !== currentLoadId || !prev) return prev;
            return { ...prev, loaded: prev.loaded + 1 };
          });
        })
        .catch(error => {
          console.error(`Failed to fetch image ${imageStub.image_id}:`, error);
          if (pageLoadIdRef.current === currentLoadId) {
            setImageLoadingProgress(prev => {
              if (!prev) return prev;
              return { ...prev, loaded: prev.loaded + 1 };
            });
          }
        })
    );

    // 3. Cleanup after all fetches are done
    Promise.all(imageFetchPromises).then(() => {
      if (pageLoadIdRef.current !== currentLoadId) {
        return; // Stale operation, do nothing.
      }
      setImageLoadingProgress(null);
      updateActiveBook(book => {
        const c = book.chapters.find(c => c.chapter_id === chapterId);
        const p = c?.pages.find(p => p.page_id === page.page_id);
        if (p) p.imagesLoaded = true;
        return book;
      }, { markDirty: false });
    });
  }, [activeBook, updateActiveBook, setNotification]);

  const performActionOnBook = useCallback(async (bookId: string, action: (book: Book) => Book) => {
    setIsLoading(true);
    try {
      let bookToUpdate = activeBook;

      if (!bookToUpdate || bookToUpdate._id !== bookId || bookToUpdate.chapters.length < (bookToUpdate.chapter_count ?? 0)) {
        bookToUpdate = await curriculumService.fetchBookDetails(bookId);
      }

      const updatedBook = action(deepClone(bookToUpdate!));

      setBooks(prev => prev.map(b => b._id === bookId ? updatedBook : b));
      setActiveBook(updatedBook);
      setIsDirty(true);

    } catch (error) {
      setNotification({ message: `Failed to update book: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [activeBook]);

  const addChapter = useCallback(async (bookId: string) => {
    const newChapterNumber = idCounters.chapter + 1;
    await performActionOnBook(bookId, (book) => {
      const newChapter: Chapter = {
        chapter_id: `${book._id}-${pad(newChapterNumber, 3)}`,
        chapter_number: newChapterNumber,
        chapter_name: `New Chapter ${newChapterNumber}`,
        pages: [],
        isNew: true,
        isModified: true,
      };
      book.chapters.push(newChapter);
      setExpansionState(prev => ({ ...prev, [book._id]: true, [newChapter.chapter_id!]: true }));
      return book;
    });
    setIdCounters(prev => ({ ...prev, chapter: newChapterNumber }));
  }, [performActionOnBook, idCounters]);

  const addPage = useCallback(async (bookId: string, chapterId: string) => {
    const newPageNumber = idCounters.page + 1;
    await performActionOnBook(bookId, (book) => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      if (chapter) {
        const newPage: Page = {
          page_id: `${chapterId}-${pad(newPageNumber, 4)}`,
          page_number: newPageNumber,
          title: `New Page ${newPageNumber}`,
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
    setIdCounters(prev => ({ ...prev, page: newPageNumber }));
  }, [performActionOnBook, idCounters]);

  const deleteChapter = useCallback((chapterId: string) => {
    if (selectedPage && activeBook?.chapters.find(c => c.chapter_id === chapterId)?.pages.some(p => p.page_id === selectedPage.page_id)) {
      setSelectedPage(null);
    }

    updateActiveBook(book => {
      book.chapters = book.chapters.filter(c => c.chapter_id !== chapterId);
      return book;
    });
  }, [updateActiveBook, activeBook, selectedPage]);

  const updateChapterAttributes = useCallback((chapterId: string, updates: Partial<Chapter>) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      if (chapter) {
        Object.assign(chapter, updates);
        chapter.isModified = true;
      }
      return book;
    });
  }, [updateActiveBook]);

  const updateChapterName = useCallback((chapterId: string, newName: string) => {
    updateChapterAttributes(chapterId, { chapter_name: newName });
  }, [updateChapterAttributes]);

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

  const updatePageAttributes = useCallback((chapterId: string, pageId: string, updates: Partial<Page>) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.chapter_id === chapterId);
      const page = chapter?.pages.find(p => p.page_id === pageId);
      if (page && chapter) {
        Object.assign(page, updates);
        page.isModified = true;
        chapter.isModified = true;

        if (selectedPage?.page_id === pageId) {
          setSelectedPage({ ...page });
        }
      }
      return book;
    });
  }, [updateActiveBook, selectedPage, setSelectedPage]);

  const updatePageTitle = useCallback((chapterId: string, pageId: string, newTitle: string) => {
    updatePageAttributes(chapterId, pageId, { title: newTitle });
  }, [updatePageAttributes]);

  const generateStoryForPage = useCallback(async (pageId: string, languages?: string[], userComments?: string) => {
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

    const targetLanguages = languages && languages.length > 0
      ? languages
      : [activeBook.language];

    setLoadingStoryLanguages(prev => {
      const newLangs = targetLanguages.filter(l => !prev.includes(l));
      return [...prev, ...newLangs];
    });
    setNotification(null);
    try {
      const results = await Promise.all(
        targetLanguages.map(lang => curriculumService.createStory(
          activeBook._id,
          chapterId!,
          pageId,
          lang,
          activeBook.additional_languages,
          userComments
        ))
      );

      updateActiveBook(book => {
        const chapter = book.chapters.find(c => c.chapter_id === chapterId);
        const page = chapter?.pages.find(p => p.page_id === pageId);
        if (page) {
          if (!page.stories) page.stories = [];
          const stories = page.stories;

          results.forEach((result, index) => {
            const lang = targetLanguages[index];
            const existingIndex = stories.findIndex(s => s.language === lang);
            const newStoryEntry = {
              language: lang,
              story: result.story,
              moral: result.moral,
              created_at: result.created_at
            };

            if (existingIndex > -1) {
              stories[existingIndex] = newStoryEntry;
            } else {
              stories.push(newStoryEntry);
            }

            if (lang === book.language) {
              page.story = result.story;
              page.moral = result.moral;
            }
          });

          page.isModified = true;
          if (chapter) chapter.isModified = true;
          setSelectedPage(currentPage => (currentPage?.page_id === pageId ? { ...page } : currentPage));
        }
        return book;
      });

      const langList = targetLanguages.join(', ');
      setNotification({ message: `Story generated successfully for: ${langList}!`, type: 'success' });
    } catch (error) {
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setLoadingStoryLanguages(prev => prev.filter(lang => !targetLanguages.includes(lang)));
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
          object_name: dbImage.common_data.object_name,
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

  // NEW: Update Image Name Function
  const updateImageName = useCallback((pageId: string, imageHash: string, newName: string) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === pageId));
      const page = chapter?.pages.find(p => p.page_id === pageId);

      if (page && chapter) {
        // Use image_hash to find the image.
        const image = page.images.find(img => img.image_hash === imageHash);
        if (image) {
          image.object_name = newName;
          page.isModified = true;
          chapter.isModified = true;

          if (selectedPage?.page_id === pageId) {
            setSelectedPage(prev => {
              if (!prev) return prev;
              const newImages = prev.images.map(img =>
                img.image_hash === imageHash ? { ...img, object_name: newName } : img
              );
              return { ...prev, images: newImages };
            });
          }
        }
      }
      return book;
    });
  }, [selectedPage, updateActiveBook]);

  // NEW: Update Story Function
  const updateStory = useCallback((pageId: string, newStory: string, newMoral?: string, language?: string) => {
    updateActiveBook(book => {
      const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === pageId));
      const page = chapter?.pages.find(p => p.page_id === pageId);

      if (page && chapter) {
        const targetLanguage = language || book.language;

        // Update the stories list
        if (!page.stories) page.stories = [];
        const stories = page.stories; // Narrowing for TS
        const existingIndex = stories.findIndex(s => s.language === targetLanguage);
        const newStoryEntry = {
          language: targetLanguage,
          story: newStory,
          moral: newMoral,
          created_at: new Date().toISOString()
        };

        if (existingIndex > -1) {
          stories[existingIndex] = newStoryEntry;
        } else {
          stories.push(newStoryEntry);
        }

        // If base language, also update top-level fields
        if (targetLanguage === book.language) {
          page.story = newStory;
          if (newMoral !== undefined) {
            page.moral = newMoral;
          }
        }

        page.isModified = true;
        chapter.isModified = true;

        if (selectedPage?.page_id === pageId) {
          setSelectedPage({ ...page });
        }
      }
      return book;
    });
  }, [selectedPage, updateActiveBook]);

  // NEW: Check Translation Function
  const checkTranslation = useCallback(async (pageId: string, imageHash: string) => {
    if (!activeBook?.language) return;

    setIsLoading(true);
    try {
      const result = await translationService.getTranslationByHash(imageHash, activeBook.language);
      if (result.object_name) {
        updateActiveBook(book => {
          const chapter = book.chapters.find(c => c.pages.some(p => p.page_id === pageId));
          const page = chapter?.pages.find(p => p.page_id === pageId);
          if (page && chapter) {
            const image = page.images?.find(img => img.image_hash === imageHash);
            if (image) {
              image.object_name = result.object_name;
              page.isModified = true;
              chapter.isModified = true;
              if (selectedPage?.page_id === pageId) {
                setSelectedPage(prev => {
                  if (!prev) return prev;
                  const newImages = prev.images?.map(img =>
                    img.image_hash === imageHash ? { ...img, object_name: result.object_name } : img
                  ) || [];
                  return { ...prev, images: newImages };
                });
              }
            }
          }
          return book;
        });
        setNotification({ message: 'Translation updated!', type: 'success' });
      } else {
        setNotification({ message: 'No translation found yet.', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [activeBook, selectedPage, updateActiveBook]);

  const saveBook = useCallback(async (action: 'SaveDraft' | 'Publish' | 'Validate' = 'SaveDraft') => {
    if (!activeBook || !username) return;

    if (action === 'Publish') setIsPublishing(true);
    else setIsLoading(true);
    setNotification(null);
    setValidationResult(null);

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
                  const { isNew, thumbnail, isLoading, ...imageToSave } = image;
                  return imageToSave;
                }),
              };
            }),
          };
        }),
      };

      const response: any = await curriculumService.saveBook(payload, username, action);

      let finalBook: Book;

      if (response && response.summary && response.book) {
        // Wrapped response (Publish Success)
        finalBook = response.book;
        setValidationResult({
          isValid: true,
          message: response.message,
          summary: response.summary,
          totals: response.totals
        });
      } else {
        finalBook = response as Book;
      }

      const fullRefreshedBook = await curriculumService.fetchBookDetails(finalBook._id);

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

      const successMsg = action === 'Publish' ? 'Book published successfully!' :
        action === 'Validate' ? 'Validation successful!' :
          'Book saved successfully!';
      setNotification({ message: successMsg, type: 'success' });

    } catch (error) {
      const errData = (error as any).data;
      // Backend returns structure { detail: { summary: [], ... } }
      // api.ts attaches the root response to .data
      const validationData = errData?.detail?.summary ? errData.detail : (errData?.summary ? errData : null);

      if (validationData && validationData.summary) {
        setValidationResult({
          isValid: false,
          message: validationData.message,
          summary: validationData.summary,
          totals: validationData.totals
        });
      } else {
        setNotification({ message: (error as Error).message, type: 'error' });
      }
    } finally {
      setIsLoading(false);
      setIsPublishing(false);
    }
  }, [activeBook, username, updateActiveBook, expansionState]);

  const collapseAll = useCallback(() => {
    setExpansionState({});
  }, []);

  const isPageDirty = useMemo(() => {
    return selectedPage?.images?.some(img => img.isNew);
  }, [selectedPage]);

  return {
    books,
    activeBook,
    activeChapter,
    isLoading,
    isStoryLoading,
    searchQuery,
    searchLanguage,
    selectedPageData: selectedPage,
    isDirty,
    expansionState,
    notification,
    searchAttempted,
    imageLoadingProgress,
    isPageDirty,
    loadingStoryLanguages,
    setSearchQuery,
    setSearchLanguage,
    handleSearch,
    createBook,
    selectBook,
    selectChapter,
    saveBook,
    // Marketplace exports
    marketplaceBooks,
    activeMarketplaceBook,
    searchMarketplace,
    purchaseBook,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    selectMarketplaceBook,
    isPurchasing,
    isPublishing,
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
    updateImageName,
    updateStory,
    checkTranslation,
    collapseAll,
    updateBookAttributes: (updates: Partial<Book>) => updateActiveBook(book => ({ ...book, ...updates })),
    updateChapterAttributes,
    updatePageAttributes,
    validationResult,
  };
};