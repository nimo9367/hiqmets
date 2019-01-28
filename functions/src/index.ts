import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';
import * as _ from 'lodash';

admin.initializeApp();
var db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

function recalculate(uid: string, cid: string, skipEmpty = false) {
    return db.collection('challenges').doc(cid).get().then(snap => {
        const challenge = snap.data();
        const entriesRef = db.collection('entries');
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
  
exports.generateLapStats = functions.https.onRequest((req, res) => {
    const cid = req.query.cid;
    const runForReal = req.query.runforreal;
    const week = parseInt(req.query.week);
    console.log('Generating lap stats...');
    return db.collection('challenges').doc(cid).get().then(snap => {
        const challenge = snap.data();
        const startdate = moment(new Date(challenge.startdate.seconds * 1000)).add(7 * (week - 1), 'd').toDate();
        const enddate = moment(new Date(challenge.startdate.seconds * 1000)).add(7 * week, 'd').toDate();
        return db.collection('entries')
            .where('cid', '==', cid)
            .where('created', '>=', admin.firestore.Timestamp.fromDate(startdate))
            .where('created', '<=', admin.firestore.Timestamp.fromDate(enddate))
            .orderBy("created", "desc").get().then((entries) => {
                let userGroups = _.values(_.groupBy(entries.docs.map(x => x.data()), 'uid'));
                const stats = <any>[];
                userGroups.forEach((group: any) => {
                    const userStats = <any>{};
                    userStats.uid = group[0].uid;
                    userStats.points = _.sumBy(group, (e: any) => e.mets * e.minutes);
                    userStats.kcal =  _.sumBy(group, (e: any) => parseFloat(e.kcal));
                    userStats.minutes =  _.sumBy(group, (e: any) => parseFloat(e.minutes));
                    userStats.variation =  _.values(_.groupBy(group, 'aid')).length;
                    userStats.numberOfActs =  group.length;
                    userStats.longestAct = _.maxBy(group, (a: any) => parseFloat(a.minutes));
                    stats.push(userStats);
                });

                let winner = _.take(_.orderBy(stats, 'points', 'desc'), 3);
                let winnerKcal = _.take(_.orderBy(stats, 'kcal', 'desc'), 3);
                let winnerMinutes = _.take(_.orderBy(stats, 'minutes', 'desc'), 3);
                let winnerVariation = _.take(_.orderBy(stats, 'variation', 'desc'), 3);
                let winnerNumberOfActs = _.take(_.orderBy(stats, 'numberOfActs', 'desc'), 3);
                let winnerLongestAct = _.take(_.orderBy(stats,  (s:any) => parseFloat(s.longestAct.minutes), 'desc'), 3);

                const completeStats = <any>[];
                let placement = 1;
                winner.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winner',
                        value: w.points,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerKcal.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnerkcal',
                        value: w.kcal,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerMinutes.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnerminutes',
                        value: w.minutes,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerVariation.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnervariation',
                        value: w.variation,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerNumberOfActs.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnernumberofacts',
                        value: w.numberOfActs,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;
                
                winnerLongestAct.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnerlongestact',
                        value: parseFloat(w.longestAct.minutes),
                        week: week,
                        uid: w.uid,
                        metadata: w.longestAct.aid
                    });
                    placement++;
                });
                placement = 1;
                
                if(runForReal) {
                    const promises = []; 
                    completeStats.forEach((d: any) => {
                        promises.push(db.collection('stats').add(d));
                    });
                    return Promise.all(promises)
                        .catch(err => console.log(err))
                        .then(() => res.status(200).send('OK'));
                }
                return res.status(200).send(completeStats);
                // Vinnare v.X
                // Flest kcal
                // Flest minuter
                // Störst variation
                // Flest reggade aktiviteter 
                // Längsta pass

                // Populäraste aktivitet
                // Aktivitet med mest poäng
                // Aktivitet med mest tid
                // Aktivitet med högst förbränning
                
            });
    });
});