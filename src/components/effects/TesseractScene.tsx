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
    showTesseract?: boolean;
    showGeodesicShell?: boolean;
    tesseractSpeed?: number;
}

const TesseractScene: React.FC<TesseractSceneProps> = ({
    tesseractScale = 1.0,
    geodesicScale = 1.0,
    showTesseract = true,
    showGeodesicShell = true,
    tesseractSpeed = 1.0
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tesseractGroupRef = useRef<THREE.Group | null>(null);
    const shellRef = useRef<THREE.Mesh | null>(null);
    const mouseRef = useRef(new THREE.Vector2());
    const targetHoverRef = useRef(0);
    const currentHoverRef = useRef(0);

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

    const showTesseractRef = useRef(showTesseract);
    const showShellRef = useRef(showGeodesicShell);

    useEffect(() => {
        showTesseractRef.current = showTesseract;
    }, [showTesseract]);

    useEffect(() => {
        showShellRef.current = showGeodesicShell;
    }, [showGeodesicShell]);

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
        const raycaster = new THREE.Raycaster();

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

            const aa = window.devicePixelRatio <= 1;
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

            const fixedCoords = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
            fixedCoords.forEach(([c1, c2]) => {
                const otherCoords = [0, 1, 2, 3].filter(c => c !== c1 && c !== c2);
                for (let v1 = -1; v1 <= 1; v1 += 2) {
                    for (let v2 = -1; v2 <= 1; v2 += 2) {
                        const faceNodes = [];
                        for (let a = -1; a <= 1; a += 2) {
                            for (let b = -1; b <= 1; b += 2) {
                                const v = [0, 0, 0, 0];
                                v[c1] = v1; v[c2] = v2;
                                v[otherCoords[0]] = a; v[otherCoords[1]] = b;
                                const idx = vertices4D.findIndex(vert => vert.every((val, i) => val === v[i]));
                                faceNodes.push({ idx, a, b });
                            }
                        }
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

            // Buffers for reuse
            const projectedPositions = new Float32Array(16 * 3);
            const projectedW = new Float32Array(16);
            const dummyMatrix = new THREE.Matrix4();
            const dummyPosition = new THREE.Vector3();
            const dummyScale = new THREE.Vector3();
            const dummyQuaternion = new THREE.Quaternion();

            const rotate4D = (v: number[], a: any, out: number[]) => {
                let [x, y, z, w] = v;
                let c, s, nx, ny, nz, nw;

                c = Math.cos(a.xw); s = Math.sin(a.xw);
                nx = x * c - w * s; nw = x * s + w * c; x = nx; w = nw;

                c = Math.cos(a.yw); s = Math.sin(a.yw);
                ny = y * c - w * s; nw = y * s + w * c; y = ny; w = nw;

                c = Math.cos(a.zw); s = Math.sin(a.zw);
                nz = z * c - w * s; nw = z * s + w * c; z = nz; w = nw;

                c = Math.cos(a.xy); s = Math.sin(a.xy); nx = x * c - y * s; ny = x * s + y * c; x = nx; y = ny;
                c = Math.cos(a.xz); s = Math.sin(a.xz); nx = x * c - z * s; nz = x * s + z * c; x = nx; z = nz;

                out[0] = x; out[1] = y; out[2] = z; out[3] = w;
            };

            const tempV4 = [0, 0, 0, 0];
            const project4D = (v4: number[], outIdx: number) => {
                const [x, y, z, w] = v4;
                const d = 3.5;
                const p = 1 / (d - w);
                projectedPositions[outIdx * 3] = x * p * 5.5;
                projectedPositions[outIdx * 3 + 1] = y * p * 5.5;
                projectedPositions[outIdx * 3 + 2] = z * p * 5.5;
                projectedW[outIdx] = w;
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

            const faceGeometry = new THREE.BufferGeometry();
            const facePositionsBuffer = new Float32Array(faces.length * 6 * 3);
            faceGeometry.setAttribute('position', new THREE.BufferAttribute(facePositionsBuffer, 3));
            const faceMaterial = new THREE.MeshBasicMaterial({
                color: 0x3b82f6,
                transparent: true,
                opacity: 0.05,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
            tesseractGroup.add(faceMesh);

            // Vertex points as InstancedMesh (Reduction from 16 draw calls to 1)
            const sphereGeom = new THREE.SphereGeometry(0.04, 8, 8);
            const sphereMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
            const instancedSpheres = new THREE.InstancedMesh(sphereGeom, sphereMat, 16);
            tesseractGroup.add(instancedSpheres);

            const shellGeom = new THREE.IcosahedronGeometry(6, 3);
            const shellMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(0xe0e6ff) },
                    uMouse: { value: new THREE.Vector2(0, 0) },
                    uHover: { value: 0.0 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying float vNoise;
                    varying vec3 vViewPosition;
                    uniform float uTime;
                    uniform vec2 uMouse;
                    uniform float uHover;
                    ${noise}
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vNoise = snoise(normal * 0.8 + vec3(uTime * 0.2));
                        vec3 pos = position;
                        vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
                        vec2 mouseDir = uMouse.xy - worldPos.xy * 0.1;
                        float dist = length(mouseDir);
                        float force = clamp(1.0 - dist * 0.5, 0.0, 1.0);
                        vec3 newPosition = pos + normal * vNoise * (1.2 + uHover * 1.0);
                        newPosition += normal * force * 0.8;
                        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
                        vViewPosition = -mvPosition.xyz;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    varying float vNoise;
                    varying vec3 vViewPosition;
                    uniform vec3 uColor;
                    uniform float uHover;
                    void main() {
                        vec3 viewDir = normalize(vViewPosition);
                        float rim = 1.0 - max(0.0, abs(dot(vNormal, vec3(0.0, 0.0, 1.0))));
                        float shine = pow(rim, 3.0);
                        vec3 baseColor = uColor;
                        vec3 hoverColor = vec3(0.4, 0.6, 1.0);
                        vec3 mixedColor = mix(baseColor, hoverColor, uHover * 0.5);
                        vec3 finalColor = mixedColor + vec3(shine * (0.5 + uHover * 1.5));
                        float alpha = (0.3 + (vNoise * 0.1)) * (1.0 + uHover * 0.5); 
                        gl_FragColor = vec4(finalColor, alpha);
                    }
                `,
                transparent: true,
                wireframe: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            shell = new THREE.Mesh(shellGeom, shellMaterial);
            shell.scale.set(geodesicScale, geodesicScale, geodesicScale);
            shellRef.current = shell;
            mainGroup.add(shell);
            energyField = shell;

            const coreGeom = new THREE.SphereGeometry(0.5, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
            const core = new THREE.Mesh(coreGeom, coreMat);
            mainGroup.add(core);

            const starGeom = new THREE.BufferGeometry();
            const starVertices = [];
            for (let i = 0; i < 1000; i++) starVertices.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
            starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.3 });
            starField = new THREE.Points(starGeom, starMat);
            scene.add(starField);

            scene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const pl = new THREE.PointLight(0x3b82f6, 1, 20);
            scene.add(pl);

            window.addEventListener('resize', onResize);
            window.addEventListener('mousemove', onMouseMove);

            const angles = { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 };

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const speedBase = 0.008 * tesseractSpeed;
                time += speedBase;

                raycaster.setFromCamera(mouseRef.current, camera);
                const intersects = raycaster.intersectObject(shell);
                targetHoverRef.current = intersects.length > 0 ? 1 : 0;
                currentHoverRef.current += (targetHoverRef.current - currentHoverRef.current) * 0.1;

                // Harmonized Rotation Coefficients (Syncing 3D/4D)
                angles.xw = time * 0.6; // Primary 4D unfold
                angles.yw = time * 0.6; // Secondary 4D fold
                angles.zw = time * 0.6; // Tertiary 4D axis
                angles.xy = time * 0.6; // Primary 3D tumble
                angles.xz = time * 0.6; // Secondary 3D tumble

                if (shellMaterial.uniforms) {
                    shellMaterial.uniforms.uTime.value = time;
                    shellMaterial.uniforms.uMouse.value.copy(mouseRef.current);
                    shellMaterial.uniforms.uHover.value = currentHoverRef.current;
                }
                shell.rotation.y += 0.001;
                shell.rotation.z -= 0.0005;

                // Visibility control
                tesseract.visible = showTesseractRef.current;
                faceMesh.visible = showTesseractRef.current;
                instancedSpheres.visible = showTesseractRef.current;
                shell.visible = showShellRef.current;
                core.visible = showShellRef.current;

                // Projection logic (Now object-free inside loop)
                if (showTesseractRef.current) {
                    const positions = tesseract.geometry.attributes.position.array as Float32Array;
                    let idx = 0;

                    for (let i = 0; i < 16; i++) {
                        rotate4D(vertices4D[i], angles, tempV4);
                        project4D(tempV4, i);
                    }

                    edges.forEach(([s, e]) => {
                        positions[idx++] = projectedPositions[s * 3];
                        positions[idx++] = projectedPositions[s * 3 + 1];
                        positions[idx++] = projectedPositions[s * 3 + 2];
                        positions[idx++] = projectedPositions[e * 3];
                        positions[idx++] = projectedPositions[e * 3 + 1];
                        positions[idx++] = projectedPositions[e * 3 + 2];
                    });
                    tesseract.geometry.attributes.position.needsUpdate = true;

                    const fPositionsAttr = faceMesh.geometry.attributes.position.array as Float32Array;
                    let fIdx = 0;
                    faces.forEach(f => {
                        const v = [
                            f[0] * 3, f[1] * 3, f[2] * 3, f[3] * 3
                        ];

                        for (let i = 0; i < 3; i++) fPositionsAttr[fIdx++] = projectedPositions[v[0] + i];
                        for (let i = 0; i < 3; i++) fPositionsAttr[fIdx++] = projectedPositions[v[1] + i];
                        for (let i = 0; i < 3; i++) fPositionsAttr[fIdx++] = projectedPositions[v[2] + i];

                        for (let i = 0; i < 3; i++) fPositionsAttr[fIdx++] = projectedPositions[v[0] + i];
                        for (let i = 0; i < 3; i++) fPositionsAttr[fIdx++] = projectedPositions[v[2] + i];
                        for (let i = 0; i < 3; i++) fPositionsAttr[fIdx++] = projectedPositions[v[3] + i];
                    });
                    faceMesh.geometry.attributes.position.needsUpdate = true;

                    // Update InstancedMesh
                    for (let i = 0; i < 16; i++) {
                        dummyPosition.set(
                            projectedPositions[i * 3],
                            projectedPositions[i * 3 + 1],
                            projectedPositions[i * 3 + 2]
                        );
                        const scale = (projectedW[i] + 1.5) * 0.4;
                        dummyScale.set(scale, scale, scale);
                        dummyMatrix.compose(dummyPosition, dummyQuaternion, dummyScale);
                        instancedSpheres.setMatrixAt(i, dummyMatrix);
                    }
                    instancedSpheres.instanceMatrix.needsUpdate = true;
                }

                starField.rotation.y += 0.0005;
                renderer.render(scene, camera);
            };

            animate();
        };

        const onResize = () => {

            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        };

        const onMouseMove = (event: MouseEvent) => {
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        if (typeof window !== 'undefined') init();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouseMove);
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
