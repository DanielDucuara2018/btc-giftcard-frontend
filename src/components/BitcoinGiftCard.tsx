import { useRef, useEffect, CSSProperties } from 'react';

export type GiftCardSize = 'sm' | 'md' | 'lg';

interface BitcoinGiftCardProps {
    amount?: string;
    size?: GiftCardSize;
    interactive?: boolean;
    className?: string;
}

const SIZES = {
    //                                                            qr   code       panelPad
    sm: { width: 240, height: 151, btcBg: 90, brand: '0.65rem', label: '0.55rem', amount: '1.4rem', qr: 40, code: '0.7rem', panelPad: 7 },
    md: { width: 340, height: 214, btcBg: 130, brand: '0.85rem', label: '0.7rem', amount: '2rem', qr: 62, code: '1.0rem', panelPad: 10 },
    lg: { width: 440, height: 277, btcBg: 170, brand: '1.05rem', label: '0.85rem', amount: '2.6rem', qr: 80, code: '1.2rem', panelPad: 12 },
} as const;

// ── Decorative QR code (non-scanning, visually authentic) ─────────────────────
const QRCode = ({ size }: { size: number }) => {
    const N = 21;
    const m = size / N;
    const g: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false) as boolean[]);

    // Place a 7×7 finder pattern at (row, col)
    const finder = (r: number, c: number) => {
        for (let dr = 0; dr < 7; dr++) {
            for (let dc = 0; dc < 7; dc++) {
                const border = dr === 0 || dr === 6 || dc === 0 || dc === 6;
                const center = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
                g[r + dr][c + dc] = border || center;
            }
        }
    };
    finder(0, 0); finder(0, 14); finder(14, 0);

    // Timing patterns (row 6 / col 6, between finders)
    for (let i = 8; i < 13; i++) {
        g[6][i] = i % 2 === 0;
        g[i][6] = i % 2 === 0;
    }

    // Reserved mask (finders + separators + timing)
    const reserved: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false) as boolean[]);
    for (let r = 0; r <= 8; r++) {
        for (let c = 0; c <= 8; c++) reserved[r][c] = true;
        for (let c = 13; c < N; c++) reserved[r][c] = true;
    }
    for (let r = 13; r < N; r++) for (let c = 0; c <= 8; c++) reserved[r][c] = true;
    for (let i = 8; i < 13; i++) { reserved[6][i] = true; reserved[i][6] = true; }

    // Fill data region with a deterministic pattern
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            if (!reserved[r][c])
                g[r][c] = (r * 7 + c * 11 + r * c) % 3 === 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="#1a1a1a" style={{ display: 'block' }}>
            {g.flatMap((row, r) =>
                row.flatMap((filled, c) =>
                    filled
                        ? [<rect key={`${r}-${c}`} x={c * m + m * 0.05} y={r * m + m * 0.05} width={m * 0.9} height={m * 0.9} rx={m * 0.15} />]
                        : [],
                ),
            )}
        </svg>
    );
};

