"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import { Plus, Trash2, Edit2, X, Check, Brain, BarChart3, Tag } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface Skill {
    id: string;
    label: string;
    level: number;
    category?: string;
    createdAt: string;
}

export default function SkillsEditor() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSkill, setCurrentSkill] = useState<Partial<Skill>>({ label: '', level: 80 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "skills"), orderBy("label", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Skill));
            setSkills(items);
        });
        return unsub;
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...currentSkill,
                updatedAt: new Date().toISOString(),
                createdAt: currentSkill.createdAt || new Date().toISOString()
            };

            if (currentSkill.id) {
                await updateDoc(doc(db, "skills", currentSkill.id), data);
            } else {
                await addDoc(collection(db, "skills"), data);
            }
            setIsEditing(false);
            setCurrentSkill({ label: '', level: 80 });
        } catch (error) {
            console.error("Error saving skill:", error);
            alert("Failed to save skill");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this skill?")) {
            try {
                await deleteDoc(doc(db, "skills", id));
            } catch (error) {
                console.error("Error deleting skill:", error);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className={styles.title}>Skills Matrix</h2>
                <button
                    onClick={() => {
                        setCurrentSkill({ label: '', level: 80 });
                        setIsEditing(true);
                    }}
                    className={styles.primaryBtn}
                >
                    <Plus size={18} /> New Skill Ingress
                </button>
            </div>

            {isEditing && (
                <div className={styles.glassCard} style={{ marginBottom: '3rem' }}>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Skill Label</label>
                                <div style={{ position: 'relative' }}>
                                    <Tag size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px' }}
                                        value={currentSkill.label || ''}
                                        onChange={e => setCurrentSkill({ ...currentSkill, label: e.target.value })}
                                        placeholder="e.g. Frontend Architecture"
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Competency Level (%): {currentSkill.level}%</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <BarChart3 size={18} color="var(--admin-accent)" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        style={{ flex: 1, accentColor: 'var(--admin-accent)' }}
                                        value={currentSkill.level}
                                        onChange={e => setCurrentSkill({ ...currentSkill, level: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                style={{ background: 'transparent', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.primaryBtn}
                            >
                                {loading ? 'Synthesizing...' : <><Check size={18} /> Commit skill</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {skills.map(skill => (
                    <div key={skill.id} className={styles.glassCard} style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Brain size={18} style={{ color: 'var(--admin-accent)' }} />
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{skill.label}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => {
                                        setCurrentSkill(skill);
                                        setIsEditing(true);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--admin-accent)', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(skill.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${skill.level}%`, height: '100%', background: 'var(--admin-accent)', boxShadow: '0 0 10px var(--admin-accent)' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--admin-accent)' }}>{skill.level}%</span>
                        </div>
                    </div>
                ))}
                {skills.length === 0 && !loading && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', opacity: 0.4, border: '1px dashed var(--admin-border)', borderRadius: '20px' }}>
                        [ NO SKILL DATA DETECTED ]
                    </div>
                )}
            </div>
        </div>
    );
}
