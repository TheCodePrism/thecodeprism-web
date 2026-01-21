import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export async function sendPushNotification(title: string, body: string, data: any = {}) {
    try {
        const tokensDoc = await getDoc(doc(db, "config", "push_tokens"));
        if (!tokensDoc.exists()) return;

        const tokens = tokensDoc.data().tokens as string[];
        if (!tokens || tokens.length === 0) return;

        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data,
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();
        console.log("Push Notification Result:", result);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
}
