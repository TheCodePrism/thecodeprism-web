"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "./portfolio.module.css";
import { Github, Linkedin, Twitter, Globe, ExternalLink, ArrowRight, User } from "lucide-react";
import { sendPushNotification } from "@/lib/notifications";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { Cpu, Zap, Activity, Clock } from "lucide-react";
import Link from 'next/link';
import FluidSubstrate from "@/components/visuals/FluidSubstrate";
import QuantumLoader from "@/components/visuals/QuantumLoader";

gsap.registerPlugin(ScrollTrigger);
interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  tags: string[];
}

interface Skill {
  id: string;
  label: string;
  level: number;
}

interface Experience {
  id: string;
  period: string;
  role: string;
  company: string;
  desc: string;
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
    experienceYears?: string;
    satisfactionRate?: string;
    showCursor?: boolean;
    showSubstrate?: boolean;
    vfxIntensity?: number;
  };
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dynamicSkills, setDynamicSkills] = useState<Skill[]>([]); // Added dynamicSkills state
  const [dynamicExperiences, setDynamicExperiences] = useState<Experience[]>([]); // Added dynamicExperiences state
  // Profile data is now managed by the ThemeProvider and accessed via context
  const { updateAccent, updateEffects, tokens, profile, loadingProfile } = useTheme();
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // Visitor Tracking
    const trackVisit = async () => {
      // Prevent double tracking in the same session
      if (sessionStorage.getItem('session_tracked')) return;

      const lastVisit = localStorage.getItem('last_visit');
      const now = Date.now();

      // Throttle: only track once per hour
      if (!lastVisit || now - parseInt(lastVisit) > 3600000) {
        sessionStorage.setItem('session_tracked', 'true');
        try {
          await addDoc(collection(db, "analytics"), {
            type: 'page_view',
            path: '/',
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            isNewVisitor: !lastVisit,
            visitorId: localStorage.getItem('visitor_id') || Math.random().toString(36).substring(2, 15)
          });

          if (!localStorage.getItem('visitor_id')) {
            localStorage.setItem('visitor_id', Math.random().toString(36).substring(2, 15));
          }

          localStorage.setItem('last_visit', now.toString());

          // Notify Admin
          sendPushNotification(
            !lastVisit ? "🚀 New Unique Visitor!" : "👀 Return Visitor",
            `A visitor is viewing your portfolio from ${navigator.platform}.`
          );
        } catch (e) {
          sessionStorage.removeItem('session_tracked');
          console.error("Analytics error:", e);
        }
      }
    };

    if (!loadingProfile) {
      trackVisit();
    }

    const projectsQuery = query(collection(db, "projects"), orderBy("title"));
    const projectsUnsub = onSnapshot(projectsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(items);
      setLoadingProjects(false);
    });

    // New onSnapshot listeners for skills and experience
    const unsubSkills = onSnapshot(query(collection(db, "skills"), orderBy("label", "asc")), (snapshot) => {
      setDynamicSkills(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Skill)));
    });

    const unsubExperience = onSnapshot(query(collection(db, "experience"), orderBy("order", "desc")), (snapshot) => { // Assuming 'order' field for sorting
      setDynamicExperiences(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Experience)));
    });

    // GSAP Scroll Animations
    if (!loadingProfile && profile?.theme?.enableAnimations !== false) {
      gsap.from(".animate-hero", {
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5
      });

      gsap.utils.toArray(".animate-project").forEach((element) => {
        gsap.from(element as HTMLElement, {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element as HTMLElement,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          }
        });
      });

      if (profile?.theme?.enableParallax !== false) {
        gsap.to(".heroBackground", {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }

      // HUD Entry Animation
      gsap.from(".animate-hud", {
        opacity: 0,
        scale: 0.95,
        duration: 1.2,
        stagger: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".hud-trigger",
          start: "top 80%"
        }
      });
      // Timeline Stagger
      gsap.from(".timeline-item", {
        opacity: 0,
        x: -20,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".timeline-item",
          start: "top 80%"
        }
      });

      // 3D Tilt Logic for Projects
      const cards = document.querySelectorAll('.animate-tilt');
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e: any) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = (y - centerY) / 8;
          const rotateY = (centerX - x) / 8;

          gsap.to(card, {
            rotateX: rotateX,
            rotateY: rotateY,
            scale: 1.03,
            duration: 0.4,
            ease: "power2.out",
            transformPerspective: 1000,
            boxShadow: `0 20px 50px rgba(var(--accent-rgb), 0.2)`
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.6,
            ease: "elastic.out(1, 0.5)",
            boxShadow: "none"
          });
        });
      });
    }

    return () => {
      projectsUnsub();
      unsubSkills(); // Cleanup skills listener
      unsubExperience(); // Cleanup experience listener
    };
  }, [loadingProfile, profile?.theme?.enableAnimations, profile?.theme?.enableParallax]);

  if (loadingProfile || loadingProjects) return <QuantumLoader />;

  return (
    <div
      className={styles.container}
      style={{ fontFamily: 'var(--font-main)' }}
    >
      {profile?.theme?.showSubstrate !== false && <FluidSubstrate intensity={profile?.theme?.vfxIntensity ?? 0.5} />}

      <div className={styles.scanlineOverlay} />
      <div className={styles.grainOverlay} />

      <header className={styles.hero}>
        {profile?.theme?.enableParallax !== false && <div className={styles.heroBackground} />}

        {profile?.avatarUrl && profile?.theme?.showAvatar !== false && (
          <img src={profile.avatarUrl} alt={profile.name} className={`${styles.avatar} animate-hero shadow-2xl border-4 border-primary/20`} />
        )}

        <div className="flex flex-col items-center gap-6 animate-hero">
          <h1 className={`${styles.name} ${styles.vfxChromatic} entropy-target`}>{profile?.name || "TheCodePrism"}</h1>
        </div>
        <p className={`${styles.headline} ${styles.vfxChromatic} animate-hero entropy-target`}>{profile?.headline || "Software Architect & Creative Coder"}</p>
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

      {/* System Status HUD */}
      <section className={`${styles.section} hud-trigger`}>
        <div className={styles.statsGrid}>
          <StatCard
            icon={<Cpu size={24} />}
            value={projects.length.toString()}
            label="CONSTRUCTS_ACTIVE"
          />
          <StatCard
            icon={<Clock size={24} />}
            value={profile?.theme?.experienceYears || "5+"}
            label="UPTIME_YEARS"
          />
          <StatCard
            icon={<Zap size={24} />}
            value={profile?.theme?.satisfactionRate || "100%"}
            label="SATISFACTION_RATE"
          />
        </div>
      </section>

      {/* Skills Matrix */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skills Matrix</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <div className={styles.skillsGrid}>
            {dynamicSkills.length > 0 ? (
              dynamicSkills.map((skill, i) => (
                <SkillItem key={skill.id} label={skill.label} level={skill.level} />
              ))
            ) : (
              <div style={{ gridColumn: '1/-1', opacity: 0.3, textAlign: 'center' }}>[ AWAITING_DATA_INGRESS ]</div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Projects</h2>
        <div className={`${styles.projectGrid} project-grid`}>
          {projects.map((project) => (
            <div key={project.id} className={`${styles.projectCard} animate-project animate-tilt glass-card quantum-substrate overflow-hidden group hover:border-primary/50 transition-all duration-500`}>
              {project.imageUrl && (
                <div className="relative overflow-hidden aspect-video">
                  <img src={project.imageUrl} alt={project.title} className={`${styles.projectImage} group-hover:scale-110 transition-transform duration-700`} />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}
              <div className={styles.projectContent}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project.tags.map((tag: string) => (
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Experience Timeline</h2>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineTrace} />

          {dynamicExperiences.length > 0 ? (
            dynamicExperiences.map((exp, i) => (
              <TimelineItem
                key={exp.id}
                period={exp.period}
                role={exp.role}
                company={exp.company}
                desc={exp.desc}
              />
            ))
          ) : (
            <div style={{ opacity: 0.3, textAlign: 'center' }}>[ NO_CHRONICLE_TRACES_FOUND ]</div>
          )}
        </div>
      </section>

      {profile?.theme?.showJournal !== false && (
        <section className={styles.section} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>Want to see more?</h2>
          <a href="/blog" className={`${styles.projectLink} ${styles.glitch}`} data-text="Explore the Journal" style={{ fontSize: '1.2rem', gap: '12px' }}>
            Explore the Journal <ArrowRight size={20} />
          </a>
        </section>
      )}

      <footer style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        <p>© {new Date().getFullYear()} {profile?.name || "TheCodePrism"}. Engineering Perfection.</p>
      </footer>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className={`${styles.hudCard} animate-hud`}>
      <span className={styles.timelineLabel}>[ STATUS: ONLINE ]</span> {/* This seems generic, might need to be dynamic */}
      <h4 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>{label.replace(/_/g, ' ')}</h4>
      <div className={styles.statValue}>{value}</div>
      <div style={{ position: 'absolute', bottom: '10px', right: '15px', color: 'var(--accent)', opacity: 0.2 }}>{icon}</div>
    </div>
  );
}

function SkillItem({ label, level }: { label: string, level: number }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>{label}</span>
        <span style={{ color: 'var(--accent)' }}>{level}%</span>
      </div>
      <div className={styles.segmentedBar}>
        <div
          className={styles.segmentFill}
          style={{ width: `${level}%` }}
        />
        <div className={styles.segmentOverlay} />
      </div>
    </div>
  );
}

function TimelineItem({ period, role, company, desc }: { period: string, role: string, company: string, desc: string }) {
  return (
    <div className={`${styles.timelineItem} timeline-item`}>
      <div className={styles.timelineDot} />
      <div className={styles.timelineContent}>
        <span className={styles.timelineLabel}>{period}</span>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0.5rem 0' }}>{role}</h3>
        <h4 style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '1rem' }}>@ {company}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>{desc}</p>
      </div>
    </div>
  );
}

