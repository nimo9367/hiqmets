import * as admin from 'firebase-admin';
import * as _ from 'lodash';

admin.initializeApp();

export * from './challenges_api';
export * from './util_functions';