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
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { Plus, Trash2, Edit2, X, Check, Eye, FileText, Tag, Calendar, Send } from "lucide-react";
import { sendPushNotification } from "@/lib/notifications";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    tags: string[];
    status: 'draft' | 'published';
    publishedAt: any;
    updatedAt: any;
}

export default function BlogEditor() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "blog_posts"), orderBy("updatedAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BlogPost));
            setPosts(items);
        });
        return unsub;
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const slug = currentPost.slug || currentPost.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const data = {
                ...currentPost,
                slug,
                updatedAt: serverTimestamp(),
                publishedAt: currentPost.status === 'published' ? (currentPost.publishedAt || serverTimestamp()) : null
            };

            if (currentPost.id) {
                await updateDoc(doc(db, "blog_posts", currentPost.id), data);
                if (currentPost.status === 'published') {
                    sendPushNotification("✍️ Article Updated", `"${currentPost.title}" has been updated.`);
                }
            } else {
                await addDoc(collection(db, "blog_posts"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                if (currentPost.status === 'published') {
                    sendPushNotification("🎉 New Article Published!", `"${currentPost.title}" is now live!`);
                }
            }
            setIsEditing(false);
            setCurrentPost({});
        } catch (error) {
            console.error("Error saving post:", error);
            alert("Failed to save post");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Permanently delete this article?")) {
            try {
                await deleteDoc(doc(db, "blog_posts", id));
            } catch (error) {
                console.error("Error deleting post:", error);
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 className={styles.title}>Journal & Articles</h2>
                <button
                    onClick={() => {
                        setCurrentPost({ tags: [], status: 'draft', content: '' });
                        setIsEditing(true);
                    }}
                    className={styles.primaryBtn}
                >
                    <Plus size={18} /> Compose Transmission
                </button>
            </div>

            {isEditing && (
                <div className={styles.glassCard} style={{ marginBottom: '3rem' }}>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                            <div style={{ flex: '1 1 500px', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Article Title</label>
                                    <input
                                        className={styles.input}
                                        style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.5px' }}
                                        value={currentPost.title || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                                        required
                                        placeholder="Enter a catchy title..."
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Content (Markdown Supported)</label>
                                    <textarea
                                        className={styles.input}
                                        style={{ minHeight: '450px', resize: 'vertical', fontFamily: 'var(--font-mono, monospace)', lineHeight: '1.7', fontSize: '0.95rem' }}
                                        value={currentPost.content || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                                        required
                                        placeholder="Commence transmission..."
                                    />
                                </div>
                            </div>

                            <div style={{ flex: '1 1 300px', maxWidth: '360px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                                    <h3 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Orbital Metadata</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Status</label>
                                            <select
                                                className={styles.input}
                                                style={{ padding: '10px' }}
                                                value={currentPost.status}
                                                onChange={e => setCurrentPost({ ...currentPost, status: e.target.value as any })}
                                            >
                                                <option value="draft">Fragment (Draft)</option>
                                                <option value="published">Broadcast (Live)</option>
                                            </select>
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Tags</label>
                                            <input
                                                className={styles.input}
                                                style={{ padding: '10px' }}
                                                value={currentPost.tags?.join(', ') || ''}
                                                onChange={e => setCurrentPost({ ...currentPost, tags: e.target.value.split(',').map(s => s.trim()) })}
                                                placeholder="AI, Theory, Dev"
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Short Excerpt</label>
                                            <textarea
                                                className={styles.input}
                                                style={{ padding: '10px', minHeight: '100px', fontSize: '0.85rem' }}
                                                value={currentPost.excerpt || ''}
                                                onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--admin-border)', paddingTop: '2rem' }}>
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
                                {loading ? 'Transmitting...' : (
                                    <>
                                        {currentPost.status === 'published' ? <Send size={18} /> : <FileText size={18} />}
                                        {currentPost.id ? 'Refine Transmission' : 'Initiate Broadcast'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {posts.map(post => (
                    <div key={post.id} className={styles.glassCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    background: post.status === 'published' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    color: post.status === 'published' ? '#00ff88' : 'var(--admin-text-dim)',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    border: `1px solid ${post.status === 'published' ? 'rgba(0, 255, 136, 0.2)' : 'var(--admin-border)'}`
                                }}>
                                    {post.status}
                                </span>
                                <span style={{ color: 'var(--admin-text-dim)', fontSize: '0.8rem' }}>/</span>
                                <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={13} style={{ opacity: 0.5 }} />
                                    {post.updatedAt?.toDate ? post.updatedAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Temporal Null'}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' }}>{post.title}</h3>
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem', maxWidth: '700px', lineHeight: '1.6' }}>{post.excerpt || 'Vague essence detected. No summary provided.'}</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                                {post.tags?.map(tag => (
                                    <span key={tag} style={{ color: 'var(--admin-accent)', fontSize: '0.75rem', fontWeight: '500' }}>#{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    setCurrentPost(post);
                                    setIsEditing(true);
                                }}
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', color: 'var(--admin-accent)', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(post.id)}
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', color: '#ff4d4d', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
