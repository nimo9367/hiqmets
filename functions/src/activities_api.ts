import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";
const db = firestore();
import * as cors from 'cors';
const corsHandler = cors({origin: true});


export const getActivities = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        const result = await db
            .collection("activities")
            .get()
            .then(snap =>
                snap.docs.map(doc => {
                    const activity = doc.data();
                    activity.id = doc.id;
                    return activity;
                })
            );
        res.status(200).send(result);
    });
});
