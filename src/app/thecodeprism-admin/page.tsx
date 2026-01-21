"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QRCodeCanvas } from "qrcode.react";
import styles from "./admin.module.css";
import Dashboard from "@/components/admin/Dashboard";
import NotFoundView from "@/components/NotFoundView";

export default function AdminPage() {
    const [qrId, setQrId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
    const [remoteEnabled, setRemoteEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sharedConstraints, setSharedConstraints] = useState<{ userType: string, accessType: string } | null>(null);

    useEffect(() => {
        // 1. Listen for mobile enable toggle (QR visibility)
        const statusUnsub = onSnapshot(doc(db, "config", "admin_status"), (doc) => {
            if (doc.exists()) {
                const enabled = doc.data().remoteEnabled;
                setRemoteEnabled(enabled);
                if (enabled && !isAuthenticated && !qrId) {
                    generateNewQR();
                }
            }
        });

        // 2. Listen for current session changes (if authenticated)
        let sessionUnsub: (() => void) | null = null;

        const checkAuth = async () => {
            const savedSessionId = localStorage.getItem("tcp_admin_session");
            if (savedSessionId) {
                const isShared = localStorage.getItem("tcp_admin_is_shared") === "true";
                const collectionName = isShared ? "shared_links" : "sessions";
                const sessionRef = doc(db, collectionName, savedSessionId);

                // Add real-time listener for THIS session
                sessionUnsub = onSnapshot(sessionRef, (docSnap) => {
                    if (!docSnap.exists() || docSnap.data().status !== "authenticated") {
                        // Remote termination or status change
                        localStorage.removeItem("tcp_admin_session");
                        setIsAuthenticated(false);
                        setSessionExpiry(null);

                        // Disable remote toggle to hide QR
                        updateDoc(doc(db, "config", "admin_status"), {
                            remoteEnabled: false,
                            updatedAt: new Date().toISOString()
                        });

                        if (sessionUnsub) {
                            sessionUnsub();
                            sessionUnsub = null;
                        }
                    } else {
                        // Handle time adjustments from mobile
                        const expiry = docSnap.data().expiresAt;
                        if (docSnap.data().userType) {
                            setSharedConstraints({
                                userType: docSnap.data().userType,
                                accessType: docSnap.data().accessType
                            });
                        }
                        if (expiry) {
                            const expiryTime = new Date(expiry).getTime();
                            if (expiryTime <= new Date().getTime()) {
                                handleLogout(); // Expired locally
                            } else {
                                setSessionExpiry(expiryTime);
                                setIsAuthenticated(true);
                                setLoading(false);
                            }
                        }
                    }
                });
            } else {
                setLoading(false);
            }
        };

        checkAuth();

        return () => {
            statusUnsub();
            if (sessionUnsub) sessionUnsub();
        };
    }, [isAuthenticated, qrId]);

    const generateNewQR = async () => {
        const newQrId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setQrId(newQrId);

        // Create pending session in Firestore
        await setDoc(doc(db, "sessions", newQrId), {
            status: "pending",
            createdAt: new Date().toISOString(),
            type: "admin_auth"
        });

        // Listen for authentication
        const unsub = onSnapshot(doc(db, "sessions", newQrId), (doc) => {
            if (doc.exists() && doc.data().status === "authenticated") {
                localStorage.setItem("tcp_admin_session", newQrId);
                setIsAuthenticated(true);
                setSessionExpiry(new Date(doc.data().expiresAt).getTime());
                unsub();
            }
        });

        setLoading(false);
    };

    const handleLogout = async () => {
        const sessionId = localStorage.getItem("tcp_admin_session");
        const isShared = localStorage.getItem("tcp_admin_is_shared") === "true";
        if (sessionId) {
            const collectionName = isShared ? "shared_links" : "sessions";
            await deleteDoc(doc(db, collectionName, sessionId));
            localStorage.removeItem("tcp_admin_session");
            localStorage.removeItem("tcp_admin_is_shared");
        }

        // Disable remote toggle to hide QR
        await updateDoc(doc(db, "config", "admin_status"), {
            remoteEnabled: false,
            updatedAt: new Date().toISOString()
        });

        setIsAuthenticated(false);
        setQrId(null); // Clear QR state
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <p>Initialising Security Layer...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <NotFoundView>
                {remoteEnabled && (
                    <div className={styles.qrContainer} style={{ marginTop: '2rem' }}>
                        {qrId && (
                            <QRCodeCanvas
                                value={JSON.stringify({ qrId, action: "authenticate_admin" })}
                                size={180}
                                level={"H"}
                                includeMargin={true}
                            />
                        )}
                        <div className={styles.authText} style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
                            OFFICER AUTHENTICATION REQUIRED
                        </div>
                    </div>
                )}
            </NotFoundView>
        );
    }

    return (
        <div className={styles.container} style={{ background: '#0a0a0a', justifyContent: 'flex-start' }}>
            <Dashboard
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                sharedConstraints={sharedConstraints}
                sessionExpiry={sessionExpiry}
            />
        </div>
    );
}
