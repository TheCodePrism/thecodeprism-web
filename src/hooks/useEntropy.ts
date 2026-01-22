"use client";

import { useState, useEffect } from 'react';

/**
 * useEntropy hook tracks user activity (mouse, keyboard, scroll) and calculates
 * a "chaos factor" that grows when the user is idle.
 * @param idleTimeout - Time in ms before entropy starts growing
 * @returns entropy - A number from 0 to 5 indicating current chaos level
 */
export function useEntropy(idleTimeout = 5000) {
    const [entropy, setEntropy] = useState(0);
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let idleTimer: NodeJS.Timeout;
        let growthInterval: NodeJS.Timeout;

        const resetIdle = () => {
            setIsIdle(false);
            setEntropy(0);
            clearTimeout(idleTimer);

            idleTimer = setTimeout(() => {
                setIsIdle(true);
            }, idleTimeout);
        };

        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keydown', resetIdle);
        window.addEventListener('scroll', resetIdle);

        resetIdle();

        return () => {
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('keydown', resetIdle);
            window.removeEventListener('scroll', resetIdle);
            clearTimeout(idleTimer);
        };
    }, [idleTimeout]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isIdle) {
            interval = setInterval(() => {
                setEntropy(prev => Math.min(prev + 0.02, 5));
            }, 150);
        }
        return () => clearInterval(interval);
    }, [isIdle]);

    return entropy;
}
