"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

type Theme = 'light' | 'dark';

interface ThemeTokens {
    accent: string;
    accentSoft: string;
    accentLight: string;
    fontMain: string;
    glassBg: string;
    glassBorder: string;
    glassBlur: string;
}

interface EffectsConfig {
    showMatrix: boolean;
    showTesseract: boolean;
    showGeodesicShell: boolean;
    showCustomCursor: boolean;
    enableAnimations: boolean;
    enableParallax: boolean;
    glassmorphism: boolean;
    enableLensing: boolean;
    showAttractor: boolean;
    quantumState: boolean;
    stellarPalette: boolean;
    entropySystem: boolean;
    fluidBackground: boolean;
    tesseractScale: number;
    geodesicScale: number;
}

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    tokens: ThemeTokens;
    effects: EffectsConfig;
    updateEffects: (effects: Partial<EffectsConfig>) => void;
    updateAccent: (color: string) => void;
    profile: any | null;
    loadingProfile: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [accent, setAccent] = useState('#4facfe');
    const [profile, setProfile] = useState<any | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [effects, setEffects] = useState<EffectsConfig>({
        showMatrix: true,
        showTesseract: true,
        showGeodesicShell: true,
        showCustomCursor: true,
        enableAnimations: true,
        enableParallax: true,
        glassmorphism: true,
        enableLensing: false,
        showAttractor: false,
        quantumState: false,
        stellarPalette: false,
        entropySystem: false,
        fluidBackground: false,
        tesseractScale: 1.0,
        geodesicScale: 1.0
    });

    useEffect(() => {
        // Local state sync
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Global config sync from Firestore
        const unsub = onSnapshot(doc(db, "config", "profile_data"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(data);
                if (data.theme?.primaryColor) setAccent(data.theme.primaryColor);
                setEffects(prev => ({
                    ...prev,
                    showMatrix: data.theme?.showMatrix ?? true,
                    showTesseract: data.theme?.showTesseract ?? true,
                    showGeodesicShell: data.theme?.showGeodesicShell ?? true,
                    showCustomCursor: data.theme?.showCustomCursor ?? true,
                    glassmorphism: data.theme?.glassmorphism ?? true,
                    enableAnimations: data.theme?.enableAnimations ?? true,
                    enableParallax: data.theme?.enableParallax ?? true,
                    enableLensing: data.theme?.enableLensing ?? false,
                    showAttractor: data.theme?.showAttractor ?? false,
                    quantumState: data.theme?.quantumState ?? false,
                    stellarPalette: data.theme?.stellarPalette ?? false,
                    entropySystem: data.theme?.entropySystem ?? false,
                    fluidBackground: data.theme?.fluidBackground ?? false,
                    tesseractScale: data.theme?.tesseractScale ?? 1.0,
                    geodesicScale: data.theme?.geodesicScale ?? 1.0,
                }));
            }
            setLoadingProfile(false);
        });

        return unsub;
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const updateEffects = (newEffects: Partial<EffectsConfig>) => {
        setEffects(prev => ({ ...prev, ...newEffects }));
    };

    const updateAccent = (color: string) => {
        setAccent(color);
    };

    const tokens: ThemeTokens = {
        accent,
        accentSoft: `${accent}4d`,
        accentLight: `${accent}1a`,
        fontMain: 'Inter, sans-serif',
        glassBg: effects.glassmorphism ? (theme === 'dark' ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.7)') : (theme === 'dark' ? '#0a0a0a' : '#ffffff'),
        glassBorder: effects.glassmorphism ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)') : (theme === 'dark' ? '#222' : '#ddd'),
        glassBlur: effects.glassmorphism ? '10px' : '0px',
    };

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent', tokens.accent);
        root.style.setProperty('--accent-soft', tokens.accentSoft);
        root.style.setProperty('--accent-light', tokens.accentLight);
        root.style.setProperty('--font-main', tokens.fontMain);
        root.style.setProperty('--glass-bg', tokens.glassBg);
        root.style.setProperty('--glass-border', tokens.glassBorder);
        root.style.setProperty('--glass-blur', tokens.glassBlur);
    }, [tokens]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, tokens, effects, updateEffects, updateAccent, profile, loadingProfile }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
