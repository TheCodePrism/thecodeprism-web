"use client";

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed top-6 right-6 z-[100] p-3 rounded-full glass-panel hover:scale-110 transition-all duration-300 group"
            aria-label="Toggle Theme"
        >
            <div className="relative w-6 h-6 flex items-center justify-center">
                <Sun
                    className={`absolute w-6 h-6 text-amber-400 transition-all duration-500 transform ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                        }`}
                />
                <Moon
                    className={`absolute w-6 h-6 text-blue-400 transition-all duration-500 transform ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                        }`}
                />
            </div>

            {/* Tooltip background effect */}
            <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </button>
    );
};

export default ThemeToggle;
