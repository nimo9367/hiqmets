import * as functions from 'firebase-functions';
import { firestore } from "firebase-admin";
const db = firestore();

export const getChallanges =  functions.https.onRequest(async (req, res) => {
   const  result = await db.collection('challenges').get().then(snap => snap.docs.map(doc => { 
      const challange = doc.data();
      challange.id = doc.id;
      return challange;
   }));
   res.status(200).send(result);
 });

 export const getChallange = functions.https.onRequest(async (req, res) => {
    const cid = req.query.cid;
    const  result = await db.collection('challenges').doc(cid).get().then(snap => {
      const challange = snap.data();
      challange.id = snap.id;
      return challange;
    });
    res.status(200).send(result);
 });