import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState } from '../Store';
import {
    setOrderItem,
    removeOrderItem,
    clearOrder,
    setFiatCurrency,
    setPurchaseEmail,
    setLastPurchase,
    setError,
    clearError,
    setLoading,
} from '../actions/appActions';
import { CreateCardRequest, FiatCurrency, PurchaseOrderItem } from '../types';
import api from '../Api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import BitcoinGiftCard from '../components/BitcoinGiftCard';

const PRESET_AMOUNTS_EUR = [
    { cents: 2500, label: '€25' },
    { cents: 5000, label: '€50' },
    { cents: 10000, label: '€100' },
    { cents: 25000, label: '€250' },
];

const PRESET_AMOUNTS_USD = [
    { cents: 2500, label: '$25' },
    { cents: 5000, label: '$50' },
    { cents: 10000, label: '$100' },
    { cents: 25000, label: '$250' },
];

const BuyPage = () => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();

    const { purchaseOrder, fiatCurrency, purchaseEmail, loading, error } = useSelector(
        (state: RootState) => state.appRootReducer,
    );

    const [localEmail, setLocalEmail] = useState(purchaseEmail);
    const [localCurrency, setLocalCurrency] = useState<FiatCurrency>(fiatCurrency);
    const [customAmount, setCustomAmount] = useState('');
    const [customError, setCustomError] = useState('');

    const presets = localCurrency === 'USD' ? PRESET_AMOUNTS_USD : PRESET_AMOUNTS_EUR;
    const symbol = localCurrency === 'USD' ? '$' : '€';

    // Pre-select amount from URL param (e.g. ?amount=10000)
    useEffect(() => {
        const amountParam = searchParams.get('amount');
        if (amountParam) {
            const cents = parseInt(amountParam, 10);
            const preset = presets.find((p) => p.cents === cents);
            if (preset) {
                dispatch(setOrderItem({ fiat_amount_cents: cents, quantity: 1, label: preset.label }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getItemQty = (cents: number) =>
        purchaseOrder.find((i) => i.fiat_amount_cents === cents)?.quantity ?? 0;

    const setQty = (cents: number, qty: number, label: string) => {
        if (qty <= 0) {
            dispatch(removeOrderItem(cents));
        } else {
            dispatch(setOrderItem({ fiat_amount_cents: cents, quantity: qty, label }));
        }
    };

    const totalCents = purchaseOrder.reduce(
        (sum, i) => sum + i.fiat_amount_cents * i.quantity,
        0,
    );
    const totalCards = purchaseOrder.reduce((sum, i) => sum + i.quantity, 0);

    const handleCurrencyChange = (c: FiatCurrency) => {
        setLocalCurrency(c);
        dispatch(setFiatCurrency(c));
        dispatch(clearOrder());
        setCustomAmount('');
        setCustomError('');
    };

    const handleAddCustomAmount = () => {
        const value = parseFloat(customAmount);
        if (isNaN(value) || value < 10) {
            setCustomError(`Minimum is ${symbol}10`);
            return;
        }
        if (value > 2000) {
            setCustomError(`Maximum is ${symbol}2,000`);
            return;
        }
        setCustomError('');
        const cents = Math.round(value * 100);
        const label = `${symbol}${value.toFixed(2)}`;
        dispatch(setOrderItem({ fiat_amount_cents: cents, quantity: 1, label }));
        setCustomAmount('');
    };

    const handleCheckout = async () => {
        if (!localEmail.trim()) {
            dispatch(setError('Please enter your email address.'));
            return;
        }
        if (purchaseOrder.length === 0) {
            dispatch(setError('Please select at least one card denomination.'));
            return;
        }
        dispatch(clearError());
        dispatch(setLoading(true));
        dispatch(setPurchaseEmail(localEmail.trim()));

        try {
            const req: CreateCardRequest = {
                items: purchaseOrder.map((i) => ({
                    fiat_amount_cents: i.fiat_amount_cents,
                    quantity: i.quantity,
                })),
                fiat_currency: localCurrency,
                purchase_email: localEmail.trim(),
            };

            const res = await api.post('/cards', req);
            dispatch(setLastPurchase(res.data));
            dispatch(clearOrder());
            // Redirect to Stripe checkout
            window.location.href = res.data.checkout_url;
        } catch (err: any) {
            dispatch(setError(err.message || 'Failed to create checkout session.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy a Bitcoin Gift Card</h1>
            <p className="text-gray-500 mb-8">
                Select an amount, enter your email, and pay via Stripe. Your card code arrives
                after payment is confirmed.
            </p>

            {/* 3D card preview */}
            <div className="flex flex-col items-center gap-3 mb-8">
                <BitcoinGiftCard
                    size="md"
                    interactive
                    amount={totalCents > 0 ? `€${(totalCents / 100).toFixed(2)}` : undefined}
                />
                {totalCents > 0 ? (
                    <p className="text-sm text-gray-400 text-center">
                        {totalCards} card{totalCards !== 1 ? 's' : ''} · €{(totalCents / 100).toFixed(2)} total
                    </p>
                ) : (
                    <p className="text-sm text-gray-400 text-center">Select an amount to preview your card</p>
                )}
            </div>

            {error && (
                <div className="mb-6">
                    <ErrorBanner message={error} onDismiss={() => dispatch(clearError())} />
                </div>
            )}

            {/* Denomination picker */}
            <div className="card-panel mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-4">
                    Select amount
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {presets.map(({ cents, label }) => {
                        const qty = getItemQty(cents);
                        return (
                            <div
                                key={cents}
                                className={`rounded-xl border p-4 transition-all ${qty > 0
                                    ? 'border-btc-orange bg-btc-orange/5'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-extrabold text-btc-orange">{label}</span>
                                    <span className="text-gray-400 text-xs">per card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setQty(cents, qty - 1, label)}
                                        disabled={qty === 0}
                                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700 font-bold transition-colors"
                                    >
                                        −
                                    </button>
                                    <span className="flex-1 text-center text-gray-900 font-semibold text-lg">
                                        {qty}
                                    </span>
                                    <button
                                        onClick={() => setQty(cents, qty + 1, label)}
                                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Other Amount */}
                <div className="mt-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Other amount</label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">{symbol}</span>
                        <input
                            type="number"
                            min="10"
                            max="2000"
                            step="1"
                            value={customAmount}
                            onChange={(e) => { setCustomAmount(e.target.value); setCustomError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAmount()}
                            placeholder="Enter amount"
                            className="input-field flex-1"
                        />
                        <button
                            onClick={handleAddCustomAmount}
                            disabled={!customAmount}
                            className="btn-primary whitespace-nowrap px-4 py-3 text-sm"
                        >
                            Add
                        </button>
                    </div>
                    {customError ? (
                        <p className="text-red-500 text-xs mt-1.5">{customError}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1.5">Minimum {symbol}10 · Maximum {symbol}2,000</p>
                    )}
                </div>
            </div>

            {/* Email */}
            <div className="card-panel mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                    Your email address
                </label>
                <input
                    type="email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                />
                <p className="text-gray-400 text-xs mt-2">
                    We'll use this to send you your card codes after payment.
                </p>
            </div>

            {/* Order summary */}
            {purchaseOrder.length > 0 && (
                <div className="card-panel mb-6 animate-fade-in">
                    <h3 className="text-gray-900 font-semibold mb-3">Order summary</h3>
                    <div className="divide-y divide-gray-200">
                        {purchaseOrder.map((item: PurchaseOrderItem) => (
                            <div key={item.fiat_amount_cents} className="flex items-center justify-between py-2 text-sm">
                                <span className="text-gray-500">
                                    {item.label} × {item.quantity}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-900 font-medium">
                                        {symbol}
                                        {((item.fiat_amount_cents * item.quantity) / 100).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => dispatch(removeOrderItem(item.fiat_amount_cents))}
                                        className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                                        title="Remove"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200 mt-1">
                        <span className="text-gray-900 font-semibold">
                            Total ({totalCards} card{totalCards !== 1 ? 's' : ''})
                        </span>
                        <span className="text-btc-orange font-bold text-lg">
                            {symbol}
                            {(totalCents / 100).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            <button
                onClick={handleCheckout}
                disabled={loading || purchaseOrder.length === 0 || !localEmail.trim()}
                className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-3"
            >
                {loading ? (
                    <LoadingSpinner size="sm" />
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Proceed to Checkout
                    </>
                )}
            </button>

            <p className="text-gray-400 text-xs text-center mt-4">
                Payments processed securely via Stripe. BTC assigned after payment confirmation.
            </p>
        </div>
    );
};

export default BuyPage;
