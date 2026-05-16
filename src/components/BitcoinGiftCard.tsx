import { useRef, useEffect, CSSProperties } from 'react';

export type GiftCardSize = 'sm' | 'md' | 'lg';

interface BitcoinGiftCardProps {
    amount?: string;
    size?: GiftCardSize;
    interactive?: boolean;
    className?: string;
}

const SIZES = {
    sm: { width: 240, height: 151, btcBg: 90, brand: '0.65rem', label: '0.55rem', amount: '1.4rem' },
    md: { width: 340, height: 214, btcBg: 130, brand: '0.85rem', label: '0.7rem', amount: '2rem' },
    lg: { width: 440, height: 277, btcBg: 170, brand: '1.05rem', label: '0.85rem', amount: '2.6rem' },
} as const;

const BitcoinGiftCard = ({
    amount,
    size = 'md',
    interactive = false,
    className = '',
}: BitcoinGiftCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!interactive) return;
        const wrapper = wrapperRef.current;
        const card = cardRef.current;
        if (!wrapper || !card) return;

        const onMove = (e: MouseEvent) => {
            const r = wrapper.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${x * 22}deg) rotateX(${-y * 16}deg) scale(1.03)`;
        };

        const onLeave = () => {
            card.style.transform = 'perspective(1000px) rotateY(-8deg) rotateX(5deg) scale(1)';
        };

        wrapper.addEventListener('mousemove', onMove);
        wrapper.addEventListener('mouseleave', onLeave);
        return () => {
            wrapper.removeEventListener('mousemove', onMove);
            wrapper.removeEventListener('mouseleave', onLeave);
        };
    }, [interactive]);

    const dim = SIZES[size];

    const cardStyle: CSSProperties = {
        width: dim.width,
        height: dim.height,
        borderRadius: 16,
        transform: 'perspective(1000px) rotateY(-8deg) rotateX(5deg) scale(1)',
        transition: interactive ? 'transform 0.12s ease-out' : 'none',
        transformStyle: 'preserve-3d',
        position: 'relative',
        background: 'linear-gradient(135deg, #F7931A 0%, #e07818 45%, #b85e10 100%)',
        boxShadow: '0 30px 60px rgba(247,147,26,0.40), 0 8px 20px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: interactive ? 'default' : 'inherit',
        flexShrink: 0,
    };

    return (
        <div ref={wrapperRef} className={`inline-block ${className}`} style={{ perspective: '1000px' }}>
            <div ref={cardRef} style={cardStyle}>

                {/* Subtle scan-line texture */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
                    pointerEvents: 'none',
                }} />

                {/* Diagonal gloss shine */}
                <div style={{
                    position: 'absolute',
                    top: '-60%', left: '-15%',
                    width: '55%', height: '220%',
                    background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)',
                    transform: 'rotate(-18deg)',
                    pointerEvents: 'none',
                }} />

                {/* Large ₿ watermark */}
                <div style={{
                    position: 'absolute', right: -14, bottom: -20,
                    fontSize: dim.btcBg,
                    color: 'rgba(255,255,255,0.07)',
                    fontWeight: 900,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    fontFamily: 'serif',
                }}>₿</div>

                {/* ── Top row ── */}
                <div style={{
                    position: 'absolute', top: 16, left: 20, right: 20,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{
                        color: 'rgba(255,255,255,0.95)',
                        fontSize: dim.brand,
                        fontWeight: 800,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                    }}>GIFTER</span>
                    <span style={{
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: dim.label,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                    }}>₿ BITCOIN</span>
                </div>

                {/* ── Centre: amount or "Gift Card" title ── */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    {amount ? (
                        <>
                            <span style={{
                                color: 'white',
                                fontSize: dim.amount,
                                fontWeight: 900,
                                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            }}>{amount}</span>
                            <span style={{
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: dim.label,
                                letterSpacing: '0.12em',
                                marginTop: 5,
                                textTransform: 'uppercase',
                            }}>Bitcoin Gift Card</span>
                        </>
                    ) : (
                        <>
                            <span style={{
                                color: 'rgba(255,255,255,0.75)',
                                fontSize: dim.brand,
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}>Bitcoin</span>
                            <span style={{
                                color: 'white',
                                fontSize: dim.amount,
                                fontWeight: 900,
                                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                lineHeight: 1.15,
                            }}>Gift Card</span>
                        </>
                    )}
                </div>

                {/* ── Bottom row ── */}
                <div style={{
                    position: 'absolute', bottom: 16, left: 20, right: 20,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                }}>
                    <span style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: dim.label,
                        letterSpacing: '0.08em',
                    }}>⚡ Lightning Network</span>

                    {/* Decorative "chip" */}
                    <div style={{
                        width: 38, height: 28,
                        borderRadius: 5,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)',
                        border: '1px solid rgba(255,255,255,0.22)',
                    }} />
                </div>
            </div>
        </div>
    );
};

export default BitcoinGiftCard;
