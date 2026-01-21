"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function InitializationProvider({ children }: { children: React.ReactNode }) {
    const [initialized, setInitialized] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkInitialization = async () => {
            // First check local storage for cache
            // We use 'true' as string because localStorage stores strings
            const cachedInit = localStorage.getItem("tcp_initialized");

            if (cachedInit === "true") {
                setInitialized(true);
                // We still verify in background if we wanted to be super secure, 
                // but for now we trust the cache to avoid the flash.
                // If we want to re-verify occasionally, we could do it here without blocking UI
                return;
            }

            // If we are already on the setup page, don't check (prevent infinite loop)
            if (pathname === "/setup") {
                setInitialized(true);
                return;
            }

            try {
                const docRef = doc(db, "config", "admin_setup");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().initialized) {
                    setInitialized(true);
                    localStorage.setItem("tcp_initialized", "true");
                } else {
                    setInitialized(false);
                    router.push("/setup");
                }
            } catch (error) {
                console.error("Error checking initialization:", error);
                // Better error handling would be good, but for now we fallback
                setInitialized(true);
            }
        };

        checkInitialization();
        // We only run this on mount. The initial check is sufficient.
        // We do NOT want to re-run on every pathname change as that causes the flashing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (initialized === null) {
        // Show a loading state or nothing while checking
        // Using a more stylized loading screen
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#121212',
                color: 'white',
                fontFamily: 'sans-serif'
            }}>
                <style jsx global>{`
                    @keyframes pulse-ring {
                        0% { transform: scale(0.8); opacity: 0.5; }
                        50% { transform: scale(1.2); opacity: 0.2; }
                        100% { transform: scale(0.8); opacity: 0.5; }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid rgba(79, 172, 254, 0.3)',
                        animation: 'pulse-ring 2s infinite ease-in-out'
                    }}></div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid transparent',
                        borderTop: '3px solid #4facfe',
                        borderRight: '3px solid #00f2fe',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                </div>
                <h1 style={{
                    marginTop: '2rem',
                    fontSize: '1.2rem',
                    fontWeight: 300,
                    letterSpacing: '2px',
                    background: 'linear-gradient(to right, #fff, #aaa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    THE CODE PRISM
                </h1>
            </div>
        );
    }

    return <>{children}</>;
}
