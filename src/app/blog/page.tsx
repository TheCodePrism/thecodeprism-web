"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc } from "firebase/firestore";
import Link from "next/link";
import styles from "../portfolio.module.css";
import { Calendar, Tag, ArrowRight, BookOpen } from "lucide-react";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    tags: string[];
    publishedAt: any;
}

interface ProfileData {
    theme?: {
        primaryColor: string;
        fontFamily: string;
        glassmorphism: boolean;
    };
}

export default function BlogListing() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch posts
        const postsQuery = query(
            collection(db, "blog_posts"),
            where("status", "==", "published"),
            orderBy("publishedAt", "desc")
        );

        const postsUnsub = onSnapshot(postsQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BlogPost));
            setPosts(items);
        });

        // Fetch theme
        const themeUnsub = onSnapshot(doc(db, "config", "profile_data"), (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as ProfileData);
            }
            setLoading(false);
        });

        return () => {
            postsUnsub();
            themeUnsub();
        };
    }, []);

    if (loading) return (
        <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ letterSpacing: '2px', opacity: 0.5 }}>FETCHING JOURNALS...</p>
        </div>
    );

    return (
        <div
            className={styles.container}
            style={{
                '--accent': profile?.theme?.primaryColor || '#4facfe',
                '--accent-soft': profile?.theme?.primaryColor ? `${profile.theme.primaryColor}4d` : 'rgba(79, 172, 254, 0.3)',
                '--accent-light': profile?.theme?.primaryColor ? `${profile.theme.primaryColor}1a` : 'rgba(79, 172, 254, 0.1)',
                '--font-main': profile?.theme?.fontFamily || 'Inter, sans-serif',
                '--glass-bg': profile?.theme?.glassmorphism ? 'rgba(255, 255, 255, 0.03)' : 'rgba(10, 10, 10, 0.8)',
                '--glass-border': profile?.theme?.glassmorphism ? 'rgba(255, 255, 255, 0.05)' : 'rgba(34, 34, 34, 1)',
                '--glass-blur': profile?.theme?.glassmorphism ? 'blur(10px)' : 'none',
                fontFamily: 'var(--font-main)'
            } as any}
        >
            <header className={styles.section} style={{ paddingBottom: '2rem' }}>
                <Link href="/" className={styles.projectLink} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ← Back to Portfolio
                </Link>
                <h1 className={styles.sectionTitle}>Journal</h1>
                <p style={{ color: '#888', maxWidth: '600px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    Technical thoughts, building logs, and experiments in AI and Software Engineering.
                </p>
            </header>

            <main className={styles.section} style={{ paddingTop: '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {posts.map((post) => (
                        <article key={post.id} style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            paddingBottom: '3rem',
                            display: 'grid',
                            gridTemplateColumns: '200px 1fr',
                            gap: '2rem'
                        }}>
                            <div style={{ color: '#444', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={14} />
                                    {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                    {post.tags?.map(tag => (
                                        <span key={tag} style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '500' }}>#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1rem', color: '#fff' }}>{post.title}</h2>
                                <p style={{ color: '#888', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                                    {post.excerpt || 'Read this article to learn more about this topic...'}
                                </p>
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className={styles.projectLink}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    Read Article <ArrowRight size={16} />
                                </Link>
                            </div>
                        </article>
                    ))}

                    {posts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px dashed var(--glass-border)' }}>
                            <BookOpen size={48} style={{ color: '#222', marginBottom: '1rem' }} />
                            <p style={{ color: '#444' }}>No articles have been published yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </main>

            <footer style={{ padding: '6rem 2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p>© {new Date().getFullYear()} TheCodePrism Journal.</p>
            </footer>
        </div>
    );
}
