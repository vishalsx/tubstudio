// src/components/panels/CurriculumPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Book, Chapter, Page } from '../../types';
import { PencilIcon, PlusCircleIcon, TrashIcon, BookOpenIcon, FolderIcon, DocumentIcon, CloudArrowUpIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useConfirmation } from '../../contexts/ConfirmationContext';

interface CurriculumPanelProps {
  books: Book[];
  activeBook: Book | null;
  isDirty: boolean;
  isLoading: boolean;
  expansionState: Record<string, boolean>;
  searchAttempted: boolean;
  onSelectBook: (bookId: string) => void;
  onSelectPage: (page: Page) => void;
  onSelectNode: (node: any) => void;
  onOpenCreateBookModal: () => void;
  onSaveBook: () => void;
  onNodeExpansion: (node: Book | Chapter) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onUpdateChapterName: (chapterId: string, newName: string) => void;
  onAddPage: (chapterId: string) => void;
  onDeletePage: (chapterId: string, pageId: string) => void;
  onUpdatePageTitle: (chapterId: string, pageId: string, newTitle: string) => void;
}

// FIX: Include 'activeBook' in TreeNodeProps by removing it from Omit. This resolves a TypeScript error as 'props.activeBook' is used to determine if a book node has unsaved changes.
interface TreeNodeProps extends Omit<CurriculumPanelProps, 'books' | 'searchAttempted' | 'onOpenCreateBookModal'> {
  node: Book | Chapter | Page;
  type: 'book' | 'chapter' | 'page';
  level: number;
  isExpanded: boolean;
  parentChapter?: Chapter;
}

