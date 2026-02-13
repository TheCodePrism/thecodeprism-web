import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// Secure storage directory (not publicly accessible)
const VAULT_DIR = path.join(process.cwd(), "src", "data", "vault");

async function ensureVaultDir() {
    try {
        await fs.access(VAULT_DIR);
    } catch {
        await fs.mkdir(VAULT_DIR, { recursive: true });
    }
}

export async function GET(req: NextRequest) {
    try {
        await ensureVaultDir();

        const { searchParams } = new URL(req.url);
        const fileToFetch = searchParams.get("file");
        const action = searchParams.get("action");

        // Admin preview action: stream file from secure storage
        if (fileToFetch && action === "preview") {
            const filePath = path.join(VAULT_DIR, fileToFetch);
            try {
                const buffer = await fs.readFile(filePath);
                const ext = path.extname(fileToFetch).toLowerCase();
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

                return new NextResponse(buffer, {
                    headers: { 'Content-Type': contentType }
                });
            } catch (e) {
                return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
            }
        }

        const files = await fs.readdir(VAULT_DIR);

        const fileList = await Promise.all(
            files.map(async (fileName) => {
                if (fileName === '.gitkeep') return null;
                const filePath = path.join(VAULT_DIR, fileName);
                const stats = await fs.stat(filePath);

                // Cross-reference with Firestore for security settings
                const docRef = doc(db, "vault", fileName);
                const docSnap = await getDoc(docRef);
                const data = docSnap.exists() ? docSnap.data() : {};

                return {
                    name: fileName,
                    size: stats.size,
                    updatedAt: stats.mtime,
                    type: path.extname(fileName).slice(1).toLowerCase(),
                    url: `/api/vault?file=${encodeURIComponent(fileName)}&action=preview`, // Secure admin preview URL
                    shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/v/${encodeURIComponent(fileName)}`,
                    status: docSnap.exists() ? 'db' : 'local',
                    visibility: data.visibility || 'public',
                    hasAccessCode: !!data.accessCode
                };
            })
        );

        return NextResponse.json({
            success: true,
            files: fileList.filter(f => f !== null)
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureVaultDir();
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(VAULT_DIR, file.name);

        await fs.writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            message: "File uploaded to secure vault",
            file: {
                name: file.name,
                size: file.size,
                type: file.type
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { fileName, visibility, accessCode, syncToDB } = await req.json();

        if (!fileName) {
            return NextResponse.json({ success: false, error: "No fileName provided" }, { status: 400 });
        }

        const filePath = path.join(VAULT_DIR, fileName);
        const stats = await fs.stat(filePath);

        const vaultDocRef = doc(db, "vault", fileName);
        const docSnap = await getDoc(vaultDocRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};

        const updateData: any = {
            ...currentData,
            name: fileName,
            size: stats.size,
            type: path.extname(fileName).slice(1).toLowerCase(),
            updatedAt: new Date().toISOString(),
        };

        if (visibility !== undefined) updateData.visibility = visibility;
        if (accessCode !== undefined) updateData.accessCode = accessCode; // Should be encrypted in a real app

        if (syncToDB) {
            const buffer = await fs.readFile(filePath);
            updateData.content = buffer.toString("base64");
            updateData.source = "local_transfer";
        }

        await setDoc(vaultDocRef, updateData);

        return NextResponse.json({
            success: true,
            message: "Vault construct security protocols updated"
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("file");

        if (!fileName) {
            return NextResponse.json({ success: false, error: "No file name provided" }, { status: 400 });
        }

        const filePath = path.join(VAULT_DIR, fileName);

        try {
            await fs.unlink(filePath);
        } catch (e) { }

        const vaultDocRef = doc(db, "vault", fileName);
        await deleteDoc(vaultDocRef);

        return NextResponse.json({
            success: true,
            message: "Construct purged from vault"
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
