"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../../portfolio.module.css";
import { Calendar, Tag, ChevronLeft, Clock, Share2 } from "lucide-react";

interface BlogPost {
    id: string;
    title: string;
    content: string;
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

export default function BlogPostPage() {
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const q = query(
                    collection(db, "blog_posts"),
                    where("slug", "==", params.slug),
                    where("status", "==", "published")
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    setPost({ id: doc.id, ...doc.data() } as BlogPost);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            }
        };

        const profileUnsub = onSnapshot(doc(db, "config", "profile_data"), (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as ProfileData);
            }
            setLoading(false);
        });

        if (params.slug) fetchPost();

        return () => profileUnsub();
    }, [params.slug]);

    if (loading) return (
        <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ letterSpacing: '2px', opacity: 0.5 }}>OPENING JOURNAL...</p>
        </div>
    );

    if (!post) return (
        <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <p style={{ opacity: 0.5 }}>ARTICLE NOT FOUND</p>
            <Link href="/blog" className={styles.projectLink}>Back to Journal</Link>
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
            <header className={styles.section} style={{ paddingBottom: '4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Link href="/blog" className={styles.projectLink} style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronLeft size={18} /> All Journals
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '0.9rem' }}>
                        <Calendar size={14} />
                        {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </div>
                    <span style={{ color: '#222' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '0.9rem' }}>
                        <Clock size={14} />
                        {Math.ceil(post.content.split(' ').length / 200)} min read
                    </div>
                </div>

                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '2rem', background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {post.title}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {post.tags?.map(tag => (
                        <span key={tag} style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '0.8rem', padding: '4px 12px', borderRadius: '6px' }}>#{tag}</span>
                    ))}
                </div>
            </header>

            <main className={styles.section} style={{ paddingTop: '4rem' }}>
                <div
                    style={{
                        color: '#bbb',
                        lineHeight: '1.8',
                        fontSize: '1.15rem',
                        maxWidth: '800px',
                        margin: '0 auto',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {post.content}
                </div>
            </main>

            <footer className={styles.section} style={{ marginTop: '4rem', padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#444', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Share2 size={18} /> Share Article
                    </button>
                    <Link href="/blog" className={styles.projectLink}>Read More Journals</Link>
                </div>
                <p style={{ marginTop: '4rem', opacity: 0.2, fontSize: '0.8rem' }}>© {new Date().getFullYear()} TheCodePrism.</p>
            </footer>
        </div>
    );
}
