"use client";

import { useState, useEffect } from "react";
import { Upload, Database, File as FileIcon, Trash2, Folder, CheckCircle, Clock, ArrowRight, Loader2, LayoutGrid, List, Eye, Copy, X, FileText, Image as ImageIcon, Video, Lock, Unlock, ShieldCheck, ExternalLink } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface VaultFile {
    name: string;
    size: number;
    updatedAt: string;
    type: string;
    url: string;
    shareUrl: string;
    status: 'local' | 'db' | 'transferring';
    visibility?: 'public' | 'protected';
    hasAccessCode?: boolean;
}

export default function VaultEditor() {
    const [files, setFiles] = useState<VaultFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [editingCode, setEditingCode] = useState<{ name: string, code: string } | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/vault");
            const data = await res.json();
            if (data.success) {
                setFiles(data.files);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Failed to fetch vault contents");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/vault", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                fetchFiles();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const updateSecurity = async (fileName: string, updates: { visibility?: 'public' | 'protected', accessCode?: string }) => {
        try {
            const res = await fetch("/api/vault", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName, ...updates })
            });
            const data = await res.json();
            if (data.success) {
                setFiles(prev => prev.map(f => f.name === fileName ? ({
                    ...f,
                    visibility: updates.visibility ?? f.visibility,
                    hasAccessCode: updates.accessCode !== undefined ? !!updates.accessCode : f.hasAccessCode
                } as VaultFile) : f));
                setEditingCode(null);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Security update failed");
        }
    };

    const transferToDB = async (fileName: string) => {
        setFiles(prev => prev.map(f => f.name === fileName ? { ...f, status: 'transferring' } : f));

        try {
            const res = await fetch("/api/vault", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName, syncToDB: true })
            });
            const data = await res.json();
            if (data.success) {
                setFiles(prev => prev.map(f => f.name === fileName ? { ...f, status: 'db' } : f));
            } else {
                alert(data.error);
                setFiles(prev => prev.map(f => f.name === fileName ? { ...f, status: 'local' } : f));
            }
        } catch (err) {
            alert("Transfer failed");
            setFiles(prev => prev.map(f => f.name === fileName ? { ...f, status: 'local' } : f));
        }
    };

    const deleteFile = async (fileName: string) => {
        if (!confirm(`Are you sure you want to purge "${fileName}" from the vault? This will remove it from both local storage and the database.`)) return;

        try {
            const res = await fetch(`/api/vault?file=${encodeURIComponent(fileName)}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                setFiles(prev => prev.filter(f => f.name !== fileName));
                if (previewFile?.name === fileName) setPreviewFile(null);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Deletion failed");
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        let fullText = text;
        if (type.includes('Link') || type === 'Link') {
            if (text.startsWith('/')) {
                fullText = window.location.origin + text;
            }
        }
        navigator.clipboard.writeText(fullText);
        setCopyStatus(`${type} Copied!`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const getFileIcon = (type: string) => {
        const t = type.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(t)) return <ImageIcon size={24} />;
        if (['mp4', 'webm', 'mov'].includes(t)) return <Video size={24} />;
        if (['pdf', 'txt', 'md', 'json'].includes(t)) return <FileText size={24} />;
        return <FileIcon size={24} />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.glassCard} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className={styles.title} style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>The Vault</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <p className={styles.label} style={{ color: 'var(--admin-text-secondary)', margin: 0 }}>Manage assets and persistent storage constructs</p>
                            {copyStatus && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--admin-accent)', fontWeight: 700, padding: '2px 8px', background: 'var(--admin-accent-glow)', borderRadius: '4px' }}>
                                    {copyStatus}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{ padding: '6px', borderRadius: '6px', background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'grid' ? 'var(--admin-accent)' : '#888', cursor: 'pointer' }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{ padding: '6px', borderRadius: '6px', background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: viewMode === 'list' ? 'var(--admin-accent)' : '#888', cursor: 'pointer' }}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <label className={styles.primaryBtn} style={{ cursor: 'pointer' }}>
                            {uploading ? <Loader2 className={styles.pulse} size={18} /> : <Upload size={18} />}
                            {uploading ? "Uploading..." : "Import Construct"}
                            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                        <Loader2 className={styles.pulse} size={48} style={{ margin: '0 auto 1rem' }} />
                        <p>Scanning local storage...</p>
                    </div>
                ) : files.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', border: '2px dashed var(--admin-border)', borderRadius: '15px', color: 'var(--admin-text-dim)' }}>
                        <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>Vault is currently empty. Initialize by importing files.</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {files.map((file) => (
                            <div key={file.name} className={styles.glassCard} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div onClick={() => setPreviewFile(file)} style={{
                                    width: '45px',
                                    height: '45px',
                                    background: 'rgba(79, 172, 254, 0.1)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--admin-accent)',
                                    cursor: 'pointer'
                                }}>
                                    {getFileIcon(file.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>{file.name}</h4>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Database size={10} /> {formatSize(file.size)}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: file.visibility === 'protected' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                                            color: file.visibility === 'protected' ? '#ff6b6b' : '#00ff00',
                                            border: `1px solid ${file.visibility === 'protected' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 255, 0, 0.2)'}`
                                        }}>
                                            {file.visibility === 'protected' ? <Lock size={10} /> : <Unlock size={10} />}
                                            {file.visibility === 'protected' ? 'PROTECTED' : 'PUBLIC'}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            background: file.status === 'db' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                            color: file.status === 'db' ? '#00ff00' : '#888',
                                            border: `1px solid ${file.status === 'db' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
                                        }}>
                                            {file.status === 'db' ? 'SYNCED' : 'LOCAL'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {editingCode?.name === file.name ? (
                                        <div style={{ display: 'flex', gap: '5px', animation: 'fadeIn 0.2s ease' }}>
                                            <input
                                                type="text"
                                                value={editingCode.code}
                                                onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value })}
                                                placeholder="Set Code"
                                                className={styles.input}
                                                style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100px' }}
                                            />
                                            <button onClick={() => updateSecurity(file.name, { accessCode: editingCode.code })} className={styles.blueBtn} style={{ padding: '6px 10px' }}><CheckCircle size={14} /></button>
                                            <button onClick={() => setEditingCode(null)} className={styles.logoutBtn} style={{ padding: '6px 10px' }}><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => updateSecurity(file.name, { visibility: file.visibility === 'protected' ? 'public' : 'protected' })}
                                                className={styles.blueBtn}
                                                title={file.visibility === 'protected' ? "Make Public" : "Protect with Code"}
                                                style={{ padding: '8px', minWidth: 'auto', background: file.visibility === 'protected' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255,255,255,0.05)' }}
                                            >
                                                {file.visibility === 'protected' ? <Lock size={14} /> : <Unlock size={14} />}
                                            </button>
                                            {file.visibility === 'protected' && (
                                                <button onClick={() => setEditingCode({ name: file.name, code: "" })} className={styles.blueBtn} style={{ padding: '8px', minWidth: 'auto' }} title="Change Access Code">
                                                    <ShieldCheck size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => copyToClipboard(file.shareUrl, 'Share Link')}
                                                className={styles.blueBtn}
                                                title="Copy Share Link"
                                                style={{ padding: '8px', minWidth: 'auto' }}
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </>
                                    )}
                                    {file.status === 'local' && (
                                        <button onClick={() => transferToDB(file.name)} className={styles.blueBtn} title="Sync to Distributed DB" style={{ padding: '8px 12px' }}>
                                            <Database size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteFile(file.name)}
                                        className={styles.logoutBtn}
                                        style={{ padding: '8px', minWidth: 'auto', background: 'rgba(255, 0, 0, 0.1)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                        {files.map((file) => (
                            <div key={file.name} className={styles.glassCard} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                                <div onClick={() => setPreviewFile(file)} style={{
                                    height: '140px',
                                    background: 'rgba(79, 172, 254, 0.05)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--admin-accent)',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.03)'
                                }}>
                                    {['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(file.type.toLowerCase()) ? (
                                        <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ opacity: 0.4 }}>{getFileIcon(file.type)}</div>
                                    )}
                                    {file.visibility === 'protected' && (
                                        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Lock size={12} color="#ff6b6b" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ minHeight: '40px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--admin-text-dim)', textTransform: 'uppercase' }}>{formatSize(file.size)} • {file.type} • {file.visibility || 'public'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                    <button onClick={() => setPreviewFile(file)} className={styles.blueBtn} style={{ flex: 1, padding: '6px', fontSize: '0.7rem' }}><Eye size={12} /> View</button>
                                    <button onClick={() => copyToClipboard(file.shareUrl, 'Link')} className={styles.blueBtn} style={{ width: '36px', padding: '6px' }}><Copy size={12} /></button>
                                    <button onClick={() => updateSecurity(file.name, { visibility: file.visibility === 'protected' ? 'public' : 'protected' })} className={styles.blueBtn} style={{ width: '36px', padding: '6px' }}>
                                        {file.visibility === 'protected' ? <Lock size={12} /> : <Unlock size={12} />}
                                    </button>
                                    <button onClick={() => deleteFile(file.name)} className={styles.logoutBtn} style={{ width: '36px', padding: '6px', background: 'rgba(255, 0, 0, 0.1)' }}><Trash2 size={12} /></button>
                                </div>
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', pointerEvents: 'none' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: file.status === 'db' ? '#00ff00' : '#888',
                                        boxShadow: file.status === 'db' ? '0 0 10px #00ff00' : 'none'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.glassCard} style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                <h3 className={styles.label} style={{ marginBottom: '1rem' }}>Security Protocol Oversight</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', lineHeight: '1.6' }}>
                    <p>• <strong>Public Access</strong>: Assets are reachable via shareable links without authentication.</p>
                    <p>• <strong>Protected Mode</strong>: Assets require a security code for decryption and retrieval.</p>
                    <p>• <strong>Internal Storage</strong>: Assets are stored in an obfuscated internal directory to prevent direct indexing.</p>
                </div>
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className={styles.glassCard} style={{ maxWidth: '800px', width: '100%', padding: '2rem', background: '#0a0a0a', border: '1px solid var(--admin-border-bright)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--admin-accent-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
                                    {getFileIcon(previewFile.type)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{previewFile.name}</h3>
                                    <p className={styles.label} style={{ fontSize: '0.7rem', color: 'var(--admin-text-dim)' }}>
                                        {previewFile.type.toUpperCase()} CONSTRUCT • {formatSize(previewFile.size)} • {previewFile.visibility?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewFile(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
                        </div>

                        <div style={{ width: '100%', height: '400px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                            {['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(previewFile.type.toLowerCase()) ? (
                                <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : ['mp4', 'webm', 'mov'].includes(previewFile.type.toLowerCase()) ? (
                                <video src={previewFile.url} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            ) : (
                                <div style={{ textAlign: 'center', opacity: 0.3 }}>
                                    <FileIcon size={80} style={{ margin: '0 auto 1rem' }} />
                                    <p>Visual Preview Unavailable for this type</p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div onClick={() => copyToClipboard(previewFile.shareUrl, 'Share Link')} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-border)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-accent)' }}>
                                    <Copy size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Secure Share URL</span>
                                </div>
                                <code style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8, wordBreak: 'break-all' }}>
                                    {previewFile.shareUrl.startsWith('/') ? window.location.origin + previewFile.shareUrl : previewFile.shareUrl}
                                </code>
                            </div>
                            <div onClick={() => copyToClipboard(previewFile.name, 'Database')} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-border)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#00ff00' }}>
                                    <Database size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Database Key</span>
                                </div>
                                <code style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8, wordBreak: 'break-all' }}>{previewFile.name}</code>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => window.open(previewFile.shareUrl, '_blank')} className={styles.blueBtn} style={{ flex: 1, justifyContent: 'center' }}>
                                <ArrowRight size={16} /> Open Share Landing Page
                            </button>
                            <button
                                onClick={() => {
                                    const direct = `/api/vault/share?file=${encodeURIComponent(previewFile.name)}&action=raw`;
                                    copyToClipboard(direct, 'Direct Link');
                                }}
                                className={styles.blueBtn}
                                style={{ flex: 1, justifyContent: 'center', background: 'var(--admin-accent-glow)' }}
                            >
                                <ExternalLink size={16} /> Copy Direct Asset Link
                            </button>
                        </div>
                        <button onClick={() => deleteFile(previewFile.name)} className={styles.logoutBtn} style={{ marginTop: '1rem', width: '100%', background: 'rgba(255, 77, 77, 0.1)' }}>
                            <Trash2 size={16} /> Purge Construct
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
