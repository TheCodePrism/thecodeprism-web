import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const VAULT_DIR = path.join(process.cwd(), "public", "vault");

// Ensure vault directory exists (redundant but safe)
async function ensureVaultDir() {
    try {
        await fs.access(VAULT_DIR);
    } catch {
        await fs.mkdir(VAULT_DIR, { recursive: true });
    }
}

export async function GET() {
    try {
        await ensureVaultDir();
        const files = await fs.readdir(VAULT_DIR);

        // Match files with stats if needed, or just return names
        const fileList = await Promise.all(
            files.map(async (fileName) => {
                const stats = await fs.stat(path.join(VAULT_DIR, fileName));
                return {
                    name: fileName,
                    size: stats.size,
                    updatedAt: stats.mtime,
                    type: path.extname(fileName).slice(1)
                };
            })
        );

        return NextResponse.json({ success: true, files: fileList });
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
            message: "File uploaded to local vault",
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
        const { fileName } = await req.json();

        if (!fileName) {
            return NextResponse.json({ success: false, error: "No fileName provided" }, { status: 400 });
        }

        const filePath = path.join(VAULT_DIR, fileName);

        // Read file content
        const buffer = await fs.readFile(filePath);
        const base64Content = buffer.toString("base64");
        const stats = await fs.stat(filePath);

        // Save to Firestore
        // Using fileName as ID for simplicity, or generate a slug
        const vaultDocRef = doc(db, "vault", fileName);
        await setDoc(vaultDocRef, {
            name: fileName,
            content: base64Content,
            size: stats.size,
            type: path.extname(fileName).slice(1),
            uploadedAt: new Date().toISOString(),
            source: "local_transfer"
        });

        return NextResponse.json({
            success: true,
            message: "File transferred to database"
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
