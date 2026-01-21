"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MatrixRain from "./MatrixRain";
import TesseractScene from "./TesseractScene";
import CustomCursor from "./CustomCursor";
import LorenzAttractor from "./LorenzAttractor";
import GravitationalLensing from "./GravitationalLensing";
import FluidBackground from "./FluidBackground";
import EntropySystem from "./EntropySystem";

interface ThemeSettings {
    showMatrix: boolean;
    showTesseract: boolean;
    showCustomCursor: boolean;
    glassmorphism: boolean;
    enableLensing: boolean;
    showAttractor: boolean;
    quantumState: boolean;
    stellarPalette: boolean;
    entropySystem: boolean;
    fluidBackground: boolean;
    tesseractScale: number;
}

export default function GlobalEffectsWrapper() {
    const [settings, setSettings] = useState<ThemeSettings | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "config", "profile_data"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings({
                    showMatrix: data.theme?.showMatrix ?? true,
                    showTesseract: data.theme?.showTesseract ?? true,
                    showCustomCursor: data.theme?.showCustomCursor ?? true,
                    glassmorphism: data.theme?.glassmorphism ?? true,
                    enableLensing: data.theme?.enableLensing ?? false,
                    showAttractor: data.theme?.showAttractor ?? false,
                    quantumState: data.theme?.quantumState ?? false,
                    stellarPalette: data.theme?.stellarPalette ?? false,
                    entropySystem: data.theme?.entropySystem ?? false,
                    fluidBackground: data.theme?.fluidBackground ?? false,
                    tesseractScale: data.theme?.tesseractScale ?? 1.0,
                });
            }
        });
        return unsub;
    }, []);

    if (!settings) return null;

    return (
        <>
            {settings.showMatrix && <MatrixRain />}
            {settings.showTesseract && <TesseractScene scale={settings.tesseractScale} />}
            {settings.showCustomCursor && <CustomCursor />}

            {/* Universal Laws */}
            {settings.showAttractor && <LorenzAttractor />}
            {settings.enableLensing && <GravitationalLensing />}
            {settings.fluidBackground && <FluidBackground />}
            {settings.entropySystem && <EntropySystem />}


            {/* Inject glassmorphism variables if needed, or handle via classes in components */}
            <style jsx global>{`
                :root {
                    --glass-opacity: ${settings.glassmorphism ? '0.1' : '0'};
                    --glass-blur: ${settings.glassmorphism ? '12px' : '0'};
                    
                    /* Quantum Substrate */
                    --quantum-blur: ${settings.quantumState ? '10px' : '0'};

                    /* Stellar Palette (O-Class Blue Overrides) */
                    ${settings.stellarPalette ? `
                        --admin-accent: #9bb0ff;
                        --admin-accent-glow: rgba(155, 176, 255, 0.4);
                        --accent-blue: #9bb0ff;
                    ` : ''}
                }

                ${settings.quantumState ? `
                    .quantum-substrate:not(:hover) {
                        filter: blur(var(--quantum-blur));
                        transition: filter 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .quantum-substrate:hover {
                        filter: blur(0);
                    }
                ` : ''}
            `}</style>
        </>
    );
}
