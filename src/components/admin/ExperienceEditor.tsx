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
import { Plus, Trash2, Edit2, X, Check, History, Briefcase, Calendar, AlignLeft } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface Experience {
    id: string;
    period: string;
    role: string;
    company: string;
    desc: string;
    createdAt: string;
}

export default function ExperienceEditor() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentExp, setCurrentExp] = useState<Partial<Experience>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "experience"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Experience));
            setExperiences(items);
        });
        return unsub;
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...currentExp,
                updatedAt: new Date().toISOString(),
                createdAt: currentExp.createdAt || new Date().toISOString()
            };

            if (currentExp.id) {
                await updateDoc(doc(db, "experience", currentExp.id), data);
            } else {
                await addDoc(collection(db, "experience"), data);
            }
            setIsEditing(false);
            setCurrentExp({});
        } catch (error) {
            console.error("Error saving experience:", error);
            alert("Failed to save experience");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this experience?")) {
            try {
                await deleteDoc(doc(db, "experience", id));
            } catch (error) {
                console.error("Error deleting experience:", error);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className={styles.title}>Chronicle Trace</h2>
                <button
                    onClick={() => {
                        setCurrentExp({ role: '', period: '', company: '', desc: '' });
                        setIsEditing(true);
                    }}
                    className={styles.primaryBtn}
                >
                    <Plus size={18} /> New Milestone
                </button>
            </div>

            {isEditing && (
                <div className={styles.glassCard} style={{ marginBottom: '3rem' }}>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Role / Designation</label>
                                <div style={{ position: 'relative' }}>
                                    <Briefcase size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px' }}
                                        value={currentExp.role || ''}
                                        onChange={e => setCurrentExp({ ...currentExp, role: e.target.value })}
                                        placeholder="Senior Architect"
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Period</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px' }}
                                        value={currentExp.period || ''}
                                        onChange={e => setCurrentExp({ ...currentExp, period: e.target.value })}
                                        placeholder="2024 - PRESENT"
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Company / Agency</label>
                                <div style={{ position: 'relative' }}>
                                    <History size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px' }}
                                        value={currentExp.company || ''}
                                        onChange={e => setCurrentExp({ ...currentExp, company: e.target.value })}
                                        placeholder="Acme Corp"
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Description</label>
                                <div style={{ position: 'relative' }}>
                                    <AlignLeft size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <textarea
                                        className={styles.input}
                                        style={{ paddingLeft: '44px', minHeight: '100px', resize: 'vertical' }}
                                        value={currentExp.desc || ''}
                                        onChange={e => setCurrentExp({ ...currentExp, desc: e.target.value })}
                                        required
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
                                {loading ? 'Materializing...' : <><Check size={18} /> Commit Milestone</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {experiences.map(exp => (
                    <div key={exp.id} className={styles.glassCard} style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--admin-accent)', opacity: 0.8 }}>[{exp.period}]</span>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{exp.role}</h3>
                            </div>
                            <h4 style={{ color: 'var(--admin-accent)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '600' }}>@ {exp.company}</h4>
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', maxWidth: '800px' }}>{exp.desc}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => {
                                    setCurrentExp(exp);
                                    setIsEditing(true);
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--admin-accent)', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(exp.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
