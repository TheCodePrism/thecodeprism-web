import { NextRequest, NextResponse } from "next/server";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const VAULT_PREFIX = "vault";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("file");
        const action = searchParams.get("action");
        const code = searchParams.get("code");

        if (!fileName) {
            return NextResponse.json({ success: false, error: "Missing identifier" }, { status: 400 });
        }

        console.log(`[VAULT_SHARE] Request for: ${fileName}, action: ${action}`);

        const vaultDocRef = doc(db, "vault", fileName);
        const docSnap = await getDoc(vaultDocRef);

        if (!docSnap.exists()) {
            // If not in Firestore, we can't really track it easily now, 
            // but we can try to check storage directly if needed.
            // For now, assume Firestore is the index.
            return NextResponse.json({ success: false, error: "Construct metadata not found" }, { status: 404 });
        }

        const data = docSnap.exists() ? docSnap.data() : { visibility: 'public' } as any;

        // Metadata request
        if (action !== "download" && action !== "raw") {
            return NextResponse.json({
                success: true,
                file: {
                    name: fileName,
                    visibility: data.visibility || 'public',
                    type: data.type || (fileName.split('.').pop() || 'bin'),
                    size: data.size || 0,
                    status: 'db'
                }
            });
        }

        // Security Check
        if (data.visibility === 'protected') {
            if (!code || code !== data.accessCode) {
                return NextResponse.json({ success: false, error: "Security breach detected: Unauthorized access" }, { status: 403 });
            }
        }

        let buffer: Buffer;

        try {
            // Attempt Cloud Storage retrieval
            const storageRef = ref(storage, `${VAULT_PREFIX}/${fileName}`);
            const url = await getDownloadURL(storageRef);
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } catch (e) {
            // Failover to Legacy Database content if cloud storage fails or is missing
            if (data.content) {
                buffer = Buffer.from(data.content, "base64");
            } else {
                return NextResponse.json({ success: false, error: "Construct payload missing in cloud storage" }, { status: 404 });
            }
        }

        const extension = (fileName.split('.').pop() || data.type || '').toLowerCase();
        const ext = extension.startsWith('.') ? extension : `.${extension}`;

        const contentTypeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.pdf': 'application/pdf',
        };

        const contentType = contentTypeMap[ext] || 'application/octet-stream';

        const headers: any = { 'Content-Type': contentType };
        if (action === "download") {
            headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
        }

        return new NextResponse(buffer as any, { headers });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { filename, accessCode } = await req.json();

        if (!filename || !accessCode) {
            return NextResponse.json({ success: false, error: "Missing security credentials" }, { status: 400 });
        }

        const vaultDocRef = doc(db, "vault", filename);
        const docSnap = await getDoc(vaultDocRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ success: false, error: "Construct not found" }, { status: 404 });
        }

        const data = docSnap.data();

        if (data.accessCode === accessCode) {
            return NextResponse.json({ success: true, message: "Decryption successful" });
        } else {
            return NextResponse.json({ success: false, error: "Invalid Security Code" }, { status: 403 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
