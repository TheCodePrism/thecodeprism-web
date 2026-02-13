import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const VAULT_DIR = path.join(process.cwd(), "src", "data", "vault");

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
            console.log(`[VAULT_SHARE] ${fileName} not in Firestore, checking local storage...`);
            const filePath = path.join(VAULT_DIR, fileName);
            try {
                await fs.stat(filePath);
                console.log(`[VAULT_SHARE] Found local file at ${filePath}`);
            } catch (e) {
                console.error(`[VAULT_SHARE] File not found local: ${filePath}`);
                return NextResponse.json({ success: false, error: "Construct not found" }, { status: 404 });
            }
        }

        const data = docSnap.exists() ? docSnap.data() : { visibility: 'public' } as any;

        // Metadata request
        if (action !== "download" && action !== "raw") {
            return NextResponse.json({
                success: true,
                file: {
                    name: fileName,
                    visibility: data.visibility || 'public',
                    type: data.type || path.extname(fileName).slice(1),
                    size: data.size || 0,
                    status: docSnap.exists() ? 'db' : 'local'
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
        const filePath = path.join(VAULT_DIR, fileName);

        try {
            // Attempt local retrieval
            buffer = await fs.readFile(filePath);
        } catch (e) {
            // Failover to Database if local is missing
            if (data.content) {
                buffer = Buffer.from(data.content, "base64");
            } else {
                return NextResponse.json({ success: false, error: "Construct payload missing" }, { status: 404 });
            }
        }

        const ext = path.extname(fileName).toLowerCase() || `.${data.type}`;
        const contentType = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.pdf': 'application/pdf',
        }[ext] || 'application/octet-stream';

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
