import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../Store';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../Api';
import { CreatedCard } from '../types';

interface SessionResponse {
    payment_status: string;
    cards: CreatedCard[];
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

const SuccessPage = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [copied, setCopied] = useState<string | null>(null);
    const [polledCards, setPolledCards] = useState<CreatedCard[] | null>(null);
    const [pollError, setPollError] = useState<string | null>(null);
    const pollStartRef = useRef<number>(Date.now());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const lastPurchase = useSelector((s: RootState) => s.appRootReducer.lastPurchase);

    // Poll backend for payment confirmation when lastPurchase is unavailable.
    useEffect(() => {
        if (!sessionId || (lastPurchase && lastPurchase.cards.length > 0)) return;

        pollStartRef.current = Date.now();

        const poll = async () => {
            if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
                clearInterval(intervalRef.current!);
                setPollError('Payment confirmation is taking longer than expected. Check your email for card codes.');
                return;
            }
            try {
                const res = await api.get<SessionResponse>(`/checkout/sessions/${sessionId}`);
                if (res.data.payment_status === 'paid' && res.data.cards.length > 0) {
                    clearInterval(intervalRef.current!);
                    setPolledCards(res.data.cards);
                }
            } catch {
                // keep polling on transient errors
            }
        };

        poll();
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(intervalRef.current!);
    }, [sessionId, lastPurchase]);

    const cards: CreatedCard[] =
        (lastPurchase && lastPurchase.cards.length > 0 ? lastPurchase.cards : null) ??
        polledCards ??
        [];

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(code);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-100 border border-green-300 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment received!</h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Your payment was successful. Your card(s) are being loaded with Bitcoin — this
                usually takes under a minute.
            </p>

            {cards.length > 0 ? (
                <div className="card-panel text-left mb-8">
                    <h2 className="text-gray-900 font-semibold mb-4">Your card code{cards.length > 1 ? 's' : ''}</h2>
                    <div className="space-y-3">
                        {cards.map((card) => (
                            <div
                                key={card.card_id}
                                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200"
                            >
                                <code className="text-btc-orange font-mono text-lg tracking-widest">
                                    {card.code}
                                </code>
                                <button
                                    onClick={() => copyCode(card.code)}
                                    className="text-gray-400 hover:text-gray-700 transition-colors ml-4"
                                    title="Copy code"
                                >
                                    {copied === card.code ? (
                                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-4">
                        Save these codes! They are your Bitcoin gift cards. Check the balance or redeem
                        at any time from the "Check Balance" page.
                    </p>
                </div>
            ) : pollError ? (
                <div className="card-panel mb-8">
                    <p className="text-red-500 text-sm">{pollError}</p>
                </div>
            ) : (
                <div className="card-panel mb-8">
                    <div className="flex flex-col items-center gap-3 py-4">
                        <LoadingSpinner label="Confirming payment…" />
                        <p className="text-gray-500 text-sm">
                            Your card codes will be available once payment is confirmed.
                        </p>
                        {sessionId && (
                            <p className="text-gray-400 text-xs font-mono">Session: {sessionId}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
                <Link to="/card" className="btn-primary">
                    Check Card Balance
                </Link>
                <Link to="/buy" className="btn-secondary">
                    Buy Another Card
                </Link>
            </div>
        </div>
    );
};

export default SuccessPage;
