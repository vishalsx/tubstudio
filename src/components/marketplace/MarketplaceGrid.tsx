import React from 'react';
import { Book } from '../../types';
import { CurrencyDollarIcon, BookOpenIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface MarketplaceGridProps {
    books: Book[];
    activeBook: Book | null;
    onSelectBook: (book: Book) => void;
    isLoading: boolean;
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({
    books,
    activeBook,
    onSelectBook,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[var(--bg-input)] h-64 rounded-xl shadow-md border border-[var(--border-main)]"></div>
                ))}
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-60">
                <BookOpenIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No books found in the marketplace.</p>
                <p className="text-sm">Try adjusting your search query or language.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 overflow-y-auto custom-scrollbar">
            {books.map((book) => (
                <div
                    key={book._id}
                    onClick={() => onSelectBook(book)}
                    className={`
            relative bg-[var(--bg-input)] rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer group
            ${activeBook?._id === book._id ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 transform scale-[1.02]' : 'border-[var(--border-main)] hover:border-[var(--color-primary)]/50 hover:shadow-xl hover:-translate-y-1'}
          `}
                >
                    {/* Thumbnail / Cover */}
                    <div className="h-48 bg-gradient-to-br from-[var(--bg-panel)] to-[var(--bg-hover)] relative overflow-hidden">
                        {book.front_cover_image ? (
                            <img src={`data:image/jpeg;base64,${book.front_cover_image}`} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-6 text-center">
                                <BookOpenIcon className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-wider opacity-60">No Cover</span>
                            </div>
                        )}

                        {/* Purchased Ribbon */}
                        {(book.is_purchased || book.ownership_type === 'purchased') && (
                            <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 z-20">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Purchased</span>
                            </div>
                        )}

                        {/* Price Tag (Hidden if purchased) */}
                        {!(book.is_purchased || book.ownership_type === 'purchased') && (
                            <div className="absolute top-3 right-3 bg-[var(--color-primary)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1 z-10">
                                <CurrencyDollarIcon className="w-4 h-4" />
                                <span>{book.base_pricing?.is_free ? 'Free' : `$${book.base_pricing?.one_time_purchase_price || 0}`}</span>
                            </div>
                        )}

                        {/* Language Badge removed as requested */}
                    </div>

                    {/* Details */}
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 truncate" title={book.title}>{book.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <span>By {book.author || 'Unknown Author'}</span>
                        </p>

                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-4">
                            <div className="flex items-center gap-1">
                                <span className="bg-[var(--bg-hover)] px-2 py-1 rounded border border-[var(--border-main)]">{book.subject || 'General'}</span>
                                <span className="bg-[var(--bg-hover)] px-2 py-1 rounded border border-[var(--border-main)]">{book.grade_level || 'All Levels'}</span>
                            </div>
                            {/* Placeholder for rating if available */}
                            <div className="flex items-center gap-0.5 text-yellow-500">
                                <StarIcon className="w-3.5 h-3.5" />
                                <span className="font-bold">4.5</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
