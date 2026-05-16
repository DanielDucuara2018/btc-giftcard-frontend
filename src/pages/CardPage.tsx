import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../Store';
import {
    setCardLookup,
    setCardBalance,
    setError,
    clearError,
    setLoading,
} from '../actions/appActions';
import { Card, CardBalance } from '../types';
import api from '../Api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';

const formatSats = (sats: number) =>
    sats.toLocaleString('en-US') + ' sats';

const formatBTC = (sats: number) =>
    (sats / 1e8).toFixed(8) + ' BTC';

const formatCents = (cents: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${(cents / 100).toFixed(2)}`;
};

const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : '—';

const CardPage = () => {
    const dispatch = useDispatch();
    const { cardLookup, cardBalance, loading, error } = useSelector(
        (s: RootState) => s.appRootReducer,
    );

    const [code, setCode] = useState('');

    const handleLookup = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
            dispatch(setError('Please enter a card code.'));
            return;
        }
        dispatch(clearError());
        dispatch(setLoading(true));
        dispatch(setCardLookup(null));
        dispatch(setCardBalance(null));

        try {
            const [cardRes, balanceRes] = await Promise.all([
                api.get<Card>(`/cards/${trimmed}`),
                api.get<CardBalance>(`/cards/${trimmed}/balance`),
            ]);
            dispatch(setCardLookup(cardRes.data));
            dispatch(setCardBalance(balanceRes.data));
        } catch (err: any) {
            dispatch(setError(err.message || 'Failed to look up card.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLookup();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Card Balance</h1>
            <p className="text-gray-500 mb-8">
                Enter your gift card code to see balance and status.
            </p>

            {error && (
                <div className="mb-6">
                    <ErrorBanner message={error} onDismiss={() => dispatch(clearError())} />
                </div>
            )}

            {/* Code input */}
            <div className="card-panel mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Card code</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        placeholder="GIFT-XXXX-YYYY-ZZZZ"
                        className="input-field font-mono tracking-wider"
                        maxLength={24}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={loading || !code.trim()}
                        className="btn-primary whitespace-nowrap px-5"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : 'Look up'}
                    </button>
                </div>
            </div>

            {/* Result */}
            {cardLookup && cardBalance && (
                <div className="animate-slide-up space-y-4">
                    {/* Balance hero */}
                    <div className="card-panel text-center">
                        <p className="text-gray-500 text-sm mb-1">Current balance</p>
                        <p className="text-5xl font-extrabold text-btc-orange mb-1">
                            {formatSats(cardBalance.btc_amount_sats)}
                        </p>
                        <p className="text-gray-400 text-sm">{formatBTC(cardBalance.btc_amount_sats)}</p>
                    </div>

                    {/* Card details */}
                    <div className="card-panel">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-gray-900 font-semibold">Card details</h2>
                            <StatusBadge status={cardLookup.status} />
                        </div>
                        <dl className="space-y-2 text-sm">
                            {[
                                { label: 'Code', value: <code className="font-mono text-btc-orange">{cardLookup.code}</code> },
                                { label: 'Face value', value: formatCents(cardLookup.fiat_amount_cents, cardLookup.fiat_currency) },
                                { label: 'Currency', value: cardLookup.fiat_currency },
                                { label: 'Payment', value: cardLookup.payment_status },
                                { label: 'Created', value: formatDate(cardLookup.created_at) },
                                { label: 'Funded', value: formatDate(cardLookup.funded_at) },
                                { label: 'Redeemed', value: formatDate(cardLookup.redeemed_at) },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between">
                                    <dt className="text-gray-500">{label}</dt>
                                    <dd className="text-gray-900 text-right">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* Redeem CTA */}
                    {cardLookup.status === 'active' && cardBalance.btc_amount_sats > 0 && (
                        <Link
                            to={`/card/redeem?code=${cardLookup.code}`}
                            className="btn-primary w-full text-center flex items-center justify-center gap-2"
                        >
                            <span>⚡</span>
                            Redeem via Lightning
                        </Link>
                    )}

                    {cardLookup.status === 'created' || cardLookup.status === 'funding' ? (
                        <div className="card-panel text-center text-gray-500 text-sm">
                            <p>Your card is being loaded with Bitcoin. Check back in a moment.</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default CardPage;
