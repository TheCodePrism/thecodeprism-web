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
import { Plus, Trash2, Edit2, X, Check, Link as LinkIcon, Image as ImageIcon, Tag } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface Project {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    link: string;
    tags: string[];
    createdAt: string;
}

export default function ProjectEditor() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Project));
            setProjects(items);
        });
        return unsub;
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...currentProject,
                updatedAt: new Date().toISOString(),
                createdAt: currentProject.createdAt || new Date().toISOString()
            };

            if (currentProject.id) {
                await updateDoc(doc(db, "projects", currentProject.id), data);
            } else {
                await addDoc(collection(db, "projects"), data);
            }
            setIsEditing(false);
            setCurrentProject({});
        } catch (error) {
            console.error("Error saving project:", error);
            alert("Failed to save project");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this project?")) {
            try {
                await deleteDoc(doc(db, "projects", id));
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className={styles.title}>Portfolio Projects</h2>
                <button
                    onClick={() => {
                        setCurrentProject({ tags: [] });
                        setIsEditing(true);
                    }}
                    className={styles.primaryBtn}
                >
                    <Plus size={18} /> New Construct
                </button>
            </div>

            {isEditing && (
                <div className={styles.glassCard} style={{ marginBottom: '3rem' }}>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Project Title</label>
                                <input
                                    className={styles.input}
                                    value={currentProject.title || ''}
                                    onChange={e => setCurrentProject({ ...currentProject, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Image URL</label>
                                <div style={{ position: 'relative' }}>
                                    <ImageIcon size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px', width: '100%' }}
                                        value={currentProject.imageUrl || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Description</label>
                                <textarea
                                    className={styles.input}
                                    style={{ minHeight: '120px', resize: 'vertical' }}
                                    value={currentProject.description || ''}
                                    onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Project Link (Optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <LinkIcon size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px', width: '100%' }}
                                        value={currentProject.link || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Tags (comma separated)</label>
                                <div style={{ position: 'relative' }}>
                                    <Tag size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: '#555' }} />
                                    <input
                                        className={styles.input}
                                        style={{ paddingLeft: '44px', width: '100%' }}
                                        value={currentProject.tags?.join(', ') || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, tags: e.target.value.split(',').map(s => s.trim()) })}
                                        placeholder="React, Firebase, Next.js"
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
                                {loading ? 'Materializing...' : <><Check size={18} /> Commit Construct</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {projects.map(project => (
                    <div key={project.id} className={styles.glassCard} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {project.imageUrl && (
                            <div style={{ width: '100%', height: '180px', overflow: 'hidden', borderBottom: '1px solid var(--admin-border)' }}>
                                <img src={project.imageUrl} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                            </div>
                        )}
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{project.title}</h3>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => {
                                            setCurrentProject(project);
                                            setIsEditing(true);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--admin-accent)', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '8px', opacity: 0.6 }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: '1.6', flex: 1 }}>{project.description}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1.5rem' }}>
                                {project.tags?.map(tag => (
                                    <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--admin-accent)', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(79, 172, 254, 0.2)' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
