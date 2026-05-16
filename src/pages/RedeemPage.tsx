import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../Store';
import {
    setRedeemResult,
    setCardLookup,
    setCardBalance,
    setError,
    clearError,
    setLoading,
} from '../actions/appActions';
import { Card, CardBalance, RedeemCardRequest, RedeemCardResponse } from '../types';
import api from '../Api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

const formatSats = (sats: number) => sats.toLocaleString('en-US') + ' sats';

const RedeemPage = () => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();

    const { redeemResult, cardLookup, cardBalance, loading, error } = useSelector(
        (s: RootState) => s.appRootReducer,
    );

    const [code, setCode] = useState(searchParams.get('code') ?? '');
    const [invoice, setInvoice] = useState('');
    const [amountSats, setAmountSats] = useState('');
    const [cardLoading, setCardLoading] = useState(false);

    // Auto-load card when code is pre-filled from query param
    useEffect(() => {
        const preCode = searchParams.get('code');
        if (preCode) {
            loadCard(preCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCard = async (cardCode: string) => {
        setCardLoading(true);
        dispatch(clearError());
        try {
            const [cardRes, balanceRes] = await Promise.all([
                api.get<Card>(`/cards/${cardCode}`),
                api.get<CardBalance>(`/cards/${cardCode}/balance`),
            ]);
            dispatch(setCardLookup(cardRes.data));
            dispatch(setCardBalance(balanceRes.data));
            setAmountSats(String(balanceRes.data.btc_amount_sats));
        } catch (err: any) {
            dispatch(setError(err.message || 'Card not found.'));
            dispatch(setCardLookup(null));
            dispatch(setCardBalance(null));
        } finally {
            setCardLoading(false);
        }
    };

    const handleLoadCard = () => {
        if (!code.trim()) {
            dispatch(setError('Enter your card code.'));
            return;
        }
        loadCard(code.trim().toUpperCase());
    };

    const handleRedeem = async () => {
        if (!cardLookup) return;
        if (!invoice.trim()) {
            dispatch(setError('Please paste a Lightning invoice (BOLT11).'));
            return;
        }
        const sats = parseInt(amountSats, 10);
        if (isNaN(sats) || sats <= 0) {
            dispatch(setError('Enter a valid amount in satoshis.'));
            return;
        }
        if (cardBalance && sats > cardBalance.btc_amount_sats) {
            dispatch(setError(`Amount exceeds card balance (${formatSats(cardBalance.btc_amount_sats)}).`));
            return;
        }

        dispatch(clearError());
        dispatch(setLoading(true));
        dispatch(setRedeemResult(null));

        try {
            const req: RedeemCardRequest = {
                method: 'lightning',
                amount_sats: sats,
                invoice: invoice.trim(),
            };
            const res = await api.post<RedeemCardResponse>(`/cards/${cardLookup.code}/redeem`, req);
            dispatch(setRedeemResult(res.data));
        } catch (err: any) {
            dispatch(setError(err.message || 'Redemption failed.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Success view
    if (redeemResult) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-green-100 border border-green-300 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">BTC Sent! ⚡</h1>
                <p className="text-gray-500 mb-8">
                    Your Lightning payment was successful.
                </p>

                <div className="card-panel text-left space-y-3 mb-8 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Amount sent</span>
                        <span className="text-btc-orange font-bold">{formatSats(redeemResult.btc_amount_sats)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Remaining balance</span>
                        <span className="text-gray-900">{formatSats(redeemResult.remaining_balance_sats)}</span>
                    </div>
                    {redeemResult.payment_hash && (
                        <div className="pt-2 border-t border-gray-200">
                            <p className="text-gray-400 text-xs mb-1">Payment hash</p>
                            <p className="text-gray-600 font-mono text-xs break-all">{redeemResult.payment_hash}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    {redeemResult.remaining_balance_sats > 0 && (
                        <button
                            onClick={() => {
                                dispatch(setRedeemResult(null));
                                setInvoice('');
                                setAmountSats(String(redeemResult.remaining_balance_sats));
                            }}
                            className="btn-primary"
                        >
                            Spend Remaining Balance
                        </button>
                    )}
                    <Link to="/" className="btn-secondary">Go Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Redeem via Lightning</h1>
            <p className="text-gray-500 mb-8">
                Enter your card code and a BOLT11 Lightning invoice to receive your Bitcoin.
            </p>

            {error && (
                <div className="mb-6">
                    <ErrorBanner message={error} onDismiss={() => dispatch(clearError())} />
                </div>
            )}

            {/* Step 1: Card code */}
            <div className="card-panel mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                    Step 1 — Enter your card code
                </label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadCard()}
                        placeholder="GIFT-XXXX-YYYY-ZZZZ"
                        className="input-field font-mono tracking-wider"
                        disabled={!!cardLookup}
                    />
                    {!cardLookup ? (
                        <button
                            onClick={handleLoadCard}
                            disabled={cardLoading || !code.trim()}
                            className="btn-primary whitespace-nowrap px-5"
                        >
                            {cardLoading ? <LoadingSpinner size="sm" /> : 'Load'}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                dispatch(setCardLookup(null));
                                dispatch(setCardBalance(null));
                                setCode('');
                                setAmountSats('');
                            }}
                            className="btn-secondary whitespace-nowrap px-5"
                        >
                            Change
                        </button>
                    )}
                </div>

                {cardLookup && cardBalance && (
                    <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                        <div>
                            <p className="text-gray-400 text-xs">Available balance</p>
                            <p className="text-btc-orange font-bold text-lg">
                                {formatSats(cardBalance.btc_amount_sats)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs">Status</p>
                            <p className="text-gray-900 text-sm font-medium capitalize">{cardLookup.status}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Amount */}
            {cardLookup && cardBalance && cardLookup.status === 'active' && (
                <div className="card-panel mb-6 animate-fade-in">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                        Step 2 — Amount (satoshis)
                    </label>
                    <input
                        type="number"
                        value={amountSats}
                        onChange={(e) => setAmountSats(e.target.value)}
                        placeholder="e.g. 50000"
                        className="input-field"
                        min={1}
                        max={cardBalance.btc_amount_sats}
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => setAmountSats(String(cardBalance.btc_amount_sats))}
                            className="text-btc-orange text-xs hover:underline"
                        >
                            Max ({formatSats(cardBalance.btc_amount_sats)})
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Invoice */}
            {cardLookup && cardLookup.status === 'active' && (
                <div className="card-panel mb-6 animate-fade-in">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                        Step 3 — Paste a Lightning invoice
                    </label>
                    <textarea
                        value={invoice}
                        onChange={(e) => setInvoice(e.target.value.trim())}
                        placeholder="lnbc..."
                        rows={4}
                        className="input-field font-mono text-xs resize-none"
                    />
                    <p className="text-gray-400 text-xs mt-2">
                        Generate a BOLT11 invoice from your Lightning wallet (e.g. Phoenix, Zeus, Mutiny).
                    </p>
                </div>
            )}

            {cardLookup?.status === 'active' && (
                <button
                    onClick={handleRedeem}
                    disabled={loading || !invoice.trim() || !amountSats}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
                >
                    {loading ? <LoadingSpinner size="sm" /> : <><span>⚡</span> Send Bitcoin</>}
                </button>
            )}

            {cardLookup && cardLookup.status !== 'active' && (
                <div className="card-panel text-center text-gray-500 text-sm">
                    {cardLookup.status === 'redeemed'
                        ? 'This card has already been fully redeemed.'
                        : cardLookup.status === 'expired'
                            ? 'This card has expired.'
                            : 'This card is not yet active. Please wait for BTC funding to complete.'}
                </div>
            )}
        </div>
    );
};

export default RedeemPage;
