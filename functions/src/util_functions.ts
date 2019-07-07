import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';
import * as _ from 'lodash';
import Activities from './activities_api';

const DEBUGGING = true;
const db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

export const changedEntry = functions.firestore.document('entries/{eid}').onWrite(async (change, context) => {
    console.log("Entry change. Recreating stats...");
    const entry = change.after.exists ? change.after.data() : change.before.data();
    console.log('Recreate uid: ' + entry.uid);
    return recalculate(entry.uid);
});

export const changedChallenge = functions.firestore.document('challenges/{cid}').onUpdate((change, context) => {
    console.log("Challenge change. Recreating stats...")
    console.log('Recreate challenge stats cid:' + context.params.cid);
    return seedChallengeStats(context.params.cid);
});

export const userUpdate = functions.firestore.document('users/{uid}').onUpdate((change, context) => {
    console.log("User change. Recreating stats...")
    if(change.after.data().default_challenge !== change.before.data().default_challenge){
        console.log('Recreate challenge stats cid:' + change.after.data().default_challenge );
        console.log('Recreate uid: ' + change.after.data().uid);
        if(change.after.data().default_challenge !== change.before.data().default_challenge) {
            return recalculate(change.after.data().uid);
        }
    }
    else
        console.log('No need to update. No change in default_callenge');
    return "No update";
});

export const seedStats = functions.https.onRequest((req, res) => {
    console.log("Recreating complete stats...")
    const cid = req.query.cid;
    return seedChallengeStats(cid).then(() => res.status(200).send('OK'));
});
  
export const generateLapStats = functions.https.onRequest((req, res) => {
    const cid = req.query.cid;
    const runForReal = req.query.runforreal;
    const week = parseInt(req.query.week);
    log('Generating lap stats...');
    return db.collection('challenges').doc(cid).get().then(snap => {
        const challenge = snap.data();
        const startdate = moment(new Date(challenge.startdate.seconds * 1000)).add(7 * (week - 1), 'd').toDate();
        const enddate = moment(new Date(challenge.startdate.seconds * 1000)).add(7 * week, 'd').toDate();
        return db.collection('entries')
            .where('cid', '==', cid)
            .where('created', '>=', admin.firestore.Timestamp.fromDate(startdate))
            .where('created', '<=', admin.firestore.Timestamp.fromDate(enddate))
            .orderBy("created", "desc").get().then((entries) => {
                const userGroups = _.values(_.groupBy(entries.docs.map(x => x.data()), 'uid'));
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

                const winner = _.take(_.orderBy(stats, 'points', 'desc'), 3);
                const winnerKcal = _.take(_.orderBy(stats, 'kcal', 'desc'), 3);
                const winnerMinutes = _.take(_.orderBy(stats, 'minutes', 'desc'), 3);
                const winnerVariation = _.take(_.orderBy(stats, 'variation', 'desc'), 3);
                const winnerNumberOfActs = _.take(_.orderBy(stats, 'numberOfActs', 'desc'), 3);
                const winnerLongestAct = _.take(_.orderBy(stats,  (s:any) => parseFloat(s.longestAct.minutes), 'desc'), 3);

                const completeStats = <any>[];
                let placement = 1;
                winner.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winner',
                        value: w.points,
                        week: week,
                        uid: w.uid,
                        cid: cid
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
                        uid: w.uid,
                        cid: cid
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
                        uid: w.uid,
                        cid: cid
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
                        uid: w.uid,
                        cid: cid
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
                        uid: w.uid,
                        cid: cid
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
                        metadata: w.longestAct.aid,
                        cid: cid
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

export async function recalculate(uid: string) {
    try {
        log('Getting user...');
        const userReq = await db.collection('users').where('uid', '==', uid).get();
        let challenges = [];
        const recalcs = [];
        let c = '';
        userReq.forEach(doc => {
            challenges = doc.data().challenges;
            c = doc.data().default_challenge;
            log(doc.data());
        });
        log('Getting done');
        for (c of challenges) {
            log('Getting activities...');
            const availableActivities = await Activities.getChallangeActivities(c);
            log('Getting activities done. Reacreating: ' + c);
            recalcs.push(await recalculateSingle(uid, c, availableActivities));
        }
        return recalcs;
    }
    catch(e) {
        console.log(e);
        return "Error";
    }
}

async function recalculateSingle(uid: string, cid: string, availableActivities: any[]) {
    log("Getting Entries for cid: " +  cid)
    const snap = await db.collection('challenges').doc(cid).get();
    log("Found challengr for cid: " +  cid);
    const challenge = snap.data();
    const snapshot = await  db.collection('entries').where('uid', '==', uid)
        .orderBy('created', 'desc')
        .where('created', '>=',  challenge.startdate)
        .where('created', '<=',  challenge.enddate)
        .get();
    let totalKcal = 0;
    let totalPoints = 0;
    let totalMinutes = 0;
    let totalNumber = 0;
    log("Found Entries for cid: " +  cid)
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if(!availableActivities || !availableActivities.length || availableActivities.some(x => x.id === data.aid)) {
            if(data.minutes)
                totalMinutes += parseInt(data.minutes);
            if(data.kcal)
                totalKcal += parseInt(data.kcal);
            if(data.minutes && data.mets) 
                totalPoints += parseInt((data.minutes * data.mets).toFixed())
            totalNumber++;
        }
    });
    const stats = {
        uid: uid,
        cid: cid,
        totalPoints,
        totalKcal,
        totalMinutes,
        totalNumber
    }
    log("Stats done for cid: " + cid);
    if(stats.totalPoints)
        await db.collection('user_stats').doc(uid + '_' + cid).set(stats);
    return stats;
}

function seedChallengeStats(cid: string) {
    const usersRef = db.collection('users');
    return usersRef.get().then(snap => {
        const statsPromises = [];
        snap.forEach(doc => {
            const uid = doc.data().uid;
            statsPromises.push(recalculate(uid));  
        });
        return Promise.all(statsPromises)
            .catch(err => console.log(err));
    });
}

function log(obj: any) {
    if(DEBUGGING)
        console.log(obj)
}