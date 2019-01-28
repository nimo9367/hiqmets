import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
var db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

function recalculate(uid: string, cid: string, skipEmpty = false) {
    return db.collection('challenges').doc(cid).get().then(snap => {
        const challenge = snap.data();
        var entriesRef = db.collection('entries');
        return entriesRef.where('uid', '==', uid)
            .where('cid', '==', cid)
            .orderBy('created', 'desc')
            .where('created', '>=',  challenge.startdate)
            .where('created', '<=',  challenge.enddate)
            .get().then((snapshot: any) => {
                let totalKcal = 0;
                let totalPoints = 0;
                let totalMinutes = 0;
                let totalNumber = 0;
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if(data.minutes)
                        totalMinutes += parseInt(data.minutes);
                    if(data.kcal)
                        totalKcal += parseInt(data.kcal);
                    if(data.minutes && data.mets) 
                        totalPoints += parseInt((data.minutes * data.mets).toFixed())
                    totalNumber++;
                });
                const stats = {
                    uid: uid,
                    cid: cid,
                    totalPoints,
                    totalKcal,
                    totalMinutes,
                    totalNumber
                }
                if(stats.totalPoints)
                    return db.collection('user_stats').doc(uid).set(stats);
                return null;
        });
    });
}

exports.addedEntry = functions.firestore.document('entries/{eid}').onWrite((snap, context) => {
    console.log("New entry. Recreating stats...")
    let entry = snap.after.data();
    return recalculate(entry.uid, entry.cid);
});

exports.removeEntry = functions.firestore.document('entries/{eid}').onDelete((snap, context) => {
    console.log("Removed entry. Recreating stats...")
    let entry = snap.data();
    return recalculate(entry.uid, entry.cid);
});

exports.seedStats = functions.https.onRequest((req, res) => {
    console.log("Recreating complete stats...")
    const cid = req.query.cid;
    const usersRef = db.collection('users');
    return usersRef.get().then(snap => {
        const statsPromises = [];
        snap.forEach(doc => {
            const uid = doc.data().uid;
            statsPromises.push(recalculate(uid, cid));
        });
        return Promise.all(statsPromises)
            .catch(err => console.log(err))
            .then(() => res.status(200).send('OK'));
    });
  });