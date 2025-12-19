// src/components/curriculum/CreateBookModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Book } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

type BookCreateData = Omit<Book, '_id' | 'chapters' | 'chapter_count' | 'page_count' | 'image_count' | 'created_at' | 'updated_at'>;

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (bookData: BookCreateData) => Promise<void>;
  languageOptions: string[];
}

export const CreateBookModal: React.FC<CreateBookModalProps> = ({ isOpen, onClose, onCreate, languageOptions }) => {
  const [formData, setFormData] = useState<Omit<BookCreateData, 'tags'>>({
    title: '', language: '', author: '', subject: '', education_board: '', grade_level: '',
  });
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        language: languageOptions.length > 0 ? languageOptions[0] : '',
        author: '',
        subject: '',
        education_board: '',
        grade_level: ''
      });
      setTagsInput('');
      setIsSubmitting(false);
    }
  }, [isOpen, languageOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).some(val => !val.trim())) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      const bookData: BookCreateData = { ...formData, tags };
      await onCreate(bookData);
      onClose();
    } catch (error) {
      console.error('Error creating book:', error);
      alert('Failed to create book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-panel)] bg-panel-texture rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-[var(--border-main)]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-panel)] rounded-t-lg">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Create New Book</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] transition-colors" disabled={isSubmitting}><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {[
            { name: 'title', placeholder: 'e.g., Biology Grade 10' },
            { name: 'author', placeholder: 'e.g., John Smith' },
            { name: 'subject', placeholder: 'e.g., Biology' },
            { name: 'education_board', placeholder: 'e.g., CBSE' },
            { name: 'grade_level', placeholder: 'e.g., 10' },
          ].map(field => (
            <div key={field.name} className="space-y-1">
              <label htmlFor={field.name} className="block text-sm font-medium text-[var(--text-main)] capitalize">
                {field.name.replace('_', ' ')} <span className="text-red-500">*</span>
              </label>
              <input type="text" name={field.name} id={field.name} value={formData[field.name as keyof typeof formData]} onChange={handleChange} required disabled={isSubmitting} placeholder={field.placeholder} className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)] sm:text-sm disabled:opacity-50 transition-colors" />
            </div>
          ))}
          <div className="space-y-1">
            <label htmlFor="language" className="block text-sm font-medium text-[var(--text-main)]">Language <span className="text-red-500">*</span></label>
            <select
              name="language"
              id="language"
              value={formData.language}
              onChange={handleChange}
              required
              disabled={isSubmitting || languageOptions.length === 0}
              className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)] sm:text-sm disabled:opacity-50 transition-colors"
            >
              {languageOptions.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="tags" className="block text-sm font-medium text-[var(--text-main)]">Tags</label>
            <input type="text" name="tags" id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} disabled={isSubmitting} placeholder="e.g., science, biology" className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)] sm:text-sm disabled:opacity-50 transition-colors" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Separate tags with commas</p>
          </div>
        </form>
        <div className="p-4 border-t border-[var(--border-main)] flex justify-end items-center space-x-3 bg-[var(--bg-input)] rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-[var(--bg-panel)] text-[var(--text-main)] rounded-md hover:bg-[var(--bg-input)] border border-[var(--border-main)] transition-colors" disabled={isSubmitting}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center shadow-md transition-all active:scale-95">
            {isSubmitting ? <><LoadingSpinner size="sm" color="white" className="mr-2" /> Creating...</> : 'Create Book'}
          </button>
        </div>
      </div>
    </div>
  );
};