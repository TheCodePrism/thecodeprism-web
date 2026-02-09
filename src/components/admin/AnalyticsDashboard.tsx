"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { Users, MousePointer2, Smartphone, Monitor, Globe, ArrowUpRight } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface AnalyticsData {
    totalVisits: number;
    uniqueVisitors: number;
    mobileVisits: number;
    desktopVisits: number;
    recentVisits: any[];
}

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<AnalyticsData>({
        totalVisits: 0,
        uniqueVisitors: 0,
        mobileVisits: 0,
        desktopVisits: 0,
        recentVisits: []
    });
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<'all' | 'new' | 'known'>('all');
    const [platformFilter, setPlatformFilter] = useState<'all' | 'desktop' | 'mobile'>('all');
    const [allLogs, setAllLogs] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "analytics"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Defensive deduplication: remove entries with same visitorId and path within 10s of each other
            const deduplicated = allDocs.reduce((acc: any[], doc: any) => {
                const isDuplicate = acc.some(prev =>
                    prev.visitorId === doc.visitorId &&
                    prev.path === doc.path &&
                    Math.abs((prev.timestamp?.toDate?.()?.getTime() || 0) - (doc.timestamp?.toDate?.()?.getTime() || 0)) < 10000
                );
                if (!isDuplicate) acc.push(doc);
                return acc;
            }, []);

            setAllLogs(deduplicated);

            const mobile = deduplicated.filter(d => /Mobile|Android|iPhone/i.test(d.userAgent)).length;
            const desktop = deduplicated.length - mobile;

            setStats({
                totalVisits: deduplicated.length,
                uniqueVisitors: deduplicated.filter(d => d.isNewVisitor).length,
                mobileVisits: mobile,
                desktopVisits: desktop,
                recentVisits: deduplicated // We'll filter this in the render
            });
            setLoading(false);
        });

        return unsub;
    }, []);

    const filteredLogs = allLogs.filter(log => {
        const matchesType = typeFilter === 'all' || (typeFilter === 'new' ? log.isNewVisitor : !log.isNewVisitor);
        const isMobile = /Mobile|Android|iPhone/i.test(log.userAgent);
        const matchesPlatform = platformFilter === 'all' || (platformFilter === 'mobile' ? isMobile : !isMobile);
        return matchesType && matchesPlatform;
    }).slice(0, 10); // Show up to 10 filtered logs

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
            <div className={styles.pulse} style={{ width: '8px', height: '8px', background: 'var(--admin-accent)', borderRadius: '50%' }} />
            Synchronizing telemetry...
        </div>
    );

    return (
        <div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    label="Total Page Views"
                    value={stats.totalVisits.toLocaleString()}
                    icon={<ArrowUpRight size={20} />}
                    trend="+12% from last cycle"
                />
                <StatCard
                    label="Unique Entities"
                    value={stats.uniqueVisitors.toLocaleString()}
                    icon={<Users size={20} />}
                />
                <StatCard
                    label="Terminal Access"
                    value={`${stats.desktopVisits} / ${stats.mobileVisits}`}
                    icon={<Monitor size={20} />}
                    sublabel="Desktop / Mobile Split"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                <div className={styles.glassCard} style={{ background: 'rgba(5, 5, 5, 0.8)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <div className={styles.pulse} style={{ width: '6px', height: '6px', background: '#ff3b3b', borderRadius: '50%', boxShadow: '0 0 10px #ff3b3b' }} />
                        Ingress Telemetry Log
                    </h3>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.65rem', color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--admin-border)' }}>
                            <span style={{ opacity: 0.5 }}>Type:</span>
                            {['all', 'new', 'known'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t as any)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: typeFilter === t ? 'var(--admin-accent)' : 'inherit',
                                        cursor: 'pointer',
                                        fontWeight: typeFilter === t ? 'bold' : 'normal',
                                        textShadow: typeFilter === t ? '0 0 10px var(--admin-accent-glow)' : 'none',
                                        padding: '2px 6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {t === 'all' ? '[-] ' : ''}{t}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--admin-border)' }}>
                            <span style={{ opacity: 0.5 }}>Device:</span>
                            {['all', 'desktop', 'mobile'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPlatformFilter(p as any)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: platformFilter === p ? 'var(--admin-accent)' : 'inherit',
                                        cursor: 'pointer',
                                        fontWeight: platformFilter === p ? 'bold' : 'normal',
                                        textShadow: platformFilter === p ? '0 0 10px var(--admin-accent-glow)' : 'none',
                                        padding: '2px 6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {p === 'all' ? '[-] ' : ''}{p}
                                </button>
                            ))}
                        </div>
                        {(typeFilter !== 'all' || platformFilter !== 'all') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-accent)', fontWeight: 'bold' }}>
                                <div className={styles.pulse} style={{ width: '4px', height: '4px', background: 'var(--admin-accent)', borderRadius: '50%' }} />
                                FILTER_ACTIVE
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace' }}>
                        {filteredLogs.map((visit, i) => (
                            <LogEntry key={i} visit={visit} />
                        ))}
                        {filteredLogs.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-dim)', fontSize: '0.8rem' }}>
                                [ NO MATCHING INGRESS DETECTED ]
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.glassCard} style={{ height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '2.5rem' }}>Substrate Analysis</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <DeviceBar label="Desktop Workstation" icon={<Monitor size={22} />} count={stats.desktopVisits} total={stats.totalVisits} />
                        <DeviceBar label="Mobile Terminal" icon={<Smartphone size={22} />} count={stats.mobileVisits} total={stats.totalVisits} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function LogEntry({ visit }: { visit: any }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '4px',
            borderLeft: `2px solid ${visit.isNewVisitor ? '#4facfe' : 'var(--admin-text-dim)'}`,
            fontSize: '0.8rem'
        }}>
            <span style={{ color: 'var(--admin-text-dim)', minWidth: '70px' }}>
                [{visit.timestamp?.toDate ? visit.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '00:00:00'}]
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: visit.isNewVisitor ? '#4facfe' : '#fff', fontWeight: 'bold', marginRight: '8px' }}>
                    {visit.isNewVisitor ? '[NEW_ID]' : '[KNOWN]'}
                </span>
                <span style={{ color: 'var(--admin-text-secondary)' }}>ACCESS_GRANTED:</span>
                <span style={{ color: '#fff', marginLeft: '8px' }}>{visit.path === '/' ? '/' : visit.path}</span>
                <div
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        fontSize: '0.7rem',
                        color: 'var(--admin-text-dim)',
                        marginTop: '4px',
                        opacity: 0.6,
                        overflow: expanded ? 'visible' : 'hidden',
                        textOverflow: expanded ? 'clip' : 'ellipsis',
                        whiteSpace: expanded ? 'normal' : 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        wordBreak: 'break-all'
                    }}
                >
                    UA {" >> "} {visit.userAgent}
                    {visit.userAgent?.length > 40 && !expanded && (
                        <span style={{ color: 'var(--admin-accent)', marginLeft: '8px', fontWeight: 'bold' }}>[READ MORE]</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, trend, sublabel }: { label: string, value: string, icon: React.ReactNode, trend?: string, sublabel?: string }) {
    return (
        <div className={styles.glassCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.75rem', position: 'relative' }}>
            {/* Decorative Grid Pattern */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(var(--admin-border) 1px, transparent 1px)', backgroundSize: '10px 10px', opacity: 0.2, pointerEvents: 'none' }} />

            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>{label}</p>
                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: '#fff', letterSpacing: '-1px', fontFamily: 'monospace' }}>{value}</h3>
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '4px', height: '4px', background: 'var(--admin-accent)', borderRadius: '50%' }} />
                        <p style={{ color: 'var(--admin-accent)', fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase' }}>{trend}</p>
                    </div>
                )}
                {sublabel && <p style={{ color: 'var(--admin-text-dim)', fontSize: '0.7rem', marginTop: '4px' }}>{sublabel}</p>}
            </div>
            <div style={{ background: 'rgba(79, 172, 254, 0.05)', padding: '10px', borderRadius: '10px', color: 'var(--admin-accent)', border: '1px solid var(--admin-border)', position: 'relative', zIndex: 1, boxShadow: '0 0 15px rgba(79, 172, 254, 0.1)' }}>
                {icon}
            </div>
        </div>
    );
}

function DeviceBar({ label, icon, count, total }: { label: string, icon: React.ReactNode, count: number, total: number }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ color: 'var(--admin-text-dim)', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--admin-accent)', fontWeight: '700' }}>{percentage.toFixed(0)}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '0', overflow: 'hidden', position: 'relative' }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'var(--admin-accent)',
                            transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 0 15px var(--admin-accent)'
                        }}
                    />
                    {/* Segmented pattern overlay */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent 95%, var(--admin-bg) 95%)', backgroundSize: '10% 100%', pointerEvents: 'none' }} />
                </div>
            </div>
        </div>
    );
}
