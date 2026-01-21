"use client";

import React, { useEffect, useState, useRef } from 'react';

const GravitationalLensing: React.FC = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scrollPos, setScrollPos] = useState(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.pageX, y: e.pageY });
        };
        const handleScroll = () => {
            setScrollPos(window.scrollY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Initial scroll
        setScrollPos(window.scrollY);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // The "Perfect Fix": Limit the filter's calculation region to only the current viewport
    const viewportY = scrollPos - 200; // Extra padding
    const viewportH = typeof window !== 'undefined' ? window.innerHeight + 400 : 2000;

    return (
        <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 9999 }}>
            <svg width="0" height="0">
                <defs>
                    <filter
                        id="gravitational-lens"
                        filterUnits="userSpaceOnUse"
                        x="0"
                        y={viewportY}
                        width="100%"
                        height={viewportH}
                    >
                        {/* Create a displacement map that is neutral (gray) except for a radial area */}
                        <feFlood floodColor="rgb(128,128,128)" result="neutral-gray" />

                        {/* The "lens" bump: a radial gradient that creates a ripple/warp effect */}
                        <feImage
                            href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxyZWRzPg0KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0ibGVucyIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4NCiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9InJnYigyMDAsMjAwLDIwMCkiIC8+DQogICAgICA8c3RvcCBvZmZzZXQ9IjQwJSIgc3RvcC1jb2xvcj0icmdiKDEyOCwxMjgsMTI4KSIgLz4NCiAgICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSJyZ2IoNjAsNjAsNjApIiAvPg0KICAgICAgPHN0b3Agb2Zmc2V0PSI4MCUiIHN0b3AtY29sb3I9InJnYigxMjgsMTI4LDEyOCkiIC8+DQogICAgPC9yYWRpYWxHcmFkaWVudD4NCiAgPC9yZWRzPg0KICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIzMDAiIHI9IjMwMCIgZmlsbD0idXJsKCNsZW5zKSIgLz4NCjwvc3ZnPg=="
                            x={mousePos.x - 300}
                            y={mousePos.y - 300}
                            width="600"
                            height="600"
                            preserveAspectRatio="none"
                            result="lens-map"
                        />

                        {/* Blend the lens map over the neutral gray */}
                        <feBlend in="lens-map" in2="neutral-gray" mode="normal" result="displacement-source" />

                        {/* Use the combined map to displace the background */}
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="displacement-source"
                            scale="40"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            <style jsx global>{`
                #lensing-substrate {
                    filter: url(#gravitational-lens);
                    will-change: filter;
                }
                /* Exclude the admin panel from lensing to keep it usable */
                #thecodeprism-admin-root, .admin-no-warp {
                    filter: none !important;
                }
            `}</style>
        </div>
    );
};

export default GravitationalLensing;
