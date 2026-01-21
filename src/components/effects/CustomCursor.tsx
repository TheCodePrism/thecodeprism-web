"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check for touch device or reduced motion
        const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isTouch || prefersReducedMotion) return;

        const cursor = cursorRef.current;
        const follower = followerRef.current;

        if (!cursor || !follower) return;

        // Set initial state
        gsap.set([cursor, follower], { xPercent: -50, yPercent: -50, opacity: 0 });

        const moveCursor = (e: MouseEvent) => {
            if (!isVisible) setIsVisible(true);

            // Immediate movement for primary cursor
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                opacity: 1,
                ease: "power2.out"
            });

            // Delayed smooth movement for follower
            gsap.to(follower, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.6,
                opacity: 0.3,
                ease: "expo.out"
            });
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('button') ||
                target.closest('a')
            ) {
                setIsHovering(true);
            }
        };

        const handleMouseOut = () => setIsHovering(false);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
        };
    }, [isVisible]);

    return (
        <>
            <div
                ref={cursorRef}
                className={`fixed top-0 left-0 w-5 h-5 border-2 border-primary rounded-full pointer-events-none z-[9999] mix-blend-difference transition-transform duration-200 ease-out ${isHovering ? 'scale-150 bg-primary/10' : ''
                    } ${isClicking ? 'scale-75 bg-primary/30' : ''}`}
            />
            <div
                ref={followerRef}
                className={`fixed top-0 left-0 w-10 h-10 border-2 border-primary/30 rounded-full pointer-events-none z-[9998] transition-transform duration-500 ease-out ${isHovering ? 'scale-150' : ''
                    }`}
            />
        </>
    );
};

export default CustomCursor;
