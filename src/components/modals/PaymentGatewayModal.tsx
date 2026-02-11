import React, { useState, useEffect } from 'react';
import { XMarkIcon, CreditCardIcon, CheckCircleIcon, LockClosedIcon, ShoppingBagIcon } from '@heroicons/react/24/solid';
import { Book, CartItem } from '../../types';

interface PaymentGatewayModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onConfirmPayment: () => Promise<void>;
}

type PaymentStep = 'checkout' | 'processing' | 'success';

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({ isOpen, onClose, cart, onConfirmPayment }) => {
    const [step, setStep] = useState<PaymentStep>('checkout');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [processingProgress, setProcessingProgress] = useState(0);
    const [purchasedCount, setPurchasedCount] = useState(0);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('checkout');
            setCardNumber('');
            setExpiry('');
            setCvv('');
            setCardName('');
            setProcessingProgress(0);
        }
    }, [isOpen]);

    const getPrice = (item: CartItem): number => {
        const { book, purchaseMethod, selectedLanguages } = item;
        let price = 0;
        if (!book.base_pricing?.is_free) {
            price = (purchaseMethod === 'subscription' ? book.base_pricing?.subscription_price : book.base_pricing?.one_time_purchase_price) || 0;
        }

        const additionalLangsPrice = (selectedLanguages || []).reduce((sum, lang) => {
            return sum + (book.base_pricing?.additional_language_prices?.[lang] || 0);
        }, 0);

        return price + additionalLangsPrice;
    };

    const getCommercialModelLabel = (item: CartItem): string => {
        const { book, purchaseMethod } = item;
        if (book.base_pricing?.is_free) return 'Free';
        if (purchaseMethod === 'subscription') {
            return `Subscription (${book.base_pricing?.subscription_period_days || 30}d)`;
        }
        return 'Permanent';
    };

    const totalPrice = cart.reduce((sum, item) => sum + getPrice(item), 0);

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return digits;
    };

    const handlePay = async () => {
        setPurchasedCount(cart.length);
        setStep('processing');
        setProcessingProgress(0);

        // Simulate processing animation
        const interval = setInterval(() => {
            setProcessingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 300);

        try {
            await onConfirmPayment();
            clearInterval(interval);
            setProcessingProgress(100);
            setTimeout(() => setStep('success'), 400);
        } catch {
            clearInterval(interval);
            setStep('checkout');
        }
    };

    const isFormValid = cardNumber.replace(/\s/g, '').length >= 16 && expiry.length >= 5 && cvv.length >= 3 && cardName.length >= 2;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 'success' ? onClose : undefined} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-[var(--bg-panel)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-in fade-in zoom-in-95">

                {/* ===== CHECKOUT STEP ===== */}
                {step === 'checkout' && (
                    <>
                        {/* Header */}
                        <div className="bg-[var(--color-primary)] px-6 py-5 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <LockClosedIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Secure Checkout</h2>
                                        <p className="text-xs text-white/70">Demo Payment Gateway</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Order Summary */}
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Order Summary</h3>
                                <div className="space-y-2">
                                    {cart.map(item => (
                                        <div key={item.book._id} className="flex items-center justify-between py-2 px-3 bg-[var(--bg-input)] rounded-lg border border-[var(--border-main)]">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <p className="text-sm font-semibold text-[var(--text-main)] truncate">{item.book.title}</p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                                        ${getCommercialModelLabel(item).startsWith('Permanent')
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : getCommercialModelLabel(item) === 'Free'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {getCommercialModelLabel(item)}
                                                    </span>
                                                    {(item.selectedLanguages || []).map(lang => (
                                                        <span key={lang} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                                            + {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-[var(--text-main)] whitespace-nowrap">
                                                {getPrice(item) === 0 ? 'Free' : `$${getPrice(item).toFixed(2)}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {/* Total */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-main)]">
                                    <span className="text-sm font-bold text-[var(--text-main)]">Total</span>
                                    <span className="text-xl font-black text-[var(--color-primary)]">
                                        {totalPrice === 0 ? 'Free' : `$${totalPrice.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>

                            {/* Card Details */}
                            {totalPrice > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Payment Details</h3>
                                    <div className="space-y-3">
                                        {/* Card Number */}
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Card Number</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                    placeholder="4242 4242 4242 4242"
                                                    className="w-full px-4 py-2.5 pl-10 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl text-sm font-mono text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                />
                                                <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                            </div>
                                        </div>

                                        {/* Name on Card */}
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Name on Card</label>
                                            <input
                                                type="text"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                            />
                                        </div>

                                        {/* Expiry & CVV */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Expiry</label>
                                                <input
                                                    type="text"
                                                    value={expiry}
                                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                                    placeholder="MM/YY"
                                                    className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl text-sm font-mono text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">CVV</label>
                                                <input
                                                    type="text"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    placeholder="123"
                                                    className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl text-sm font-mono text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pay Button */}
                        <div className="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-input)]/50">
                            <button
                                onClick={handlePay}
                                disabled={totalPrice > 0 && !isFormValid}
                                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/50 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <LockClosedIcon className="w-4 h-4" />
                                <span>{totalPrice === 0 ? 'Confirm Free Order' : `Pay $${totalPrice.toFixed(2)}`}</span>
                            </button>
                            <p className="text-center text-[10px] text-[var(--text-muted)] mt-2 opacity-60">
                                🔒 This is a demo payment gateway. No real charges will be made.
                            </p>
                        </div>
                    </>
                )}

                {/* ===== PROCESSING STEP ===== */}
                {step === 'processing' && (
                    <div className="px-6 py-16 flex flex-col items-center justify-center">
                        <div className="relative w-20 h-20 mb-6">
                            {/* Spinning ring */}
                            <div className="absolute inset-0 border-4 border-[var(--color-primary)]/20 rounded-full" />
                            <div
                                className="absolute inset-0 border-4 border-transparent border-t-[var(--color-primary)] rounded-full animate-spin"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CreditCardIcon className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Processing Payment</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-6">Please wait while we process your order...</p>
                        {/* Progress bar */}
                        <div className="w-full max-w-xs h-2 bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-main)]">
                            <div
                                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${Math.min(processingProgress, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ===== SUCCESS STEP ===== */}
                {step === 'success' && (
                    <div className="px-6 py-16 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[var(--color-primary)]/10">
                            <CheckCircleIcon className="w-12 h-12 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Payment Successful!</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-1">
                            {purchasedCount} {purchasedCount === 1 ? 'book has' : 'books have'} been added to your library.
                        </p>
                        <p className="text-xs text-[var(--text-muted)] opacity-60 mb-8">
                            Switch to "My Books" to start reading.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <ShoppingBagIcon className="w-4 h-4" />
                            <span>Done</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
