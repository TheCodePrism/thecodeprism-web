"use client";

import React, { useEffect, useState } from 'react';

const EntropySystem: React.FC = () => {
    const [entropy, setEntropy] = useState(0);
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let idleTimer: any;
        let entropyInterval: any;

        const resetIdle = () => {
            setIsIdle(false);
            setEntropy(0);
            clearTimeout(idleTimer);
            clearInterval(entropyInterval);

            idleTimer = setTimeout(() => {
                setIsIdle(true);
            }, 5000); // 5 seconds of idle starts entropy
        };

        const growEntropy = () => {
            if (isIdle) {
                entropyInterval = setInterval(() => {
                    setEntropy(prev => Math.min(prev + 0.05, 5)); // Max entropy factor of 5
                }, 100);
            }
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
            clearInterval(entropyInterval);
        };
    }, [isIdle]);

    useEffect(() => {
        if (isIdle) {
            const interval = setInterval(() => {
                setEntropy(prev => Math.min(prev + 0.02, 5));
            }, 200);
            return () => clearInterval(interval);
        }
    }, [isIdle]);

    return (
        <>
            <div id="entropy-meter">ENTROPY: {entropy.toFixed(4)}</div>
            <style jsx global>{`
                .entropy-target {
                    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s ease;
                    transform: 
                        skew(${entropy * 0.5}deg) 
                        translate(${entropy * 2}px, ${entropy * 1}px)
                        rotate(${entropy * 0.1}deg);
                    filter: blur(${entropy * 0.5}px);
                }
                
                #entropy-meter {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    font-family: monospace;
                    font-size: 10px;
                    color: var(--admin-accent);
                    opacity: ${entropy > 0 ? 0.6 : 0};
                    pointer-events: none;
                    z-index: 10000;
                    letter-spacing: 2px;
                    background: rgba(0,0,0,0.5);
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(4px);
                    transition: opacity 0.3s ease;
                }
            `}</style>
        </>
    );
};

export default EntropySystem;
