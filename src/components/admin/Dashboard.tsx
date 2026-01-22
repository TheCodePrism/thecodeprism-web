import styles from "../../app/thecodeprism-admin/admin.module.css";
import { LogOut, Settings, LayoutDashboard, FileText, User, Send, Clock, ShieldCheck, Cpu } from "lucide-react";
import ProjectEditor from "@/components/admin/ProjectEditor";
import ProfileEditor from "@/components/admin/ProfileEditor";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import BlogEditor from "@/components/admin/BlogEditor";
import SettingsEditor from "@/components/admin/SettingsEditor";

interface DashboardProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    handleLogout: () => void;
    sharedConstraints: { userType: string, accessType: string } | null;
    sessionExpiry: number | null;
}

export default function Dashboard({ activeTab, setActiveTab, handleLogout, sharedConstraints, sessionExpiry }: DashboardProps) {
    const getTabTitle = () => {
        switch (activeTab) {
            case 'dashboard': return 'Command Center';
            case 'projects': return 'Portfolio Matrix';
            case 'blog': return 'Journal Transmissions';
            case 'profile': return 'Identity Core';
            case 'settings': return 'System Architecture';
            default: return 'Control Center';
        }
    };

    return (
        <div className={styles.dashboard}>
            <aside className={styles.sidebar}>
                <div style={{ marginBottom: '3.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <div className={styles.pulse} style={{ width: '8px', height: '8px', background: 'var(--admin-accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--admin-accent)' }} />
                                <h1 className={styles.title} style={{ fontSize: '1.25rem' }}>TheCodePrism</h1>
                            </div>
                            <div className={styles.subtitle} style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.6rem', opacity: 0.7 }}>Admin Control</div>
                        </div>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    <NavItem
                        icon={<LayoutDashboard size={18} />}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <NavItem
                        icon={<FileText size={18} />}
                        label="Constructs"
                        active={activeTab === 'projects'}
                        onClick={() => setActiveTab('projects')}
                    />
                    <NavItem
                        icon={<Send size={18} />}
                        label="Broadcasts"
                        active={activeTab === 'blog'}
                        onClick={() => setActiveTab('blog')}
                    />
                    <div style={{ height: '1px', background: 'var(--admin-border)', margin: '1rem 0' }} />
                    <NavItem
                        icon={<User size={18} />}
                        label="Identity"
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                    />
                    <NavItem
                        icon={<Settings size={18} />}
                        label="Substrate"
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                </nav>

                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={16} />
                    Terminal Exit
                </button>
            </aside>

            <main className={styles.mainContent}>
                <div className={styles.contentArea}>
                    <header className={styles.header}>
                        <div className={styles.tabTitle}>
                            {getTabTitle()}
                        </div>

                        <div className={styles.statusBar}>
                            <div className={styles.statusItem}>
                                <ShieldCheck size={14} />
                                <span className={styles.statusValue}>
                                    {sharedConstraints?.userType.toUpperCase() || 'ROOT'}
                                </span>
                            </div>
                            <div style={{ width: '1px', height: '16px', background: 'var(--admin-border)' }} />
                            <div className={styles.statusItem}>
                                <Cpu size={14} />
                                <span style={{ opacity: 0.6 }}>LINK:</span>
                                <span className={styles.statusValue}>ACTIVE</span>
                            </div>
                            <div style={{ width: '1px', height: '16px', background: 'var(--admin-border)' }} />
                            <div className={styles.statusItem}>
                                <Clock size={14} />
                                <span className={styles.statusValue}>
                                    {sessionExpiry ? new Date(sessionExpiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </header>

                    <div key={activeTab} className={styles.tabContent}>
                        {activeTab === 'dashboard' && <AnalyticsDashboard />}
                        {activeTab === 'projects' && <ProjectEditor />}
                        {activeTab === 'blog' && <BlogEditor />}
                        {activeTab === 'profile' && <ProfileEditor />}
                        {activeTab === 'settings' && <SettingsEditor />}
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
        >
            {icon}
            <span>{label}</span>
        </div>
    );
}
