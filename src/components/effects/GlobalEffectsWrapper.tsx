"use client";

import MatrixRain from "./MatrixRain";
import TesseractScene from "./TesseractScene";
import CustomCursor from "./CustomCursor";
import LorenzAttractor from "./LorenzAttractor";
import GravitationalLensing from "./GravitationalLensing";
import FluidBackground from "./FluidBackground";
import EntropySystem from "./EntropySystem";
import { useTheme } from "../ThemeProvider";

export default function GlobalEffectsWrapper() {
    const { effects, loadingProfile } = useTheme();

    if (loadingProfile) return null;

    return (
        <>
            {effects.showMatrix && <MatrixRain />}
            {(effects.showTesseract || effects.showGeodesicShell) && (
                <TesseractScene
                    tesseractScale={effects.tesseractScale}
                    geodesicScale={effects.geodesicScale}
                    showTesseract={effects.showTesseract}
                    showGeodesicShell={effects.showGeodesicShell}
                    tesseractSpeed={effects.tesseractSpeed}
                />
            )}
            {effects.showCustomCursor && <CustomCursor />}

            {/* Universal Laws */}
            {effects.showAttractor && <LorenzAttractor />}
            {effects.enableLensing && <GravitationalLensing />}
            {effects.fluidBackground && <FluidBackground />}
            {effects.entropySystem && <EntropySystem />}


            <style jsx global>{`
                :root {
                    --glass-opacity: ${effects.glassmorphism ? '0.1' : '0'};
                    --glass-blur: ${effects.glassmorphism ? '12px' : '0'};
                    
                    /* Quantum Substrate */
                    --quantum-blur: ${effects.quantumState ? '10px' : '0'};

                    /* Stellar Palette (O-Class Blue Overrides) */
                    ${effects.stellarPalette ? `
                        --admin-accent: #9bb0ff;
                        --admin-accent-glow: rgba(155, 176, 255, 0.4);
                        --accent-blue: #9bb0ff;
                    ` : ''}
                }

                ${effects.quantumState ? `
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
