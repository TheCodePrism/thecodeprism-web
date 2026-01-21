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

    useEffect(() => {
        const q = query(collection(db, "analytics"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => doc.data());

            const uniqueVisitors = new Set(snapshot.docs.map(doc => doc.data().visitorId || doc.id)).size;
            const mobile = docs.filter(d => /Mobile|Android|iPhone/i.test(d.userAgent)).length;
            const desktop = docs.length - mobile;

            setStats({
                totalVisits: docs.length,
                uniqueVisitors: docs.filter(d => d.isNewVisitor).length || uniqueVisitors,
                mobileVisits: mobile,
                desktopVisits: desktop,
                recentVisits: docs.slice(0, 6)
            });
            setLoading(false);
        });

        return unsub;
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
            <div className={styles.pulse} style={{ width: '8px', height: '8px', background: 'var(--admin-accent)', borderRadius: '50%' }} />
            Synchronizing telemetry...
        </div>
    );

    return (
        <div>
            <h2 className={styles.title}>Live Analytics</h2>

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
                <div className={styles.glassCard}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MousePointer2 size={18} style={{ color: 'var(--admin-accent)' }} /> Data Ingress Feed
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats.recentVisits.map((visit, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visit.path === '/' ? 'Root Access (/)' : visit.path}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visit.userAgent}</p>
                                </div>
                                <div style={{ textAlign: 'right', marginLeft: '1.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--admin-accent)', fontWeight: '700', marginBottom: '4px' }}>{visit.isNewVisitor ? 'NEW_ID' : 'KNOWN_ID'}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-dim)' }}>
                                        {visit.timestamp?.toDate ? visit.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {stats.recentVisits.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-dim)', fontSize: '0.9rem' }}>
                                No telemetry detected in current window.
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

function StatCard({ label, value, icon, trend, sublabel }: { label: string, value: string, icon: React.ReactNode, trend?: string, sublabel?: string }) {
    return (
        <div className={styles.glassCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.75rem' }}>
            <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>{label}</p>
                <h3 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.75rem 0 0.5rem 0', color: '#fff', letterSpacing: '-1px' }}>{value}</h3>
                {trend && <p style={{ color: 'var(--admin-accent)', fontSize: '0.7rem', fontWeight: '500' }}>{trend}</p>}
                {sublabel && <p style={{ color: 'var(--admin-text-dim)', fontSize: '0.7rem' }}>{sublabel}</p>}
            </div>
            <div style={{ background: 'rgba(79, 172, 254, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--admin-accent)', boxShadow: '0 0 20px rgba(79, 172, 254, 0.1)' }}>
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
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '10px', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(79, 172, 254, 0.3)' }} />
                </div>
            </div>
        </div>
    );
}
