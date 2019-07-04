import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";
const db = firestore();

export const getFeed = functions.https.onRequest(async (req, res) => {
    console.log(req.query);

    // Input data
    const skip = parseInt(req.query.skip);
    const take = parseInt(req.query.take);
    const startdate = new Date(req.query.startdate);
    const enddate = new Date(req.query.enddate);

    // Query
    const result = await db
        .collection("entries")
        .orderBy("created", "desc")
        .where("created", ">=", startdate)
        .where("created", "<=", enddate)
        .limit(take)
        .offset(skip)
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
