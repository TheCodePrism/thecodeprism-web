import Link from 'next/link';
import styles from '@/app/not-found.module.css';
import { ShieldAlert } from 'lucide-react';

interface NotFoundViewProps {
    children?: React.ReactNode;
}

export default function NotFoundView({ children }: NotFoundViewProps) {
    return (
        <div className={styles.container}>
            <ShieldAlert size={64} style={{ opacity: 0.8 }} />
            <h1 className={styles.errorCode}>404</h1>
            <p className={styles.errorTitle}>Page Not Found</p>

            {children}

            {!children && (
                <Link href="/" className={styles.homeLink}>
                    Return Home
                </Link>
            )}
        </div>
    );
}
