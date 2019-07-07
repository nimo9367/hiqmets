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
        const cid: string = req.params.cid;
        if(!cid) {
            res.status(400).send("Challenge id (cid) is missing");
            return;
        }
        const result = await Activities.getChallangeActivities(cid);
        res.status(200).send(result);
    }

    static async getChallangeActivities(cid: string) {
        let result;
        const actSnap = await db
            .collection("activities")
            .get();
        const available = actSnap.docs.map(doc => {
            const activity = doc.data();
            activity.id = doc.id;
            return activity;
        });
        console.log("Found available acts for cid:" + cid);
        const snap = await db.collection('challenges').doc(cid).get();
        const challenge = snap.data();
        challenge.id = snap.id;
        console.log("Found challenge acts");
        if(!challenge.activities)
            result = available;
        else
            result = available.filter(a => challenge.activities.some(aid => aid === a.id))
        console.log("Activities done");
        return result;
    }
}