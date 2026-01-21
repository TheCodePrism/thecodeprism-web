"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const LorenzAttractor: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        let scene: THREE.Scene;
        let camera: THREE.PerspectiveCamera;
        let renderer: THREE.WebGLRenderer;
        let animationFrameId: number;
        let particles: THREE.Points;
        let positions: Float32Array;
        let velocities: THREE.Vector3[];

        const particleCount = 2500;
        const pts: THREE.Vector3[] = [];

        // Lorenz Parameters
        const sigma = 10;
        const rho = 28;
        const beta = 8 / 3;

        // State for each particle
        const states = Array.from({ length: particleCount }, () => ({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: Math.random() * 30,
            dt: 0.005 + Math.random() * 0.01
        }));

        const init = () => {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 60;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            const geom = new THREE.BufferGeometry();
            positions = new Float32Array(particleCount * 3);

            const colors = new Float32Array(particleCount * 3);
            const color = new THREE.Color();

            for (let i = 0; i < particleCount; i++) {
                // Initial spread
                positions[i * 3] = states[i].x;
                positions[i * 3 + 1] = states[i].y;
                positions[i * 3 + 2] = states[i].z;

                // Color based on Z
                color.setHSL(0.6 + (states[i].z / 50) * 0.1, 0.8, 0.6);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }

            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const mat = new THREE.PointsMaterial({
                size: 0.15,
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });

            particles = new THREE.Points(geom, mat);
            scene.add(particles);

            const onResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', onResize);

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);

                const positionsAttr = particles.geometry.attributes.position.array as Float32Array;

                for (let i = 0; i < particleCount; i++) {
                    const state = states[i];

                    // Lorenz Equations
                    const dx = sigma * (state.y - state.x);
                    const dy = state.x * (rho - state.z) - state.y;
                    const dz = state.x * state.y - beta * state.z;

                    state.x += dx * state.dt;
                    state.y += dy * state.dt;
                    state.z += dz * state.dt;

                    positionsAttr[i * 3] = state.x;
                    positionsAttr[i * 3 + 1] = state.y;
                    positionsAttr[i * 3 + 2] = state.z;

                    // Fade out and reset if they wander too far (though Lorenz is bounded)
                    if (Math.abs(state.x) > 100 || Math.abs(state.y) > 100 || Math.abs(state.z) > 100) {
                        state.x = (Math.random() - 0.5) * 2;
                        state.y = (Math.random() - 0.5) * 2;
                        state.z = Math.random() * 30;
                    }
                }

                particles.geometry.attributes.position.needsUpdate = true;
                particles.rotation.y += 0.002;
                particles.rotation.z += 0.001;

                renderer.render(scene, camera);
            };

            animate();
        };

        init();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (renderer) {
                renderer.dispose();
                container.removeChild(renderer.domElement);
            }
            scene?.clear();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: -1,
                opacity: 0.4
            }}
        />
    );
};

export default LorenzAttractor;
