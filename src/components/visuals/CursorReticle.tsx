"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './CursorReticle.module.css';

export default function CursorReticle() {
    const mainRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const [hoverType, setHoverType] = useState<'none' | 'link' | 'card' | 'action'>('none');
    const [status, setStatus] = useState('IDLE');

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            const { clientX: x, clientY: y } = e;

            // Fast follow for dot
            gsap.to(dotRef.current, {
                x, y,
                duration: 0.1,
                ease: "power2.out"
            });

            // Delayed follow for ring (smooth)
            gsap.to(ringRef.current, {
                x, y,
                duration: 0.4,
                ease: "power3.out"
            });
        };

        const handleOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable = target.closest('a, button, .glass-card');

            if (isClickable) {
                if (target.closest('.glass-card')) {
                    setHoverType('card');
                    setStatus('ANALYZE');
                } else {
                    setHoverType('link');
                    setStatus('EXECUTE');
                }

                gsap.to(ringRef.current, {
                    scale: 1.5,
                    borderColor: 'var(--accent)',
                    borderWidth: '2px',
                    duration: 0.3
                });
                gsap.to(dotRef.current, {
                    scale: 2,
                    backgroundColor: 'var(--accent)',
                    duration: 0.3
                });
            }
        };

        const handleOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('a, button, .glass-card')) {
                setHoverType('none');
                setStatus('IDLE');
                gsap.to(ringRef.current, {
                    scale: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: '1px',
                    duration: 0.3
                });
                gsap.to(dotRef.current, {
                    scale: 1,
                    backgroundColor: 'white',
                    duration: 0.3
                });
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleOver);
        window.addEventListener('mouseout', handleOut);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleOver);
            window.removeEventListener('mouseout', handleOut);
        };
    }, []);

    return (
        <div className={styles.cursorWrapper} ref={mainRef}>
            {/* Smooth Outer Ring */}
            <div className={styles.ring} ref={ringRef}>
                <div className={styles.statusText}>{status}</div>
                <div className={styles.reticleTop} />
                <div className={styles.reticleBottom} />
            </div>

            {/* Sharp Center Dot */}
            <div className={styles.dot} ref={dotRef} />

            {/* Dynamic Scanning Line (only on hover) */}
            {hoverType !== 'none' && <div className={styles.scanner} />}
        </div>
    );
}