// ── Component ─────────────────────────────────────────────────────────────────
const BitcoinGiftCard = ({
    amount,
    size = 'md',
    interactive = false,
    className = '',
}: BitcoinGiftCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        const wrapper = wrapperRef.current;
        if (!card || !wrapper || !interactive) return;

        // ── State ────────────────────────────────────────────────────────────
        type Mode = 'resting' | 'dragging' | 'snapping';
        let mode: Mode = 'resting';
        let faceY = 0;    // settled face angle (0 = front, 180 = back, multiples ok)
        let currentY = -8;   // live displayed angle — matches CSS default
        let startX = 0;    // clientX at drag start
        let startRotY = 0;   // currentY at drag start
        let rafId = 0;

        // ── Helpers ──────────────────────────────────────────────────────────
        const setCursor = (c: string) => { wrapper.style.cursor = c; card.style.cursor = c; };

        const setTransform = (y: number, tiltX = 5, scale = 1) => {
            card.style.transform =
                `perspective(1000px) rotateY(${y}deg) rotateX(${tiltX}deg) scale(${scale})`;
        };

        /** Nearest face angle — 0°/±360°/… = front, ±180°/±540°/… = back */
        const nearestFace = (y: number): number => {
            const mod = ((y % 360) + 360) % 360;          // 0 … 360
            if (mod <= 90 || mod >= 270)
                return Math.round(y / 360) * 360;         // front face
            return Math.round((y - 180) / 360) * 360 + 180; // back face
        };

        /** Ease-out cubic snap to target, then enter resting mode */
        const snapTo = (target: number) => {
            mode = 'snapping';
            const from = currentY;
            const delta = target - from;
            if (Math.abs(delta) < 0.5) {
                currentY = target; faceY = target;
                setTransform(target); mode = 'resting'; return;
            }
            const dur = 400;
            const t0 = performance.now();
            const step = (now: number) => {
                const t = Math.min((now - t0) / dur, 1);
                currentY = from + delta * (1 - (1 - t) ** 3); // ease-out cubic
                setTransform(currentY);
                if (t < 1) { rafId = requestAnimationFrame(step); }
                else { faceY = target; currentY = target; mode = 'resting'; }
            };
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(step);
        };

        // ── Mouse handlers ───────────────────────────────────────────────────
        const onMouseDown = (e: MouseEvent) => {
            cancelAnimationFrame(rafId);
            mode = 'dragging';
            startX = e.clientX;
            startRotY = currentY;
            setCursor('grabbing');
            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (mode === 'dragging') {
                // 0.6°/px — dragging ~300 px flips the card
                currentY = startRotY + (e.clientX - startX) * 0.6;
                setTransform(currentY, 5, 1.02);
                return;
            }
            if (mode === 'resting') {
                // Gentle tilt follows cursor — no auto-flip
                const r = wrapper.getBoundingClientRect();
                const nx = (e.clientX - r.left) / r.width - 0.5; // −0.5 … 0.5
                const ny = (e.clientY - r.top) / r.height - 0.5;
                setTransform(faceY + nx * 9, 5 - ny * 7, 1.02);
            }
        };

        const onMouseLeave = () => {
            if (mode !== 'resting') return;
            setTransform(faceY, 5, 1); // reset tilt
        };

        const onMouseUp = () => {
            if (mode !== 'dragging') return;
            setCursor('grab');
            snapTo(nearestFace(currentY));
        };

        // ── Touch handlers ───────────────────────────────────────────────────
        const onTouchStart = (e: TouchEvent) => {
            cancelAnimationFrame(rafId);
            mode = 'dragging';
            startX = e.touches[0].clientX;
            startRotY = currentY;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (mode !== 'dragging') return;
            currentY = startRotY + (e.touches[0].clientX - startX) * 0.6;
            setTransform(currentY, 5, 1.02);
            e.preventDefault(); // block page scroll during drag
        };

        const onTouchEnd = () => {
            if (mode !== 'dragging') return;
            snapTo(nearestFace(currentY));
        };

        // ── Init ─────────────────────────────────────────────────────────────
        card.style.transition = 'none';
        setTransform(currentY);
        setCursor('grab');

        wrapper.addEventListener('mousedown', onMouseDown);
        wrapper.addEventListener('mousemove', onMouseMove);
        wrapper.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('mouseup', onMouseUp);
        wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
        wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
        wrapper.addEventListener('touchend', onTouchEnd);

        return () => {
            wrapper.removeEventListener('mousedown', onMouseDown);
            wrapper.removeEventListener('mousemove', onMouseMove);
            wrapper.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('mouseup', onMouseUp);
            wrapper.removeEventListener('touchstart', onTouchStart);
            wrapper.removeEventListener('touchmove', onTouchMove);
            wrapper.removeEventListener('touchend', onTouchEnd);
            cancelAnimationFrame(rafId);
        };
    }, [interactive]);

    const dim = SIZES[size];

    // Breathing room so the 3D transform + orange glow shadow don't get clipped
    const padH = Math.round(dim.width * 0.05);   // ~12 / 17 / 22 px
    const padVT = Math.round(dim.height * 0.07);   // ~11 / 15 / 19 px
    const padVB = Math.round(dim.height * 0.16);   // ~24 / 34 / 44 px

    const cardStyle: CSSProperties = {
        width: dim.width,
        height: dim.height,
        // interactive cards: transform managed imperatively in useEffect
        // non-interactive cards: static 3D pose via CSS
        transform: 'perspective(1000px) rotateY(-8deg) rotateX(5deg) scale(1)',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
    };

    const faceBase: CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: 16,
        overflow: 'hidden',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: 'linear-gradient(135deg, #F7931A 0%, #e07818 45%, #b85e10 100%)',
        boxShadow: '0 30px 60px rgba(247,147,26,0.40), 0 8px 20px rgba(0,0,0,0.12)',
    };

    // Shared decorative overlays (called as functions to produce fresh elements)
    const Scanlines = () => (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
            pointerEvents: 'none',
        }} />
    );
    const Gloss = () => (
        <div style={{
            position: 'absolute', top: '-60%', left: '-15%',
            width: '55%', height: '220%',
            background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)',
            transform: 'rotate(-18deg)', pointerEvents: 'none',
        }} />
    );
    const TopRow = () => (
        <div style={{ position: 'absolute', top: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: dim.brand, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>GIFTER</span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: dim.label, fontWeight: 600, letterSpacing: '0.1em' }}>₿ BITCOIN</span>
        </div>
    );
    const BottomRow = () => (
        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: dim.label, letterSpacing: '0.08em' }}>⚡ Lightning Network</span>
            <div style={{ width: 38, height: 28, borderRadius: 5, background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)', border: '1px solid rgba(255,255,255,0.22)' }} />
        </div>
    );

    return (
        <div ref={wrapperRef} className={`inline-block ${className}`} style={{ perspective: '1000px', padding: `${padVT}px ${padH}px ${padVB}px` }}>
            <div ref={cardRef} style={cardStyle}>

                {/* ── FRONT FACE ── */}
                <div style={faceBase}>
                    <Scanlines />
                    <Gloss />
                    {/* ₿ watermark — right */}
                    <div style={{ position: 'absolute', right: -14, bottom: -20, fontSize: dim.btcBg, color: 'rgba(255,255,255,0.07)', fontWeight: 900, lineHeight: 1, pointerEvents: 'none', fontFamily: 'serif' }}>₿</div>
                    <TopRow />
                    {/* Centre: amount or title */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {amount ? (
                            <>
                                <span style={{ color: 'white', fontSize: dim.amount, fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{amount}</span>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: dim.label, letterSpacing: '0.12em', marginTop: 5, textTransform: 'uppercase' }}>Bitcoin Gift Card</span>
                            </>
                        ) : (
                            <>
                                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: dim.brand, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bitcoin</span>
                                <span style={{ color: 'white', fontSize: dim.amount, fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.2)', lineHeight: 1.15 }}>Gift Card</span>
                            </>
                        )}
                    </div>
                    <BottomRow />
                </div>

                {/* ── BACK FACE — orange, QR code + gift code ── */}
                <div style={{ ...faceBase, transform: 'rotateY(180deg)' }}>
                    <Scanlines />
                    <Gloss />
                    {/* ₿ watermark — left (mirrored) */}
                    <div style={{ position: 'absolute', left: -8, top: -12, fontSize: dim.btcBg, color: 'rgba(255,255,255,0.07)', fontWeight: 900, lineHeight: 1, pointerEvents: 'none', fontFamily: 'serif' }}>₿</div>
                    <TopRow />
                    {/* Centre: inset redemption panel — QR left, code right */}
                    <div style={{ position: 'absolute', left: 14, right: 14, top: 38, bottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.18)',
                            borderRadius: 10,
                            padding: dim.panelPad,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}>
                            {/* QR mini-card */}
                            <div style={{ background: 'white', borderRadius: 6, padding: 4, flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
                                <QRCode size={dim.qr} />
                            </div>
                            {/* Code column */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                                <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: dim.label, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600 }}>Redemption code</span>
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                                    <span style={{ color: 'white', fontSize: dim.code, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.04em', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>GIFT-A1B2-C3D4-E5F6</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <BottomRow />
                </div>

            </div>
        </div>
    );
};

export default BitcoinGiftCard;
