"use client";

import React, { useEffect, useState } from 'react';
import styles from './QuantumLoader.module.css';

const STATUS_MESSAGES = [
    "ANALYZING_REDSHIFT_DATA",
    "DECODING_QUASAR_LOGS",
    "INIT_GRAVITY_BUFFER",
    "MAPPING_EVENT_HORIZON",
    "SYNCHRONIZING_GRID_ARRAYS",
    "CALIBRATING_SCHWARZSCHILD_RADIUS",
    "FETCHING_NEBULA_CONSTRUCTS",
    "OPTIMIZING_DARK_MATTER_FLUX"
];

export default function QuantumLoader() {
    const [statusIndex, setStatusIndex] = useState(0);
    const [dots, setDots] = useState("");

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        }, 1200);

        const dotInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 400);

        return () => {
            clearInterval(messageInterval);
            clearInterval(dotInterval);
        };
    }, []);

    return (
        <div className={styles.loaderContainer}>
            <div className={styles.backgroundGrid} />

            {/* Shooting Stars (Astrophysics) */}
            <div className={styles.shootingStar} style={{ top: '10%', left: '20%', animationDelay: '0s' }} />
            <div className={styles.shootingStar} style={{ top: '30%', left: '80%', animationDelay: '4s' }} />
            <div className={styles.shootingStar} style={{ top: '60%', left: '10%', animationDelay: '8s' }} />
            <div className={styles.shootingStar} style={{ top: '80%', left: '50%', animationDelay: '12s' }} />

            <div className={styles.visualCore}>
                {/* Orbital Rings with Satellites (Astrophysics) */}
                <div className={styles.ring} style={{ transform: 'rotateX(70deg) rotateY(0deg)' }}>
                    <div className={styles.satellite} style={{ animationDelay: '0s' }} />
                </div>
                <div className={styles.ring} style={{ transform: 'rotateX(70deg) rotateY(60deg)' }}>
                    <div className={styles.satellite} style={{ animationDelay: '-2s' }} />
                </div>
                <div className={styles.ring} style={{ transform: 'rotateX(70deg) rotateY(-60deg)' }}>
                    <div className={styles.satellite} style={{ animationDelay: '-4s' }} />
                </div>

                {/* Wireframe Cube (Computer Engineering) */}
                <div className={styles.cube}>
                    <div className={styles.cubeFace} />
                    <div className={styles.cubeFace} />
                    <div className={styles.cubeFace} />
                    <div className={styles.cubeFace} />
                    <div className={styles.cubeFace} />
                    <div className={styles.cubeFace} />
                </div>

                <div className={styles.coreGlow} />
            </div>

            <div className={styles.footerInfo}>
                <div className={styles.statusLine}>
                    <span className={styles.label}>[ SYSTEM_ACTIVE ]</span>
                    <span className={styles.message}>
                        {STATUS_MESSAGES[statusIndex]}{dots}
                    </span>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} />
                </div>
                <div className={styles.technicalDeets}>
                    <span>COORD: 23.5°N 45.9°E</span>
                    <span>FLUX: 1.21 GW</span>
                    <span>ENTROPY: DECREASING</span>
                </div>
            </div>
        </div>
    );
}
