import * as functions from 'firebase-functions';
import { firestore } from "firebase-admin";
var db = firestore();

export const getChallanges =  functions.https.onRequest(async (req, res) => {
    const  result = await db.collection('challenges').get().then(snap => snap.docs.map(x => x.data()));
    res.status(200).send(result);
 });

 export const getChallange = functions.https.onRequest(async (req, res) => {
    const cid = req.query.cid;
    const  result = await db.collection('challenges').doc(cid).get().then(snap => snap.data());
    res.status(200).send(result);
 });