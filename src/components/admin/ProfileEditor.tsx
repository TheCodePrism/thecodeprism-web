"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { Check, User, Mail, Github, Linkedin, Twitter, Globe, Camera } from "lucide-react";
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
    };
}

export default function ProfileEditor() {
    const [profile, setProfile] = useState<ProfileData>({
        name: "",
        headline: "",
        bio: "",
        avatarUrl: "",
        email: "",
        socials: {},
        theme: {
            primaryColor: '#4facfe',
            fontFamily: 'Inter, sans-serif',
            glassmorphism: true,
            showMatrix: true,
            showTesseract: true,
            showCustomCursor: true,
            enableAnimations: true,
            enableParallax: true,
            showAvatar: true,
            showJournal: true,
            enableLensing: false,
            showAttractor: false,
            quantumState: false,
            stellarPalette: false,
            entropySystem: false,
            fluidBackground: false,
            tesseractScale: 1.0
        }
    });
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
        setSaving(true);
        try {
            await setDoc(doc(db, "config", "profile_data"), {
                ...profile,
                updatedAt: new Date().toISOString()
            });
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.subtitle}>Loading Profile...</div>;

    return (
        <div>
            <h2 className={styles.title} style={{ marginBottom: '2rem' }}>Personal Profile</h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className={styles.glassCard}>
                    <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '140px',
                                height: '140px',
                                borderRadius: '70px',
                                background: 'rgba(255,255,255,0.03)',
                                overflow: 'hidden',
                                border: '1px solid var(--admin-border)',
                                boxShadow: '0 0 30px rgba(0,0,0,0.5)'
                            }}>
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={56} color="#444" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Full Name</label>
                                <input
                                    className={styles.input}
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Headline / Role</label>
                                <input
                                    className={styles.input}
                                    value={profile.headline}
                                    onChange={e => setProfile({ ...profile, headline: e.target.value })}
                                    placeholder="Full Stack Developer & AI Enthusiast"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.inputGroup} style={{ marginTop: '2rem' }}>
                        <label className={styles.label}>Avatar URL</label>
                        <div style={{ position: 'relative' }}>
                            <Camera size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                            <input
                                className={styles.input}
                                style={{ paddingLeft: '44px', width: '100%' }}
                                value={profile.avatarUrl}
                                onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Bio</label>
                        <textarea
                            className={styles.input}
                            style={{ minHeight: '150px', resize: 'vertical' }}
                            value={profile.bio}
                            onChange={e => setProfile({ ...profile, bio: e.target.value })}
                        />
                    </div>
                </div>

                <div className={styles.glassCard}>
                    <h3 className={styles.subtitle} style={{ marginBottom: '2rem', fontSize: '1rem', fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Social Nexus & Contact</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <SocialInput
                            icon={<Mail size={18} />}
                            label="Contact Email"
                            value={profile.email}
                            onChange={v => setProfile({ ...profile, email: v })}
                        />
                        <SocialInput
                            icon={<Github size={18} />}
                            label="GitHub Profile"
                            value={profile.socials.github || ''}
                            onChange={v => setProfile({ ...profile, socials: { ...profile.socials, github: v } })}
                        />
                        <SocialInput
                            icon={<Linkedin size={18} />}
                            label="LinkedIn Profile"
                            value={profile.socials.linkedin || ''}
                            onChange={v => setProfile({ ...profile, socials: { ...profile.socials, linkedin: v } })}
                        />
                        <SocialInput
                            icon={<Twitter size={18} />}
                            label="Twitter / X"
                            value={profile.socials.twitter || ''}
                            onChange={v => setProfile({ ...profile, socials: { ...profile.socials, twitter: v } })}
                        />
                        <SocialInput
                            icon={<Globe size={18} />}
                            label="Personal Website"
                            value={profile.socials.website || ''}
                            onChange={v => setProfile({ ...profile, socials: { ...profile.socials, website: v } })}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.primaryBtn}
                    >
                        {saving ? 'Syncing...' : <><Check size={18} /> Update Synthesis</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SocialInput({ icon, label, value, onChange }: { icon: React.ReactNode, label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className={styles.inputGroup}>
            <label className={styles.label}>{label}</label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }}>{icon}</div>
                <input
                    className={styles.input}
                    style={{ paddingLeft: '48px', width: '100%' }}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="https://..."
                />
            </div>
        </div>
    );
}
