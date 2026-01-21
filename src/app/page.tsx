"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "./portfolio.module.css";
import { Github, Linkedin, Twitter, Globe, ExternalLink, ArrowRight, User } from "lucide-react";
import { sendPushNotification } from "@/lib/notifications";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  tags: string[];
}

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
  };
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Visitor Tracking
    const trackVisit = async () => {
      const lastVisit = localStorage.getItem('last_visit');
      const now = Date.now();

      // Basic throttle: only track once per hour per device
      if (!lastVisit || now - parseInt(lastVisit) > 3600000) {
        try {
          await addDoc(collection(db, "analytics"), {
            type: 'page_view',
            path: '/',
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            isNewVisitor: !lastVisit
          });
          localStorage.setItem('last_visit', now.toString());

          // Notify Admin
          sendPushNotification(
            !lastVisit ? "🚀 New Unique Visitor!" : "👀 Return Visitor",
            `A visitor is viewing your portfolio from ${navigator.platform}.`
          );
        } catch (e) {
          console.error("Analytics error:", e);
        }
      }
    };
    trackVisit();

    const projectsQuery = query(collection(db, "projects"), orderBy("title"));
    const projectsUnsub = onSnapshot(projectsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(items);
    });

    const profileUnsub = onSnapshot(doc(db, "config", "profile_data"), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as ProfileData);
      }
      setLoading(false);
    });

    // GSAP Scroll Animations
    if (!loading && profile?.theme?.enableAnimations !== false) {
      const ctx = gsap.context(() => {
        // Hero entrance
        gsap.from(".animate-hero", {
          y: 60,
          opacity: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: "power4.out"
        });

        // Project grid parallax and entrance
        gsap.from(".animate-project", {
          scrollTrigger: {
            trigger: ".project-grid",
            start: "top 80%",
          },
          y: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.15,
          ease: "expo.out"
        });
      });
      return () => {
        projectsUnsub();
        profileUnsub();
        ctx.revert();
      };
    }

    return () => {
      projectsUnsub();
      profileUnsub();
    };
  }, [loading]);

  if (loading) return (
    <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ letterSpacing: '2px', opacity: 0.5 }}>LOADING EXPERIENCE...</p>
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
      <header className={styles.hero}>
        {profile?.theme?.enableParallax !== false && <div className={styles.heroBackground} />}

        {profile?.avatarUrl && profile?.theme?.showAvatar !== false && (
          <img src={profile.avatarUrl} alt={profile.name} className={`${styles.avatar} animate-hero shadow-2xl border-4 border-primary/20`} />
        )}

        <h1 className={`${styles.name} animate-hero entropy-target`}>{profile?.name || "TheCodePrism"}</h1>
        <p className={`${styles.headline} animate-hero entropy-target`}>{profile?.headline || "Software Architect & Creative Coder"}</p>
        <p className={`${styles.bio} animate-hero`}>
          {profile?.bio || "Building the future of the web with AI-driven development and elegant architectural patterns."}
        </p>

        <div className={`${styles.socialLinks} animate-hero`}>
          {profile?.socials.github && (
            <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} hover:scale-125 transition-transform`}><Github size={24} /></a>
          )}
          {profile?.socials.linkedin && (
            <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} hover:scale-125 transition-transform`}><Linkedin size={24} /></a>
          )}
          {profile?.socials.twitter && (
            <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} hover:scale-125 transition-transform`}><Twitter size={24} /></a>
          )}
          {profile?.socials.website && (
            <a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} hover:scale-125 transition-transform`}><Globe size={24} /></a>
          )}
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Projects</h2>
        <div className={`${styles.projectGrid} project-grid`}>
          {projects.map((project) => (
            <div key={project.id} className={`${styles.projectCard} animate-project glass-card quantum-substrate overflow-hidden group hover:border-primary/50 transition-all duration-500`}>
              {project.imageUrl && (
                <div className="relative overflow-hidden aspect-video">
                  <img src={project.imageUrl} alt={project.title} className={`${styles.projectImage} group-hover:scale-110 transition-transform duration-700`} />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}
              <div className={styles.projectContent}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{tag}</span>
                  ))}
                </div>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDesc}>{project.description}</p>
                <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className={`${styles.projectLink} hover:text-white transition-colors`}>
                    View Code <Github size={16} />
                  </a>
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className={`${styles.projectLink} hover:text-white transition-colors`}>
                    Live Demo <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {profile?.theme?.showJournal !== false && (
        <section className={styles.section} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>Want to see more?</h2>
          <a href="/blog" className={styles.projectLink} style={{ fontSize: '1.2rem', gap: '12px' }}>
            Explore the Journal <ArrowRight size={20} />
          </a>
        </section>
      )}

      <footer style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        <p>© {new Date().getFullYear()} {profile?.name}. Built with TheCodePrism.</p>
      </footer>
    </div>
  );
}
