import { firestore } from "firebase-admin";
const db = firestore();

export default class Activities {
    static getActivities = async (req, res) => {
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
    }

    static getActivitiesForChallenge = async (req, res) => {
        const cid = req.params.cid;
        if(!cid) {
            res.status(400).send("Challenge id (cid) is missing");
            return;
        }
        let result;
        try {
            const available = await db
                .collection("activities")
                .get()
                .then(snap =>
                    snap.docs.map(doc => {
                        const activity = doc.data();
                        activity.id = doc.id;
                        return activity;
                    })
                );
            const challenge = await db.collection('challenges').doc(cid).get().then(snap => {
                const c = snap.data();
                c.id = snap.id;
                return c;
            });
            if(!challenge.activities)
                result = available;
            else
                result = available.filter(a => challenge.activities.some(aid => aid === a.id))
            res.status(200).send(result);
        }
        catch(e) {
            console.log(e);
        }
}
}