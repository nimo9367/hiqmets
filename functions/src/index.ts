import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

exports.recreateStats = functions.firestore.document('entries/{eid}')
    .onWrite((snap, context) => {
        let entry = snap.before.data();
        console.log(entry);
        return admin.database().ref('/entries').orderByChild('uid').equalTo(entry.uid)
            .once('value').then((stats: any) => {
                console.log(stats.val());
        });
    });