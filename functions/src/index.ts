import * as admin from 'firebase-admin';
import * as functions from "firebase-functions";
import * as express from 'express';
import * as cors from 'cors';


// Initialize
admin.initializeApp();
const app = express();
app.use(cors({ origin: true }));

// Import apis
import Activities from './activities_api'
import { recalculate } from './util_functions';
export * from './util_functions';

// Setup api
app.get('/api/activities/', Activities.getActivities);
app.get('/api/activities/:cid', Activities.getActivitiesForChallenge);
app.get('/api/utils/recalculate/', async (req, res) => { 
    const result = await recalculate('zWSrTuLSbHdJSg3K8tnUZdELaV93');
    res.status(200).send(result);
});

export * from './challenges_api';
export * from './feed_api';
export * from './users_api';
export * from './toplist_api';
export * from './activities_api';
export const api = functions.https.onRequest(app);