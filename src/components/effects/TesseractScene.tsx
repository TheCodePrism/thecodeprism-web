"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Simple 3D Noise implementation for the organic effect
const noise = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
`;

interface TesseractSceneProps {
    tesseractScale?: number;
    geodesicScale?: number;
}

const TesseractScene: React.FC<TesseractSceneProps> = ({
    tesseractScale = 1.0,
    geodesicScale = 1.0
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tesseractGroupRef = useRef<THREE.Group | null>(null);
    const shellRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (tesseractGroupRef.current) {
            tesseractGroupRef.current.scale.set(tesseractScale, tesseractScale, tesseractScale);
        }
    }, [tesseractScale]);

    useEffect(() => {
        if (shellRef.current) {
            shellRef.current.scale.set(geodesicScale, geodesicScale, geodesicScale);
        }
    }, [geodesicScale]);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
        let tesseract: THREE.LineSegments;
        let mainGroup: THREE.Group;
        let tesseractGroup: THREE.Group;
        let shell: THREE.Mesh;
        let energyField: THREE.Mesh;
        let starField: THREE.Points;
        let particles: THREE.Points;
        let vertexSpheres: THREE.Mesh[] = [];
        let animationFrameId: number;
        let time = 0;

        const init = () => {
            scene = new THREE.Scene();
            mainGroup = new THREE.Group();
            scene.add(mainGroup);

            tesseractGroup = new THREE.Group();
            tesseractGroup.scale.set(tesseractScale, tesseractScale, tesseractScale);
            tesseractGroupRef.current = tesseractGroup;
            mainGroup.add(tesseractGroup);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 12;

            const aa = window.devicePixelRatio <= 1; // Antialias only on low-DPI screens for performance
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: aa });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            // --- Tesseract Logic ---
            const vertices4D: number[][] = [];
            for (let x = -1; x <= 1; x += 2)
                for (let y = -1; y <= 1; y += 2)
                    for (let z = -1; z <= 1; z += 2)
                        for (let w = -1; w <= 1; w += 2)
                            vertices4D.push([x, y, z, w]);

            const edges: number[][] = [];
            const faces: number[][] = [];
            for (let i = 0; i < vertices4D.length; i++) {
                for (let j = i + 1; j < vertices4D.length; j++) {
                    let diff = 0;
                    for (let k = 0; k < 4; k++) if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
                    if (diff === 1) edges.push([i, j]);
                }
            }

            // Define the 24 faces of a tesseract with correct vertex ordering
            const fixedCoords = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
            fixedCoords.forEach(([c1, c2]) => {
                // For each pair of fixed coordinates, there are 4 faces
                const otherCoords = [0, 1, 2, 3].filter(c => c !== c1 && c !== c2);
                for (let v1 = -1; v1 <= 1; v1 += 2) {
                    for (let v2 = -1; v2 <= 1; v2 += 2) {
                        // Find the 4 vertices where coords c1 and c2 are fixed to v1 and v2
                        const faceNodes = [];
                        for (let a = -1; a <= 1; a += 2) {
                            for (let b = -1; b <= 1; b += 2) {
                                const v = [0, 0, 0, 0];
                                v[c1] = v1; v[c2] = v2;
                                v[otherCoords[0]] = a; v[otherCoords[1]] = b;
                                // Find index of this vertex
                                const idx = vertices4D.findIndex(vert => vert.every((val, i) => val === v[i]));
                                faceNodes.push({ idx, a, b });
                            }
                        }
                        // Order the 4 nodes in a cycle: (-1,-1), (-1,1), (1,1), (1,-1)
                        const sortedNodes = [
                            faceNodes.find(n => n.a === -1 && n.b === -1)!.idx,
                            faceNodes.find(n => n.a === -1 && n.b === 1)!.idx,
                            faceNodes.find(n => n.a === 1 && n.b === 1)!.idx,
                            faceNodes.find(n => n.a === 1 && n.b === -1)!.idx
                        ];
                        faces.push(sortedNodes);
                    }
                }
            });

            const rotate4D = (v: number[], a: any) => {
                let [x, y, z, w] = v;
                let c, s, nx, ny, nz, nw;

                // Rotate in planes that include 'W' to see the 4D effect
                // X-W rotation
                c = Math.cos(a.xw); s = Math.sin(a.xw);
                nx = x * c - w * s; nw = x * s + w * c; x = nx; w = nw;

                // Y-W rotation
                c = Math.cos(a.yw); s = Math.sin(a.yw);
                ny = y * c - w * s; nw = y * s + w * c; y = ny; w = nw;

                // Z-W rotation
                c = Math.cos(a.zw); s = Math.sin(a.zw);
                nz = z * c - w * s; nw = z * s + w * c; z = nz; w = nw;

                // Standard 3D rotations for overall orientation
                c = Math.cos(a.xy); s = Math.sin(a.xy); nx = x * c - y * s; ny = x * s + y * c; x = nx; y = ny;
                c = Math.cos(a.xz); s = Math.sin(a.xz); nx = x * c - z * s; nz = x * s + z * c; x = nx; z = nz;

                return [x, y, z, w];
            };

            const project4D = (v4: number[]) => {
                const [x, y, z, w] = v4;
                const d = 3.5;
                const p = 1 / (d - w);
                return {
                    pos: new THREE.Vector3(x * p * 5.5, y * p * 5.5, z * p * 5.5),
                    w: w
                };
            };

            const tessPositions = new Float32Array(edges.length * 2 * 3);
            const tessGeometry = new THREE.BufferGeometry();
            tessGeometry.setAttribute('position', new THREE.BufferAttribute(tessPositions, 3));
            const tessMaterial = new THREE.LineBasicMaterial({
                color: 0x60a5fa,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            tesseract = new THREE.LineSegments(tessGeometry, tessMaterial);
            tesseractGroup.add(tesseract);

            // Face Geometry
            const faceGeometry = new THREE.BufferGeometry();
            const facePositions = new Float32Array(faces.length * 6 * 3); // 2 triangles per face
            faceGeometry.setAttribute('position', new THREE.BufferAttribute(facePositions, 3));
            const faceMaterial = new THREE.MeshBasicMaterial({
                color: 0x3b82f6,
                transparent: true,
                opacity: 0.05,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
            tesseractGroup.add(faceMesh);

            // Vertex points
            const sphereGeom = new THREE.SphereGeometry(0.04, 8, 8);
            const sphereMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
            for (let i = 0; i < 16; i++) {
                const s = new THREE.Mesh(sphereGeom, sphereMat);
                tesseractGroup.add(s);
                vertexSpheres.push(s);
            }

            // Containment Shell - Organic Geodesic Wireframe
            const shellGeom = new THREE.IcosahedronGeometry(6, 3); // Increased detail to 3 for smoother waves
            const shellMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(0xe0e6ff) } // Platinum Silver
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying float vNoise;
                    uniform float uTime;
                    ${noise}
                    void main() {
                        vNormal = normal;
                        // Organic distortion - slower and more majestic
                        // Fix: scalar + vector broadcast is non-standard
                        vNoise = snoise(normal * 0.8 + vec3(uTime * 0.2));
                        // Displace vertices along normal
                        vec3 newPosition = position + normal * vNoise * 1.2;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    varying float vNoise;
                    uniform vec3 uColor;
                    void main() {
                        // Metallic shine simulation
                        float rim = 1.0 - max(0.0, abs(dot(vNormal, vec3(0.0, 0.0, 1.0))));
                        float shine = pow(rim, 3.0);
                        
                        // Base color mixed with noise for "shimmer"
                        vec3 finalColor = uColor + vec3(shine * 0.5);
                        
                        // Vary alpha for depth effect
                        float alpha = 0.3 + (vNoise * 0.1); 
                        gl_FragColor = vec4(finalColor, alpha);
                    }
                `,
                transparent: true,
                wireframe: true, // Key: Wireframe mode
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            shell = new THREE.Mesh(shellGeom, shellMaterial);
            shell.scale.set(geodesicScale, geodesicScale, geodesicScale);
            shellRef.current = shell;
            mainGroup.add(shell);
            energyField = shell;

            // Core Glow - Subtle White Center
            const coreGeom = new THREE.SphereGeometry(0.5, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
            const core = new THREE.Mesh(coreGeom, coreMat);
            mainGroup.add(core);

            // Keep the previous energyField as a light subtle wireframe if needed, 
            // but the user wants the new look, so let's adjust the energyField to be the inner glow.
            // energyField = shell; // Mapping for animation

            // Star Field
            const starGeom = new THREE.BufferGeometry();
            const starVertices = [];
            for (let i = 0; i < 1000; i++) starVertices.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
            starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.3 });
            starField = new THREE.Points(starGeom, starMat);
            scene.add(starField);

            // Lights
            scene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const pl = new THREE.PointLight(0x3b82f6, 1, 20);
            pl.position.set(0, 0, 0);
            scene.add(pl);

            const onResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', onResize);

            const angles = { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 };

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                time += 0.008; // Slower, more majestic movement

                // Harmonized 4D rotation frequencies
                angles.xw = time * 1.0;
                angles.yw = time * 0.7;
                angles.zw = time * 0.3;
                angles.xy = time * 0.5;
                angles.xz = time * 0.2;

                // Update Shell Noise
                if (shellMaterial.uniforms) {
                    shellMaterial.uniforms.uTime.value = time;
                }
                shell.rotation.y += 0.001;
                shell.rotation.z -= 0.0005;

                const positions = tesseract.geometry.attributes.position.array as Float32Array;
                let idx = 0;
                const rotated = vertices4D.map(v => rotate4D(v, angles));
                const projected = rotated.map(v => project4D(v));

                edges.forEach(([s, e]) => {
                    const v1 = projected[s].pos, v2 = projected[e].pos;
                    positions[idx++] = v1.x; positions[idx++] = v1.y; positions[idx++] = v1.z;
                    positions[idx++] = v2.x; positions[idx++] = v2.y; positions[idx++] = v2.z;
                });
                tesseract.geometry.attributes.position.needsUpdate = true;

                // Update Faces
                const fPositions = faceMesh.geometry.attributes.position.array as Float32Array;
                let fIdx = 0;
                faces.forEach(f => {
                    const v1 = projected[f[0]].pos, v2 = projected[f[1]].pos, v3 = projected[f[2]].pos, v4 = projected[f[3]].pos;
                    // Triangle 1
                    fPositions[fIdx++] = v1.x; fPositions[fIdx++] = v1.y; fPositions[fIdx++] = v1.z;
                    fPositions[fIdx++] = v2.x; fPositions[fIdx++] = v2.y; fPositions[fIdx++] = v2.z;
                    fPositions[fIdx++] = v3.x; fPositions[fIdx++] = v3.y; fPositions[fIdx++] = v3.z;
                    // Triangle 2
                    fPositions[fIdx++] = v1.x; fPositions[fIdx++] = v1.y; fPositions[fIdx++] = v1.z;
                    fPositions[fIdx++] = v3.x; fPositions[fIdx++] = v3.y; fPositions[fIdx++] = v3.z;
                    fPositions[fIdx++] = v4.x; fPositions[fIdx++] = v4.y; fPositions[fIdx++] = v4.z;
                });
                faceMesh.geometry.attributes.position.needsUpdate = true;

                vertexSpheres.forEach((s, i) => {
                    const p = projected[i];
                    s.position.set(p.pos.x, p.pos.y, p.pos.z);

                    // Scale spheres based on 4D distance
                    const scale = (p.w + 1.5) * 0.4;
                    s.scale.set(scale, scale, scale);
                });

                starField.rotation.y += 0.0005;
                renderer.render(scene, camera);
            };

            animate();
        };

        if (typeof window !== 'undefined') init();

        return () => {
            cancelAnimationFrame(animationFrameId);
            // Proper cleanup
            if (renderer) {
                renderer.dispose();
                container.removeChild(renderer.domElement);
            }
            scene?.clear();
        };
    }, []);

    return <div id="tesseract-canvas-container" ref={containerRef} />;
};

export default TesseractScene;
