import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";
var db = firestore();

export const getActivities = functions.https.onRequest(async (req, res) => {
    const result = await db
        .collection("activities")
        .get()
        .then(snap =>
            snap.docs.map(doc => {
                let activity = doc.data();
                activity.id = doc.id;
                return activity;
            })
        );
    res.status(200).send(result);
});
