"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { Check, Settings, Shield, Sparkles, Move } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface ProfileData {
    name: string;
    headline: string;
    bio: string;
    avatarUrl: string;
    email: string;
    socials: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
    theme?: {
        primaryColor: string;
        fontFamily: string;
        glassmorphism: boolean;
        showMatrix: boolean;
        showTesseract: boolean;
        showCustomCursor: boolean;
        enableAnimations: boolean;
        enableParallax: boolean;
        showAvatar: boolean;
        showJournal: boolean;
        enableLensing: boolean;
        showAttractor: boolean;
        quantumState: boolean;
        stellarPalette: boolean;
        entropySystem: boolean;
        fluidBackground: boolean;
        tesseractScale: number;
        geodesicScale: number;
        showGeodesicShell: boolean;
        tesseractSpeed: number;
    };
}

export default function SettingsEditor() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "config", "profile_data"), (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as ProfileData);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "config", "profile_data"), {
                ...profile,
                updatedAt: new Date().toISOString()
            });
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.subtitle}>Loading Settings...</div>;
    if (!profile) return <div className={styles.subtitle}>No settings found.</div>;

    return (
        <div>
            <h2 className={styles.title} style={{ marginBottom: '2rem' }}>Experience Settings</h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className={styles.glassCard}>
                    <h3 className={styles.subtitle} style={{ marginBottom: '2.5rem', fontSize: '1rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Sparkles size={20} className={styles.accentText} /> Feature Control Center
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem 4rem' }}>
                        {/* Visual Effects */}
                        <div>
                            <h4 className={styles.label} style={{ marginBottom: '1.5rem' }}>Visual Effects</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Toggle
                                    id="matrix"
                                    label="Matrix Rain Background"
                                    checked={!!profile.theme?.showMatrix}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showMatrix: v } as any })}
                                />
                                <Toggle
                                    id="tesseract"
                                    label="4D Tesseract Scene"
                                    checked={!!profile.theme?.showTesseract}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showTesseract: v } as any })}
                                />
                                <Toggle
                                    id="cursor"
                                    label="Custom Dual-Cursor"
                                    checked={!!profile.theme?.showCustomCursor}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showCustomCursor: v } as any })}
                                />
                                <Toggle
                                    id="geodesic"
                                    label="Geodesic Wireframe Shell"
                                    checked={!!profile.theme?.showGeodesicShell}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showGeodesicShell: v } as any })}
                                />
                                <Toggle
                                    id="glass"
                                    label="Glassmorphism Effects"
                                    checked={!!profile.theme?.glassmorphism}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), glassmorphism: v } as any })}
                                />
                                <div style={{ marginTop: '1rem' }}>
                                    <label className={styles.label} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                        Tesseract Visual Scale <span>{profile.theme?.tesseractScale || 1.0}x</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.2"
                                        max="2.0"
                                        step="0.1"
                                        value={profile.theme?.tesseractScale || 1.0}
                                        onChange={e => setProfile({ ...profile, theme: { ...(profile.theme || {}), tesseractScale: parseFloat(e.target.value) } as any })}
                                        style={{ width: '100%', marginTop: '8px', accentColor: 'var(--admin-accent)' }}
                                    />
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <label className={styles.label} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                        Tesseract Rotation Speed <span>{profile.theme?.tesseractSpeed || 1.0}x</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="5.0"
                                        step="0.1"
                                        value={profile.theme?.tesseractSpeed || 1.0}
                                        onChange={e => setProfile({ ...profile, theme: { ...(profile.theme || {}), tesseractSpeed: parseFloat(e.target.value) } as any })}
                                        style={{ width: '100%', marginTop: '8px', accentColor: 'var(--admin-accent)' }}
                                    />
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <label className={styles.label} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                        Geodesic Shell Scale <span>{profile.theme?.geodesicScale || 1.0}x</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3.0"
                                        step="0.1"
                                        value={profile.theme?.geodesicScale || 1.0}
                                        onChange={e => setProfile({ ...profile, theme: { ...(profile.theme || {}), geodesicScale: parseFloat(e.target.value) } as any })}
                                        style={{ width: '100%', marginTop: '8px', accentColor: 'var(--admin-accent)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Motion & Interaction */}
                        <div>
                            <h4 className={styles.label} style={{ marginBottom: '1.5rem' }}>Motion & Interaction</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Toggle
                                    id="animations"
                                    label="GSAP Scroll Animations"
                                    checked={!!profile.theme?.enableAnimations}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), enableAnimations: v } as any })}
                                />
                                <Toggle
                                    id="parallax"
                                    label="Parallax Backgrounds"
                                    checked={!!profile.theme?.enableParallax}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), enableParallax: v } as any })}
                                />
                                <Toggle
                                    id="avatar"
                                    label="Show Profile Avatar"
                                    checked={!!profile.theme?.showAvatar}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showAvatar: v } as any })}
                                />
                                <Toggle
                                    id="journal"
                                    label="Show Journal Section"
                                    checked={!!profile.theme?.showJournal}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showJournal: v } as any })}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid var(--admin-border)' }}>
                        <h4 className={styles.label} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={16} className={styles.accentText} /> Universal Laws (Physics & Math)
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem 4rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Toggle
                                    id="lensing"
                                    label="Gravitational Lensing (Cursor Warp)"
                                    checked={!!profile.theme?.enableLensing}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), enableLensing: v } as any })}
                                />
                                <Toggle
                                    id="attractor"
                                    label="Lorenz Attractor (Chaotic Particles)"
                                    checked={!!profile.theme?.showAttractor}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), showAttractor: v } as any })}
                                />
                                <Toggle
                                    id="quantum"
                                    label="Quantum Observation (Blur Collapse)"
                                    checked={!!profile.theme?.quantumState}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), quantumState: v } as any })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Toggle
                                    id="stellar"
                                    label="Stellar Classification Palette"
                                    checked={!!profile.theme?.stellarPalette}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), stellarPalette: v } as any })}
                                />
                                <Toggle
                                    id="entropy"
                                    label="UI Entropy System (Idle Chaos)"
                                    checked={!!profile.theme?.entropySystem}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), entropySystem: v } as any })}
                                />
                                <Toggle
                                    id="fluid"
                                    label="Navier-Stokes Fluid Background"
                                    checked={!!profile.theme?.fluidBackground}
                                    onChange={v => setProfile({ ...profile, theme: { ...(profile.theme || {}), fluidBackground: v } as any })}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid var(--admin-border)' }}>
                        <h4 className={styles.label} style={{ marginBottom: '1.5rem' }}>Design Token DNA</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem 3rem' }}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Primary Accent Color</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: profile.theme?.primaryColor || '#4facfe',
                                        border: '1px solid var(--admin-border)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <input
                                            type="color"
                                            style={{ position: 'absolute', top: -5, left: -5, width: '150%', height: '150%', cursor: 'pointer', border: 'none' }}
                                            value={profile.theme?.primaryColor || '#4facfe'}
                                            onChange={e => setProfile({ ...profile, theme: { ...(profile.theme || {}), primaryColor: e.target.value } as any })}
                                        />
                                    </div>
                                    <input
                                        className={styles.input}
                                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}
                                        value={profile.theme?.primaryColor || ''}
                                        onChange={e => setProfile({ ...profile, theme: { ...(profile.theme || {}), primaryColor: e.target.value } as any })}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Font Family</label>
                                <select
                                    className={styles.input}
                                    style={{ cursor: 'pointer' }}
                                    value={profile.theme?.fontFamily || 'Inter, sans-serif'}
                                    onChange={e => setProfile({ ...profile, theme: { ...(profile.theme || {}), fontFamily: e.target.value } as any })}
                                >
                                    <option value="Inter, sans-serif">Inter (Modern & Clean)</option>
                                    <option value="'Courier New', monospace">Courier (Technical & Retro)</option>
                                    <option value="'Playfair Display', serif">Playfair (Elegant Serif)</option>
                                    <option value="'Outfit', sans-serif">Outfit (Geometric & Bold)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.primaryBtn}
                    >
                        {saving ? 'Syncing...' : <><Check size={18} /> Update Matrix</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Toggle({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => onChange(!checked)}>
            <div style={{
                width: '42px',
                height: '24px',
                background: checked ? 'var(--admin-accent)' : 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid var(--admin-border)'
            }}>
                <div style={{
                    width: '18px',
                    height: '18px',
                    background: checked ? '#000' : '#444',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: checked ? '20px' : '2px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
            </div>
            <label htmlFor={id} style={{ fontSize: '0.9rem', color: checked ? '#fff' : 'var(--admin-text-secondary)', cursor: 'pointer', transition: 'color 0.3s' }}>{label}</label>
        </div>
    );
}
