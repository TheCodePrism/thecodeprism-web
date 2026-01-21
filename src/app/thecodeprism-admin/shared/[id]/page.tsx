"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import styles from "../../admin.module.css";
import { Loader2, ShieldCheck, ShieldAlert, Fingerprint, Lock } from "lucide-react";

export default function SharedLinkPage() {
    const { id } = useParams();
    const router = useRouter();
    const [linkData, setLinkData] = useState<any>(null);
    const [status, setStatus] = useState<"loading" | "active" | "awaiting" | "authenticated" | "expired" | "not_found" | "access_denied">("loading");
    const [visitorId, setVisitorId] = useState<string>("");

    useEffect(() => {
        // Generate or retrieve visitor ID for this session
        let vid = sessionStorage.getItem("tcp_visitor_id");
        if (!vid) {
            vid = crypto.randomUUID();
            sessionStorage.setItem("tcp_visitor_id", vid);
        }
        setVisitorId(vid);
    }, []);

    useEffect(() => {
        if (!id || !visitorId) return;

        const checkLink = async () => {
            const docRef = doc(db, "shared_links", id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // Expiration check
                if (data.status === "authenticated" && data.expiresAt) {
                    if (new Date(data.expiresAt).getTime() <= new Date().getTime()) {
                        setStatus("expired");
                        return;
                    }
                }

                setLinkData(data);

                // Initial status check with Visitor Binding
                if (data.status === "authenticated") {
                    if (data.visitorId === visitorId) {
                        setStatus("authenticated");
                        // Store shared session
                        localStorage.setItem("tcp_admin_session", id as string);
                        localStorage.setItem("tcp_admin_is_shared", "true");
                        setTimeout(() => router.push("/thecodeprism-admin"), 2000);
                    } else {
                        setStatus("access_denied");
                    }
                } else {
                    setStatus(data.status);
                }

                // Listen for changes
                const unsub = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        const updatedData = snap.data();

                        if (updatedData.status === "authenticated") {
                            if (updatedData.visitorId === visitorId) {
                                setStatus("authenticated");
                                localStorage.setItem("tcp_admin_session", id as string);
                                localStorage.setItem("tcp_admin_is_shared", "true");
                                setTimeout(() => router.push("/thecodeprism-admin"), 2000);
                            } else {
                                setStatus("access_denied");
                            }
                        } else {
                            setStatus(updatedData.status);
                        }
                    }
                });

                return unsub;
            } else {
                setStatus("not_found");
            }
        };

        checkLink();
    }, [id, visitorId]); // Depend on visitorId so we don't check until we have it

    const handleRequestAccess = async () => {
        if (!id || !visitorId) return;
        setStatus("awaiting");
        await updateDoc(doc(db, "shared_links", id as string), {
            status: "awaiting_auth",
            requestedAt: new Date().toISOString(),
            visitorId: visitorId // Bind verification to this browser
        });
    };

    if (status === "loading") {
        return (
            <div className={styles.container}>
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p style={{ marginTop: '1rem', color: '#666' }}>Verifying secure link...</p>
            </div>
        );
    }

    if (status === "not_found") {
        return (
            <div className={styles.container}>
                <ShieldAlert className="text-red-500" size={64} />
                <h1 className={styles.errorCode}>404</h1>
                <p className={styles.errorTitle}>Secure Link Not Found</p>
            </div>
        );
    }

    if (status === "expired") {
        return (
            <div className={styles.container}>
                <ShieldAlert className="text-yellow-500" size={64} />
                <h1 style={{ marginTop: '2rem' }}>Link Expired</h1>
                <p style={{ color: '#666', marginTop: '1rem' }}>
                    This secure authentication link has expired.
                </p>
            </div>
        );
    }

    // awaiting state
    if (status === "awaiting") {
        return (
            <div className={styles.container}>
                <div className={styles.qrContainer}>
                    <Loader2 className="animate-spin text-blue-500" size={48} style={{ margin: '0 auto', display: 'block' }} />
                    <h2 style={{ marginTop: '1.5rem', color: '#333' }}>Waiting for Approval</h2>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Please wait while the admin approves your access request.
                    </p>
                </div>
            </div>
        );
    }

    // authenticated state
    if (status === "authenticated") {
        return (
            <div className={styles.container}>
                <div className={styles.qrContainer}>
                    <ShieldCheck className="text-green-500" size={64} style={{ margin: '0 auto', display: 'block' }} />
                    <h2 style={{ marginTop: '1.5rem', color: '#333' }}>Access Granted</h2>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Redirecting to admin dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // access_denied UI
    if (status === "access_denied") {
        return (
            <div className={styles.container}>
                <Lock className="text-red-500" size={64} />
                <h1 style={{ marginTop: '2rem' }}>Access Denied</h1>
                <p style={{ color: '#666', marginTop: '1rem' }}>
                    This link is already in use by another Authenticated session.
                </p>
            </div>
        );
    }

    // Default: Active state - Request Access
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Fingerprint className="text-blue-500" size={80} style={{ opacity: 0.8 }} />
                <h1 style={{ fontSize: '2.5rem', margin: '2rem 0 1rem' }}>
                    Secure Admin Access
                </h1>
                <p style={{ color: '#aaa', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                    You are attempting to access a secured administrative area.
                    Please request access to verify your identity.
                </p>

                {linkData && (
                    <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#888' }}>Session ID</p>
                        <code style={{ color: '#4facfe' }}>{id}</code>
                    </div>
                )}

                <button onClick={handleRequestAccess} className={styles.primaryBtn}>
                    <ShieldCheck size={20} />
                    Request Admin Access
                </button>
            </div>
        </div>
    );
}
