"use client";

import { useState, useEffect } from "react";
import { Upload, Database, File as FileIcon, Trash2, Folder, CheckCircle, Clock, ArrowRight, Loader2 } from "lucide-react";
import styles from "../../app/thecodeprism-admin/admin.module.css";

interface VaultFile {
    name: string;
    size: number;
    updatedAt: string;
    type: string;
    status: 'local' | 'db' | 'transferring';
}

export default function VaultEditor() {
    const [files, setFiles] = useState<VaultFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/vault");
            const data = await res.json();
            if (data.success) {
                // For now, we assume if they are in the folder, they are 'local'
                // In a real app, we might check DB status as well
                setFiles(data.files.map((f: any) => ({ ...f, status: 'local' })));
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

    const transferToDB = async (fileName: string) => {
        setFiles(prev => prev.map(f => f.name === fileName ? { ...f, status: 'transferring' } : f));

        try {
            const res = await fetch("/api/vault", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName })
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
                        <p className={styles.label} style={{ color: 'var(--admin-text-secondary)' }}>Manage assets and persistent storage constructs</p>
                    </div>
                    <label className={styles.primaryBtn} style={{ cursor: 'pointer' }}>
                        {uploading ? <Loader2 className={styles.pulse} size={18} /> : <Upload size={18} />}
                        {uploading ? "Uploading..." : "Import Construct"}
                        <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
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
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {files.map((file) => (
                            <div key={file.name} className={styles.glassCard} style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    background: 'rgba(79, 172, 254, 0.1)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--admin-accent)'
                                }}>
                                    <FileIcon size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>{file.name}</h4>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Database size={12} /> {formatSize(file.size)}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} /> {new Date(file.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {file.status === 'local' && (
                                        <button
                                            onClick={() => transferToDB(file.name)}
                                            className={styles.blueBtn}
                                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                        >
                                            <Database size={14} />
                                            Transfer to DB
                                            <ArrowRight size={14} />
                                        </button>
                                    )}
                                    {file.status === 'transferring' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-accent)', fontSize: '0.8rem' }}>
                                            <Loader2 size={16} className={styles.pulse} />
                                            Syncing...
                                        </div>
                                    )}
                                    {file.status === 'db' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff00', fontSize: '0.8rem' }}>
                                            <CheckCircle size={16} />
                                            Stored in DB
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.glassCard} style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                <h3 className={styles.label} style={{ marginBottom: '1rem' }}>Storage Intelligence</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', lineHeight: '1.6' }}>
                    <p>• Files uploaded here are first stored in the project's dedicated `/public/vault` directory.</p>
                    <p>• Transferring to Database encodes the file into Base64 and stores it within Cloud Firestore for global persistence.</p>
                    <p>• Note: Firestore documents have a 1MB size limit. Use this for configurations, small assets, and data blocks.</p>
                </div>
            </div>
        </div>
    );
}
