"use client";

import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
    opacity?: number;
    color?: string;
    fontSize?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({
    opacity = 0.15,
    color = "#0F0",
    fontSize = 14
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let columns: number;
        let drops: number[];
        const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$%#@!*&?";

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            columns = Math.floor(window.innerWidth / fontSize);
            drops = Array.from({ length: columns }, () => 1);
        };

        const draw = () => {
            ctx.fillStyle = `rgba(15, 23, 42, 0.1)`; // Match site background with slight trail
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            ctx.fillStyle = color;
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > window.innerHeight && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, fontSize]);

    return (
        <div id="matrix-canvas-container" style={{ opacity }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default MatrixRain;
