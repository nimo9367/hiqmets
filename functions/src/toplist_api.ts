import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";
const db = firestore();

export const getToplist = functions.https.onRequest(async (req, res) => {
    console.log(req.query);

    // Input data
    const cid = req.query.cid;

    // Query
    const result = await db
    .collection("user_stats")
    .orderBy("totalPoints", "desc")
    .where("cid", "==", cid)
    .get()
    .then(snap =>
        snap.docs.map(doc => {
        const entry = doc.data();
        entry.id = doc.id;
        return entry;
        })
    );
    res.status(200).send(result);
});
