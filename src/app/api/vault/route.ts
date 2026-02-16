import { NextRequest, NextResponse } from "next/server";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Vault storage prefix in Firebase Storage
const VAULT_PREFIX = "vault";

// No longer using local filesystem

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("file");
        const action = searchParams.get("action");

        // Admin preview action: stream file from Firebase Storage or redirect
        if (fileName && action === "preview") {
            try {
                const storageRef = ref(storage, `${VAULT_PREFIX}/${fileName}`);
                const url = await getDownloadURL(storageRef);

                // Fetch the file to stream it and keep the "secure" feel (masking the direct Firebase URL)
                const res = await fetch(url);
                const buffer = await res.arrayBuffer();
                const contentType = res.headers.get("content-type") || "application/octet-stream";

                return new NextResponse(buffer, {
                    headers: { 'Content-Type': contentType }
                });
            } catch (e) {
                return NextResponse.json({ success: false, error: "File not found in storage" }, { status: 404 });
            }
        }

        // List files from Firestore metadata
        const vaultSnapshot = await getDocs(collection(db, "vault"));

        const fileList = vaultSnapshot.docs.map(doc => {
            const data = doc.data();
            const fileName = doc.id;

            return {
                name: fileName,
                size: data.size || 0,
                updatedAt: data.updatedAt,
                type: (fileName.split('.').pop() || 'bin').toLowerCase(),
                url: `/api/vault?file=${encodeURIComponent(fileName)}&action=preview`,
                shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/v/${encodeURIComponent(fileName)}`,
                status: 'db', // Always synced to cloud now
                visibility: data.visibility || 'public',
                hasAccessCode: !!data.accessCode
            };
        });

        return NextResponse.json({
            success: true,
            files: fileList
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const storageRef = ref(storage, `${VAULT_PREFIX}/${file.name}`);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, buffer, {
            contentType: file.type
        });

        // Initialize Firestore metadata
        const vaultDocRef = doc(db, "vault", file.name);
        await setDoc(vaultDocRef, {
            name: file.name,
            size: file.size,
            type: file.type,
            updatedAt: new Date().toISOString(),
            visibility: 'public',
            source: 'cloud_upload'
        });

        return NextResponse.json({
            success: true,
            message: "File uploaded to cloud vault",
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
        const { fileName, visibility, accessCode } = await req.json();

        if (!fileName) {
            return NextResponse.json({ success: false, error: "No fileName provided" }, { status: 400 });
        }

        const vaultDocRef = doc(db, "vault", fileName);
        const docSnap = await getDoc(vaultDocRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ success: false, error: "Metadata not found" }, { status: 404 });
        }

        const currentData = docSnap.data();
        const updateData: any = {
            ...currentData,
            updatedAt: new Date().toISOString(),
        };

        if (visibility !== undefined) updateData.visibility = visibility;
        if (accessCode !== undefined) updateData.accessCode = accessCode;

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

        try {
            const storageRef = ref(storage, `${VAULT_PREFIX}/${fileName}`);
            await deleteObject(storageRef);
        } catch (e) {
            console.error("Error deleting from storage:", e);
        }

        const vaultDocRef = doc(db, "vault", fileName);
        await deleteDoc(vaultDocRef);

        return NextResponse.json({
            success: true,
            message: "Construct purged from cloud vault"
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