const TreeNode: React.FC<TreeNodeProps> = (props) => {
  const { node, type, level, isExpanded, expansionState, isDirty, onSelectNode, onSelectPage, 
    onSaveBook, onNodeExpansion, onAddChapter, onDeleteChapter, onUpdateChapterName, 
    onAddPage, onDeletePage, onUpdatePageTitle, parentChapter, onSelectBook } = props;

  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmation();

  const nodeAsAny = node as any;
  const id = nodeAsAny._id || nodeAsAny.chapter_id || nodeAsAny.page_id;
  const name = nodeAsAny.title || nodeAsAny.chapter_name || `Page ${nodeAsAny.page_number}`;

  const [editValue, setEditValue] = useState(name);

  useEffect(() => { setEditValue(name); }, [name]);
  useEffect(() => { if (isEditingName) inputRef.current?.focus(); }, [isEditingName]);

  const handleCommit = () => {
    if (isEditingName) {
      if (type === 'book') console.warn('Book title editing not implemented through this handler yet');
      if (type === 'chapter' && nodeAsAny.chapter_id) onUpdateChapterName(nodeAsAny.chapter_id, editValue);
      if (type === 'page' && nodeAsAny.page_id) {
        if (parentChapter && parentChapter.chapter_id) onUpdatePageTitle(parentChapter.chapter_id, nodeAsAny.page_id, editValue);
      }
      setIsEditingName(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCommit();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  const handleNodeClick = () => {
    if (isEditingName) return;
    
    // When a book node is clicked, it should trigger the detail fetch
    if (type === 'book') {
        onSelectBook((node as Book)._id);
    }
    
    onSelectNode(node);
    if (type === 'page') onSelectPage(node as Page);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'book') onAddChapter();
    if (type === 'chapter') onAddPage(nodeAsAny.chapter_id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: `Delete ${type}`,
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      isDestructive: true,
    });

    if (confirmed) {
      if (type === 'book') console.warn('Delete book not implemented');
      if (type === 'chapter') onDeleteChapter(nodeAsAny.chapter_id);
      if (type === 'page' && parentChapter && parentChapter.chapter_id) {
          onDeletePage(parentChapter.chapter_id, nodeAsAny.page_id);
      }
    }
  };

  const children = (node as Book).chapters || (node as Chapter).pages;
  const hasChildren = type !== 'page' && children && children.length > 0;
  const canExpand = type !== 'page'; // Books and Chapters can be expanded
  
  const icon = type === 'book' ? <BookOpenIcon className="w-5 h-5 text-blue-600" /> :
             type === 'chapter' ? <FolderIcon className="w-5 h-5 text-yellow-600" /> :
             <DocumentIcon className="w-5 h-5 text-gray-600" />;

  return (
    <div className="text-sm">
      <div 
        className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-100 group cursor-pointer"
        style={{ paddingLeft: `${level * 1.25}rem` }}
        onClick={handleNodeClick}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          {canExpand && (
            <button onClick={(e) => { e.stopPropagation(); onNodeExpansion(node as Book | Chapter); }} className="p-0.5 rounded-sm hover:bg-gray-200">
              {isExpanded ? <MinusIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
            </button>
          )}
        </div>
        {icon}
        <span className="flex-1 truncate flex items-center">
          {isEditingName ? (
            <input
              ref={inputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleCommit} onKeyDown={handleKeyDown} onClick={e => e.stopPropagation()}
              className="w-full bg-white border border-blue-400 rounded px-1 -my-0.5 text-sm"
            />
          ) : name}
          {type === 'book' && isDirty && (node as Book)._id === props.activeBook?._id && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" title="Unsaved changes"></div>}
        </span>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
          {type === 'book' && <button onClick={(e) => {e.stopPropagation(); onSaveBook()}} title={isDirty ? "Save Book" : "No changes"} disabled={!isDirty} className="p-1 rounded text-gray-500 hover:bg-blue-100 disabled:text-gray-300"><CloudArrowUpIcon className="w-4 h-4" /></button>}
          {type !== 'page' && <button onClick={handleAdd} title={`Add ${type === 'book' ? 'Chapter' : 'Page'}`} className="p-1 rounded text-gray-500 hover:bg-green-100"><PlusCircleIcon className="w-4 h-4" /></button>}
          {(type === 'chapter' || type === 'page') && <button onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }} title="Edit" className="p-1 rounded text-gray-500 hover:bg-yellow-100"><PencilIcon className="w-4 h-4" /></button>}
          {(type === 'chapter' || type === 'page') && <button onClick={handleDelete} title="Delete" className="p-1 rounded text-gray-500 hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button>}
        </div>
      </div>
      {isExpanded && children && children.map((child: Chapter | Page) => {
        const childId = (child as any).chapter_id || (child as any).page_id;
        const childIsChapter = 'pages' in child;
        return (
          <TreeNode
            {...props}
            key={childId}
            node={child}
            parentChapter={type === 'book' ? child as Chapter : parentChapter}
            type={childIsChapter ? 'chapter' : 'page'}
            level={level + 1}
            isExpanded={!!expansionState[childId]}
          />
        )
      })}
    </div>
  );
};


export const CurriculumPanel: React.FC<CurriculumPanelProps> = (props) => {
  const { books, isLoading, onSelectBook, onOpenCreateBookModal, isDirty, searchAttempted } = props;
  const confirm = useConfirmation();

  const handleBookSelect = async (bookId: string) => {
    if (isDirty) {
      const userConfirmed = await confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes that will be lost. Are you sure you want to switch books?',
        confirmText: 'Switch Anyway',
        isDestructive: true,
      });
      if (!userConfirmed) {
        return;
      }
    }
    onSelectBook(bookId);
  };

  const renderContent = () => {
    if (isLoading && books.length === 0) {
        return <div className="flex items-center justify-center h-full"><LoadingSpinner text="Searching for books..." /></div>;
    }

    if (books.length > 0) {
        return books.map(book => {
            const bookNodeId = book._id;
            return (
                <TreeNode 
                    {...props}
                    key={bookNodeId} 
                    node={book} 
                    type="book" 
                    level={0} 
                    isExpanded={!!props.expansionState[bookNodeId]}
                    onSelectBook={handleBookSelect} // Pass the handler for book-specific clicks
                />
            );
        });
    }

    if (searchAttempted) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-gray-500 italic">
                No books found for your search.
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full text-sm text-gray-500 italic">
            Search for a book or create a new one.
        </div>
    );
};


  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="font-medium text-gray-700">Curriculum</h3>
        <button onClick={onOpenCreateBookModal} className="text-xs flex items-center text-gray-500 hover:text-green-600">
          <PlusCircleIcon className="w-4 h-4 mr-1" /> Add Book
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {renderContent()}
      </div>
    </div>
  );
};
