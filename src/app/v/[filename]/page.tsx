"use client";

import { useState, useEffect, use } from "react";
import { Lock, Unlock, Download, FileIcon, Loader2, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import styles from "../../portfolio.module.css";
import gateStyles from "./gatekeeper.module.css";
import QuantumLoader from "@/components/visuals/QuantumLoader";

export default function Gatekeeper({ params }: { params: Promise<{ filename: string }> }) {
    const { filename: rawFilename } = use(params);
    const filename = rawFilename ? decodeURIComponent(rawFilename) : "";
    const [status, setStatus] = useState<'loading' | 'public' | 'protected' | 'error'>('loading');
    const [fileData, setFileData] = useState<any>(null);
    const [accessCode, setAccessCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (filename) checkVisibility();
    }, [filename]);

    const checkVisibility = async () => {
        try {
            // We'll create a lightweight check API or just use the main one if it's safe
            // For now, let's assume we have an endpoint that tells us if it's locked
            const res = await fetch(`/api/vault/share?file=${encodeURIComponent(filename)}`);
            const data = await res.json();

            if (data.success) {
                setFileData(data.file);
                setStatus(data.file.visibility);
            } else {
                setStatus('error');
                setError(data.error);
            }
        } catch (err) {
            setStatus('error');
            setError("Failed to establish secure connection");
        }
    };

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setError(null);

        try {
            const res = await fetch(`/api/vault/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename, accessCode })
            });
            const data = await res.json();

            if (data.success) {
                // Trigger download or show the file
                window.location.href = `/api/vault/share?file=${encodeURIComponent(filename)}&code=${encodeURIComponent(accessCode)}&action=download`;
            } else {
                setError(data.error || "Access Denied: Invalid Security Code");
            }
        } catch (err) {
            setError("Verification sequence interrupted");
        } finally {
            setVerifying(false);
        }
    };

    if (status === 'loading') return <QuantumLoader />;

    return (
        <div className={styles.container}>
            <div className={styles.scanlineOverlay} />
            <div className={styles.grainOverlay} />

            <main className={gateStyles.gateWrapper}>
                <div className={`${styles.glassCard} ${gateStyles.gateCard}`}>
                    <div className={gateStyles.gateHeader}>
                        <div className={gateStyles.iconShield}>
                            {status === 'public' ? <Unlock size={32} /> : <Lock size={32} />}
                        </div>
                        <h1 className={styles.vfxChromatic}>Secure Access Point</h1>
                        <p className={styles.timelineLabel}>CONSTRUCT_IDENTIFIER: {filename}</p>
                    </div>

                    {status === 'error' ? (
                        <div className={gateStyles.errorState}>
                            <ShieldAlert size={48} color="rgba(255,0,0,0.5)" />
                            <p>{error || "This construct has been purged or is inaccessible."}</p>
                            <button onClick={() => window.location.href = '/'} className={styles.projectLink}>Return to Terminal</button>
                        </div>
                    ) : status === 'public' ? (
                        <div className={gateStyles.contentState}>
                            <div className={gateStyles.fileInfo}>
                                <FileIcon size={64} style={{ opacity: 0.2 }} />
                                <h3>{filename}</h3>
                                <p>{fileData?.type.toUpperCase()} • {(fileData?.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <a
                                href={`/api/vault/share?file=${encodeURIComponent(filename)}&action=download`}
                                className={styles.projectLink}
                                style={{ fontSize: '1.2rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
                            >
                                <Download size={20} /> Access Construct
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={verifyCode} className={gateStyles.codeForm}>
                            <p className={gateStyles.instruction}>This construct is <strong>PROTECTED</strong>. Enter the decrypted security code to initialize extraction.</p>

                            <div className={gateStyles.inputWrapper}>
                                <input
                                    type="password"
                                    placeholder="Enter Access Code"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className={gateStyles.codeInput}
                                    autoFocus
                                />
                                <button type="submit" disabled={verifying} className={gateStyles.submitBtn}>
                                    {verifying ? <Loader2 className={styles.pulse} size={20} /> : <ArrowRight size={20} />}
                                </button>
                            </div>

                            {error && (
                                <div className={gateStyles.errorMessage}>
                                    <ShieldAlert size={14} /> {error}
                                </div>
                            )}

                            <div className={gateStyles.footerInfo}>
                                <ShieldCheck size={14} /> End-to-End Encrypted Handshake
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
