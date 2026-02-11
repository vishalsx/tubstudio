import React from 'react';
import { Book } from '../../types';
import { XMarkIcon, ShoppingBagIcon, TrashIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: Book[];
    onRemoveFromCart: (bookId: string) => void;
    onCheckout: () => void;
    isPurchasing: boolean;
    onClearCart: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
    isOpen,
    onClose,
    cart,
    onRemoveFromCart,
    onCheckout,
    isPurchasing,
    onClearCart,
}) => {
    if (!isOpen) return null;

    const total = cart.reduce((sum, book) => {
        const price = book.base_pricing?.is_free ? 0 : (book.base_pricing?.one_time_purchase_price || 0);
        return sum + price;
    }, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-panel)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-main)] flex flex-col max-h-[85vh] animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)]">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingBagIcon className="w-7 h-7 text-[var(--color-primary)]" />
                        Your Cart
                        <span className="text-sm font-normal text-[var(--text-muted)] ml-2">({cart.length} items)</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--bg-input)] rounded-full transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] opacity-60">
                            <ShoppingBagIcon className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <p className="text-sm">Go to the Marketplace to add books.</p>
                        </div>
                    ) : (
                        cart.map(book => (
                            <div key={book._id} className="flex gap-4 p-4 bg-[var(--bg-input)] rounded-xl border border-[var(--border-main)] shadow-sm">

                                {/* Thumbnail */}
                                <div className="w-20 h-28 bg-[var(--bg-panel)] rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border-main)]">
                                    {book.front_cover_image ? (
                                        <img src={`data:image/jpeg;base64,${book.front_cover_image}`} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <span className="text-xs">No Cover</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--text-main)] truncate">{book.title}</h3>
                                        <p className="text-sm text-[var(--text-muted)]">by {book.author || 'Unknown'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs px-2 py-1 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded">{book.language || 'English'}</span>
                                        <span className="text-xs px-2 py-1 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded">{book.subject || 'General'}</span>
                                    </div>
                                </div>

                                {/* Price & Actions */}
                                <div className="flex flex-col justify-between items-end">
                                    <div className="text-lg font-bold text-[var(--color-primary)]">
                                        {book.base_pricing?.is_free ? 'Free' : `$${book.base_pricing?.one_time_purchase_price || 0}`}
                                    </div>
                                    <button
                                        onClick={() => onRemoveFromCart(book._id)}
                                        className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-2"
                                        title="Remove from cart"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-input)]/30 rounded-b-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-lg font-medium text-[var(--text-muted)]">Total</span>
                            <span className="text-3xl font-bold text-[var(--text-main)] flex items-center">
                                <span className="text-xl mr-1">$</span>{total.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={onClearCart}
                                className="px-6 py-3 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] font-bold hover:bg-[var(--bg-input)] hover:text-[var(--text-main)] transition-colors"
                            >
                                Clear Cart
                            </button>
                            <button
                                onClick={onCheckout}
                                disabled={isPurchasing}
                                className="flex-1 px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isPurchasing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <CurrencyDollarIcon className="w-6 h-6" />
                                        <span>Checkout</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
