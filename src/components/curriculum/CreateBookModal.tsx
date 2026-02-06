// src/components/curriculum/CreateBookModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';
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
    title: '',
    language: '',
    additional_languages: [],
    author: '',
    subject: '',
    education_board: '',
    grade_level: '',
    front_cover_image: '',
    is_public: false,
    is_commercial: false,
    base_pricing: {
      is_free: true,
      one_time_purchase_price: 0,
      subscription_price: 0,
      subscription_period_days: 30,
      additional_language_prices: {}
    }
  });
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        language: languageOptions.length > 0 ? languageOptions[0] : '',
        additional_languages: [],
        author: '',
        subject: '',
        education_board: '',
        grade_level: '',
        front_cover_image: '',
        is_public: false,
        is_commercial: false,
        base_pricing: {
          is_free: true,
          one_time_purchase_price: 0,
          subscription_price: 0,
          subscription_period_days: 30,
          additional_language_prices: {}
        }
      });
      setTagsInput('');
      setIsSubmitting(false);
    }
  }, [isOpen, languageOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;

      // Handle additional languages checkbox
      if (name === 'additional_languages') {
        const lang = value;
        setFormData(prev => {
          const currentLangs = prev.additional_languages || [];
          const newLangs = checked
            ? [...currentLangs, lang]
            : currentLangs.filter(l => l !== lang);

          // Also clean up pricing if language is deselected
          const newPricing = { ...prev.base_pricing?.additional_language_prices };
          if (!checked) {
            delete newPricing[lang];
          }

          return {
            ...prev,
            additional_languages: newLangs,
            base_pricing: {
              ...prev.base_pricing!,
              additional_language_prices: newPricing
            }
          };
        });
        return;
      }

      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('pricing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        base_pricing: {
          ...prev.base_pricing!,
          [field]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else if (name.startsWith('additional_price.')) {
      const lang = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        base_pricing: {
          ...prev.base_pricing!,
          additional_language_prices: {
            ...prev.base_pricing?.additional_language_prices,
            [lang]: parseFloat(value)
          }
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File is too large. Please upload an image smaller than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, front_cover_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = ['title', 'language', 'author', 'subject', 'education_board', 'grade_level'];
    if (requiredFields.some(field => {
      const val = formData[field as keyof typeof formData];
      return typeof val === 'string' && !val.trim();
    })) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      const bookData: BookCreateData = {
        ...formData,
        tags,
        base_pricing: {
          ...formData.base_pricing!,
          is_free: !formData.is_commercial
        }
      } as BookCreateData;

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

  // Filter out the selected primary language from additional options
  const additionalLanguageOptions = languageOptions.filter(lang => lang !== formData.language);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-panel)] bg-panel-texture rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[var(--border-main)]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-panel)] rounded-t-lg">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Create New Book</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] transition-colors" disabled={isSubmitting}><XMarkIcon className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Cover Image */}
            <div className="flex flex-col items-center space-y-3">
              <label className="block text-sm font-medium text-[var(--text-main)]">Cover Image</label>
              <div className="relative group cursor-pointer w-40 h-56 border-2 border-dashed border-[var(--border-main)] rounded-lg flex flex-col items-center justify-center bg-[var(--bg-input)] hover:border-[var(--color-primary)] transition-colors overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Upload Cover Image"
                />

                {formData.front_cover_image ? (
                  <img src={formData.front_cover_image} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <PhotoIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 group-hover:text-[var(--color-primary)]/80" />
                    <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--color-primary)]">Upload Cover</span>
                  </div>
                )}

                {formData.front_cover_image && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Change Image</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] max-w-[160px] text-center">Recommended aspect ratio 5:7. Max 5MB.</p>
            </div>

            {/* Right Column: Form Fields Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { name: 'title', label: 'Title', placeholder: 'e.g., Biology Grade 10', required: true },
                  { name: 'author', label: 'Author', placeholder: 'e.g., John Smith', required: true },
                  { name: 'subject', label: 'Subject', placeholder: 'e.g., Biology', required: true },
                  { name: 'education_board', label: 'Education Board', placeholder: 'e.g., CBSE', required: true },
                  { name: 'grade_level', label: 'Grade Level', placeholder: 'e.g., 10', required: true },
                ].map(field => (
                  <div key={field.name} className="space-y-1">
                    <label htmlFor={field.name} className="block text-sm font-medium text-[var(--text-main)]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" name={field.name} id={field.name} value={(formData[field.name as keyof typeof formData] as string) || ''} onChange={handleChange} required={field.required} disabled={isSubmitting} placeholder={field.placeholder} className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-input)] text-[var(--text-main)] sm:text-sm disabled:opacity-50 transition-colors" />
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
                    className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-input)] text-[var(--text-main)] sm:text-sm disabled:opacity-50 transition-colors"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Additional Languages Multiselect */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-main)]">Additional Languages</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border border-[var(--border-main)] rounded-md bg-[var(--bg-input)] max-h-32 overflow-y-auto">
                    {additionalLanguageOptions.length > 0 ? additionalLanguageOptions.map(lang => (
                      <label key={lang} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-[var(--bg-panel)] rounded">
                        <input
                          type="checkbox"
                          name="additional_languages"
                          value={lang}
                          checked={formData.additional_languages?.includes(lang) || false}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="text-[var(--color-primary)] bg-[var(--bg-panel)] border-[var(--border-main)] rounded focus:ring-[var(--color-primary)] pointer-events-none"
                        />
                        <span className="text-xs text-[var(--text-main)]">{lang}</span>
                      </label>
                    )) : (
                      <span className="text-xs text-[var(--text-muted)] col-span-full">No other languages available</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">Select translations available for this book</p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label htmlFor="tags" className="block text-sm font-medium text-[var(--text-main)]">Tags</label>
                  <input type="text" name="tags" id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} disabled={isSubmitting} placeholder="e.g., science, biology, reference" className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-input)] text-[var(--text-main)] sm:text-sm disabled:opacity-50 transition-colors" />
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">Separate tags with commas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-main)]">
            <h3 className="text-sm font-semibold text-[var(--text-main)] mb-4">Sharing & Commercial Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Visibility Options */}
              <div className="space-y-4 bg-[var(--bg-input)]/30 p-4 rounded-lg border border-[var(--border-main)]">
                <div className="flex items-start space-x-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      name="is_public"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-[var(--color-primary)] bg-[var(--bg-panel)] border-[var(--border-main)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="is_public" className="text-sm font-medium text-[var(--text-main)] cursor-pointer">Public Access</label>
                    <p className="text-xs text-[var(--text-muted)]">Allow other organizations to discover and view this book.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      name="is_commercial"
                      id="is_commercial"
                      checked={formData.is_commercial}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-4 h-4 text-[var(--color-primary)] bg-[var(--bg-panel)] border-[var(--border-main)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="is_commercial" className="text-sm font-medium text-[var(--text-main)] cursor-pointer">Commercial Model</label>
                    <p className="text-xs text-[var(--text-muted)]">Enable payment or subscription requirements for this book.</p>
                  </div>
                </div>
              </div>

              {/* Pricing Details (Conditional) */}
              <div className="relative">
                {formData.is_commercial ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300 bg-[var(--bg-input)]/50 p-4 rounded-lg border border-[var(--color-primary)]/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="pricing.one_time_purchase_price" className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Purchase Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[var(--text-muted)]">$</span>
                          <input
                            type="number"
                            name="pricing.one_time_purchase_price"
                            id="pricing.one_time_purchase_price"
                            value={formData.base_pricing?.one_time_purchase_price}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className="block w-full pl-7 pr-3 py-2 border border-[var(--border-main)] rounded-md bg-[var(--bg-panel)] text-[var(--text-main)] text-sm focus:ring-1 focus:ring-[var(--color-primary)]"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="pricing.subscription_price" className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Subscription</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[var(--text-muted)]">$</span>
                          <input
                            type="number"
                            name="pricing.subscription_price"
                            id="pricing.subscription_price"
                            value={formData.base_pricing?.subscription_price}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className="block w-full pl-7 pr-3 py-2 border border-[var(--border-main)] rounded-md bg-[var(--bg-panel)] text-[var(--text-main)] text-sm focus:ring-1 focus:ring-[var(--color-primary)]"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Language Pricing */}
                    {(formData.additional_languages || []).length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border-main)]">
                        <span className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Additional Language Add-ons</span>
                        {formData.additional_languages!.map(lang => (
                          <div key={lang} className="grid grid-cols-3 gap-2 items-center">
                            <label className="col-span-1 text-xs text-[var(--text-main)] truncate">{lang}</label>
                            <div className="col-span-2 relative">
                              <span className="absolute left-3 top-2 text-[var(--text-muted)]">$</span>
                              <input
                                type="number"
                                name={`additional_price.${lang}`}
                                value={formData.base_pricing?.additional_language_prices?.[lang] || ''}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="block w-full pl-7 pr-3 py-1.5 border border-[var(--border-main)] rounded-md bg-[var(--bg-panel)] text-[var(--text-main)] text-sm focus:ring-1 focus:ring-[var(--color-primary)]"
                                placeholder="Add-on Price"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label htmlFor="pricing.subscription_period_days" className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Subscription Period (Days)</label>
                      <input
                        type="number"
                        name="pricing.subscription_period_days"
                        id="pricing.subscription_period_days"
                        value={formData.base_pricing?.subscription_period_days}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="block w-full px-3 py-2 border border-[var(--border-main)] rounded-md bg-[var(--bg-panel)] text-[var(--text-main)] text-sm focus:ring-1 focus:ring-[var(--color-primary)]"
                        placeholder="30"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-6 border-2 border-dashed border-[var(--border-main)] rounded-lg bg-[var(--bg-input)]/10">
                    <p className="text-xs text-[var(--text-muted)] italic text-center">Enable Commercial Model to configure pricing details.</p>
                  </div>
                )}
              </div>
            </div>
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