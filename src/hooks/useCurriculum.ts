// hooks/useCurriculum.ts
import { useState, useCallback } from 'react';
import { Book, Chapter, Page } from '../types';

// Mock thumbnail (a simple 1x1 grey pixel)
const MOCK_THUMBNAIL = 'R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

const MOCK_BOOKS: Book[] = [
  {
    _id: 'book-1',
    title: 'Grade 5 Science',
    author: 'EduPublish Inc.',
    gradeLevel: '5',
    chapters: [
      {
        _id: 'chapter-1-1',
        chapterNumber: 1,
        title: 'The Solar System',
        pages: [
          {
            _id: 'page-1-1-1',
            pageNumber: 1,
            images: [
              { objectId: 'solar-system-img-1', thumbnail: MOCK_THUMBNAIL, objectName: 'The Sun' },
              { objectId: 'solar-system-img-2', thumbnail: MOCK_THUMBNAIL, objectName: 'Planet Earth' },
            ],
          },
          {
            _id: 'page-1-1-2',
            pageNumber: 2,
            images: [
              { objectId: 'solar-system-img-3', thumbnail: MOCK_THUMBNAIL, objectName: 'Mars' },
            ],
          },
        ],
      },
      {
        _id: 'chapter-1-2',
        chapterNumber: 2,
        title: 'Living Organisms',
        pages: [
          {
            _id: 'page-1-2-1',
            pageNumber: 3,
            images: [
              { objectId: 'organisms-img-1', thumbnail: MOCK_THUMBNAIL, objectName: 'Plant Cell' },
              { objectId: 'organisms-img-2', thumbnail: MOCK_THUMBNAIL, objectName: 'Animal Cell' },
              { objectId: 'organisms-img-3', thumbnail: MOCK_THUMBNAIL, objectName: 'Fungi' },
            ],
          },
        ],
      },
    ],
  },
  {
    _id: 'book-2',
    title: 'World History',
    author: 'History Press',
    gradeLevel: '6',
    chapters: [
      {
        _id: 'chapter-2-1',
        chapterNumber: 1,
        title: 'Ancient Egypt',
        pages: [
          {
            _id: 'page-2-1-1',
            pageNumber: 1,
            images: [
                { objectId: 'egypt-img-1', thumbnail: MOCK_THUMBNAIL, objectName: 'Pyramids of Giza' },
            ],
          },
        ],
      },
    ],
  },
];

export const useCurriculum = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Active selection state
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activePage, setActivePage] = useState<Page | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setBooks(MOCK_BOOKS);
    setIsLoading(false);
  }, []);

  const selectBook = useCallback((bookId: string | null) => {
    const book = books.find(b => b._id === bookId) || null;
    setActiveBook(book);
    setActiveChapter(null); // Reset chapter and page when book changes
    setActivePage(null);
  }, [books]);

  const selectChapter = useCallback((chapterId: string | null) => {
    const chapter = activeBook?.chapters.find(c => c._id === chapterId) || null;
    setActiveChapter(chapter);
    setActivePage(null); // Reset page when chapter changes
  }, [activeBook]);

  const selectPage = useCallback((pageId: string | null) => {
    const page = activeChapter?.pages.find(p => p._id === pageId) || null;
    setActivePage(page);
  }, [activeChapter]);
  
  const resetSelection = useCallback(() => {
    setActiveBook(null);
    setActiveChapter(null);
    setActivePage(null);
  }, []);

  return {
    books,
    isLoading,
    activeBook,
    activeChapter,
    activePage,
    fetchBooks,
    selectBook,
    selectChapter,
    selectPage,
    resetSelection,
  };
};