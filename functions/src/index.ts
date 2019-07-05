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

// Setup api
app.get('/api/activities/', Activities.getActivities);
app.get('/api/activities/:cid', Activities.getActivitiesForChallenge);

export * from './challenges_api';
export * from './feed_api';
export * from './users_api';
export * from './toplist_api';
export * from './activities_api';
export * from './util_functions';
export const api = functions.https.onRequest(app);