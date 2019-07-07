import { db, countdown } from '../main';
import User from './User';
import Challenge from '../entities/Challenge';
import { event } from 'vue-analytics';
import Axios from 'axios';
import { functionsBaseUrl } from '../globals';
import { TwitterAuthProvider_Instance } from '@firebase/auth-types';
const _ = require('lodash');

class UserData {
    public isLoggedIn: boolean = false;
    public isLoading: boolean = false;
    public user: User = new User();
    public runOnly = false;
    public cycleOnly = false;
    public miscOnly = false;
    public chartType = 'points';
    public weeklyStats = <any>[];
    public showAllLapStats = false;
    public users = <any>[];

    // TODO: Move this to another shared module
    
    public activities:any[]= [];
    public selectedActivity = {
        mets: 0,
        id: '',
        text: '',
    };
    
    public challenge: Challenge = new Challenge();

    loadChallenges() {
        return db.collection('challenges').get().then((snapshot: any) => {
            const cs: Challenge[] = [];
            snapshot.docs.forEach((doc:any) => {
                const data = doc.data();
                let c = new Challenge();
                c.id = doc.id;
                c.name = data.name;
                c.description = data.description;
                c.startdate = new Date(data.startdate.seconds*1000);
                c.enddate = new Date(data.enddate.seconds*1000);
                c.uid = data.uid;
                c.activities = data.activities;
                cs.push(c);
            });
            return cs;
        });
    }

    public createUser(user: any)
    {
        return db.collection('users').add(user);
    }

    filterActivities(filter: string) {
        if(filter == 'run') {
            this.runOnly = true;
            this.cycleOnly = false;
            this.miscOnly = false;
        }
        else if(filter == 'cycle') {
            this.runOnly = false;
            this.cycleOnly = true;
            this.miscOnly = false;
        }
        else if(filter == 'misc') {
            this.runOnly = false;
            this.cycleOnly = false;
            this.miscOnly = true;
        }
        else {
            this.runOnly = false;
            this.cycleOnly = false;
            this.miscOnly = false;
        }
    }
    
    public getAvatarUrl(u: User) {
        return u.avatar ? u.avatar : 'https://api.adorable.io/avatars/100/' + u.uid + '.png';
    }

    public loadUser(user: any) {
        this.isLoading = true;
        var uid = user.uid;
        db.collection('users').where('uid', '==', uid).get().then(snapshot => {

            event('user', 'loadUser', 'loading', uid);
            if(snapshot.empty)
            {
                event('user', 'loadUser', 'createUser', uid);
                // Authenticated but no user. Probably SSO with google or FB
                if(user.providerData && user.providerData.length)
                {
                    const newUser = {
                        uid: uid,
                        name: user.providerData[0].displayName,
                        email: user.providerData[0].email
                    };
                    this.createUser(newUser).then(() => this.loadUser(user));
                }
                
                return;
            }
            snapshot.forEach(x =>  {
                this.user = x.data() as User;
                this.user.id = x.id;
            });
            
            if(!this.user.default_challenge){
                this.isLoading = false;
                db.collection('challenges').orderBy('created').get().then(snapshot => {
                    if(!snapshot.size)
                        return;
                    this.user.default_challenge = snapshot.docs[0].id;
                    console.log("Default challenge missing. Setting default to: " + snapshot.docs[0].id);
                    this.saveUser().then(() => this.loadUser(user));
                    return;
                });
            }
            else {
                db.collection('challenges').doc(this.user.default_challenge).get().then((doc: any) => {
                    const data = doc.data();
                    this.challenge.id = doc.id;
                    this.challenge.name = data.name;
                    this.challenge.description = data.description;
                    this.isLoading = false;
                    this.challenge.startdate = new Date(data.startdate.seconds*1000);
                    this.challenge.enddate = new Date(data.enddate.seconds*1000);
                    this.challenge.countDown();
                    this.loadUsers(this.user.default_challenge).then(async () => {
                        const actReq = await Axios.get(functionsBaseUrl + "activities/" + this.user.default_challenge);
                        this.activities = actReq.data;
                        this.loadLatestEntries();
                        this.loadStats();
                        this.loadWeeklyStats();
                    });
                });
            }
        });
    }
    public entriesData = {
        totalMinutes: 0,
        totalKcal: 0,
        totalPoints: 0,
        loadedUsersName: '',
        entries: <any>[],
        uid: '',
        avatar: ''
    }
    public loadEntries(userId:string) {
        this.isLoading = true;
        const self = this;
        self.entriesData.entries = [];
        db.collection('users').doc(userId).get().then(user => {
            const cid = self.user.default_challenge;
            const u = user.data();
            if(!cid || !u)
             return;
            if(u) {
                self.entriesData.loadedUsersName = u.name;
                self.entriesData.uid = u.uid;
                self.entriesData.avatar = u.avatar;
            }
            return db.collection('entries')
            .where('uid', '==', u.uid)
            .orderBy("created", "desc")
            .where('created', '>=', self.challenge.startdate)
            .where('created', '<=', self.challenge.enddate)
            .limit(100)
            .onSnapshot((entries: any) => {
                self.entriesData.totalMinutes = 0;
                self.entriesData.totalKcal = 0;
                self.entriesData.totalPoints = 0;
                const stats: any[] = [];
                entries.docs.forEach((e: any) => {
                    const entry = e.data();
                    const act = self.activities.find((a:any) => a.id == entry.aid);
                    if(act) {
                        const newEntry = {
                            id: e.id,
                            eid: e.id,
                            uid:  u.uid,
                            created: entry.created ? entry.created.seconds : '',
                            activity: act.text,
                            minutes: entry.minutes,
                            kcal: entry.kcal,
                            points: entry.minutes * entry.mets,
                            import_id: entry.import_id,
                            likes: entry.likes,
                            comments: entry.comments,
                            fa: act.fa
                        };

                        if(entry.minutes)
                            self.entriesData.totalMinutes += parseInt(entry.minutes);
                        if(newEntry.kcal)
                            self.entriesData.totalKcal += parseInt(newEntry.kcal);
                        if(newEntry.points)
                            self.entriesData.totalPoints += parseInt(newEntry.points.toFixed(0));

                        stats.push(newEntry);
                    }
                });
                self.entriesData.entries = stats;
                self.isLoading = false;
            });
        });
    }

    public statsData = {
        userStats: <any>[],
        allEntries: <any>[],
    }

    public async loadLatestEntries(options:any = {}) {
        const cid = this.user.default_challenge;
        return db.collection('entries')
            .orderBy("created", "desc")
            .where('created', '>=', this.challenge.startdate)
            .where('created', '<=', this.challenge.enddate)
            .limit(100)
            .onSnapshot((entries: any) => {
                let allEntries = <any>[];
                entries.docs.forEach((e: any) => {
                    const entry = e.data();
                    if(options && options.activities && options.activities.length && !options.activities.some((x: any) => x == entry.aid))
                        return;
                    const act = this.activities.find((x: any) => x.id == entry.aid);
                    if(act) {
                        const user = this.getUser(entry.uid);
                        if(user) {
                            allEntries.push({
                                eid: e.id,
                                uid: this.user.uid,
                                minutes: entry.minutes,
                                name: user.name,
                                activity: act.text,
                                fa: act.fa,
                                created:  new Date(entry.created.seconds * 1000),
                                user: { avatar: user.avatar, uid: user.uid, id: user.id },
                                points: entry.minutes * entry.mets,
                                likes: entry.likes,
                                comments: entry.comments
                            });
                        }
                    }
                });
                this.statsData.allEntries = allEntries;
                this.isLoading = false;
            });
    }
    
    public loadUsers(cid: string) {
        return db.collection('users')
            .where('challenges', 'array-contains', cid)
            .get().then(data => { 
                const users = <any>[];
                data.forEach((doc: any) => {
                    users.push(doc.data());
                });
                this.users = users;
            });
    }

    public loadStats(options:any = {}) {
        this.isLoading = true;
        let allStats: any[] = [];
        const cid = this.user.default_challenge;
        return db.collection('user_stats')
            .where('cid', '==', cid)
            .onSnapshot((snap: any) => {
                snap.forEach((s:any) => {
                    const stats = s.data();
                    const user = this.getUser(stats.uid);
                    if(user && stats.cid === cid) {
                        allStats = allStats.filter((old) => old.uid != user.uid);
                        const statsObj = {
                            id: user.id,
                            uid: user.uid,
                            name: user.name,
                            totalTime: stats.totalMinutes,
                            totalPoints: stats.totalPoints,
                            totalKcal: stats.totalKcal,
                            avatar: user.avatar,
                            cid: stats.cid
                        };
                        allStats.push(statsObj);
                    }
                });
                allStats.sort((a, b) => b.totalPoints - a.totalPoints );
                if(allStats.length > 1) {
                    for(let i = 1; i < allStats.length; i++) {
                        let prev = allStats[i - 1];
                        let pointDiff = prev.totalPoints - allStats[i].totalPoints;
                        let runMins = (pointDiff / 11.5).toFixed(0);
                        let bettanMins = (pointDiff / 9.5).toFixed(0);
                        let walkMins = (pointDiff / 3.8).toFixed(0);
                        allStats[i].nextPositionText = '<b>' + runMins + '</b> minuter <b>löpning</b> 5.5 min/km, <b>' + bettanMins + '</b> minuter <b>bettanpass</b> eller <b>' + walkMins + '</b> minuter <b>promenad</b> i rask takt för att gå om <b>' + prev.name + '</b>';
                    }
                }
                this.statsData.userStats = allStats;
                this.isLoading = false;
            });
    }

    public loadWeeklyStats() {
        const cid = this.user.default_challenge;
        db.collection('stats')
            .where('cid', '==', cid)
            .get().then(stats => {
            let data = _.groupBy(stats.docs.map((s: any) => s.data()), 'week');
            this.weeklyStats = [];
            let icon1 = '<span class="icon has-text-warning"><i class="fas fa-trophy"></i></span>';
            let icon2 = '<span class="icon has-text-grey-light"><i class="fas fa-medal"></i></span>';
            let icon3 = '<span class="icon has-text-bronze"><i class="fas fa-medal"></i></span>';
            let numOfWeeks = Object.keys(data).length;
            for(let week in data)
            {
                if(data.hasOwnProperty(week))
                {
                    const isLastWeek = numOfWeeks === parseInt(week) || this.showAllLapStats;
                    let winner = _.sortBy(data[week].filter((s: any) => s.type == 'winner'), 'place');
                    let winnerkcal = _.sortBy(data[week].filter((s: any) => s.type == 'winnerkcal'), 'place');
                    let winnerlongestact = _.sortBy(data[week].filter((s: any) => s.type == 'winnerlongestact'), 'place');
                    let winnerminutes = _.sortBy(data[week].filter((s: any) => s.type == 'winnerminutes'), 'place');
                    let winnernumberofacts = _.sortBy(data[week].filter((s: any) => s.type == 'winnernumberofacts'), 'place');
                    let winnervariation = _.sortBy(data[week].filter((s: any) => s.type == 'winnervariation'), 'place');
                    if(!winner.length || !winner[0] || !this.getUserName(winner[0].uid))
                        return;

                    let row = {
                        week: '<h2 class="subtitle">' + (isLastWeek ? '<b>' + week + '</b>' : week) + '</h2>',
                        w: '<ul><li>' + icon1 + '<b>' + this.getUserName(winner[0].uid) + ' (' + winner[0].value + ' poäng)</b></li>' +
                        (isLastWeek && winner.length > 2 ? 
                            '<li class="has-text-grey">' + icon2 + '' + this.getUserName(winner[1].uid) + ' (' + winner[1].value + ' poäng)</li>' +
                            '<li class="has-text-grey">' + icon3 + '' + this.getUserName(winner[2].uid) + ' (' + winner[2].value + ' poäng)</li>' : '' + '</ul>'),
                        
                        wkcal: '<ul><li>' + icon1 + '<b>' + this.getUserName(winnerkcal[0].uid) + ' (' + winnerkcal[0].value + ' kcal)</b></li>' +
                        (isLastWeek && winner.length > 2 ? 
                            '<li class="has-text-grey">' + icon2 + '' + this.getUserName(winnerkcal[1].uid) + ' (' + winnerkcal[1].value + ' kcal)</li>' +
                            '<li class="has-text-grey">' + icon3 + '' + this.getUserName(winnerkcal[2].uid) + ' (' + winnerkcal[2].value + ' kcal)</li>' : '' + '</ul>'),
                        
                        wminutes: '<ul><li>' + icon1 + '<b>' + this.getUserName(winnerminutes[0].uid) + ' (' + winnerminutes[0].value + ' min)</b></li>' +
                        (isLastWeek && winner.length > 2 ? 
                            '<li class="has-text-grey">' + icon2 + '' + this.getUserName(winnerminutes[1].uid) + ' (' + winnerminutes[1].value + ' min)</li>' +
                            '<li class="has-text-grey">' + icon3 + '' + this.getUserName(winnerminutes[2].uid) + ' (' + winnerminutes[2].value + ' min)</li>' : '' + '</ul>'),
                        
                        wnumberofacts: '<ul><li>' + icon1 + '<b>' + this.getUserName(winnernumberofacts[0].uid) + ' (' + winnernumberofacts[0].value + ' st)</b></li>' +
                        (isLastWeek && winner.length > 2 ? 
                            '<li class="has-text-grey">' + icon2 + '' + this.getUserName(winnernumberofacts[1].uid) + ' (' + winnernumberofacts[1].value + ' st)</li>' +
                            '<li class="has-text-grey">' + icon3 + '' + this.getUserName(winnernumberofacts[2].uid) + ' (' + winnernumberofacts[2].value + ' st)</li>' : '' + '</ul>'),
                        
                        winnervariation: '<ul><li>' + icon1 + '<b>' + this.getUserName(winnervariation[0].uid) + ' (' + winnervariation[0].value + ' st)</b></li>' +
                        (isLastWeek && winner.length > 2 ? 
                            '<li class="has-text-grey">' + icon2 + '' + this.getUserName(winnervariation[1].uid) + ' (' + winnervariation[1].value + ' st)</li>' +
                            '<li class="has-text-grey">' + icon3 + '' + this.getUserName(winnervariation[2].uid) + ' (' + winnervariation[2].value + ' st)</li>' : '' + '</ul>')
                    }
                    this.weeklyStats.unshift(row);
                }
            }
        });
    }
    
    public like(entry:any) {
        let likes = <string[]>[];
        if(entry.likes) {
            const idx = entry.likes.indexOf(this.user.uid);
            if(idx >= 0) {
                likes = entry.likes.filter((x:string) => x != this.user.uid);
            }
            else {
                likes = [this.user.uid].concat(entry.likes);
            }
        }
        else
            likes = [this.user.uid];
        db.collection('entries').doc(entry.eid).update({ likes });
    }

    public getUserName(uid: string) {
        const u = this.users.find((x:any)=> x.uid == uid);
        if(u)
            return u.name;
        return 'Ny användare';

    }

    public getUser(uid: string) {
        const u = this.users.find((x:any)=> x.uid == uid);
        return u;
    }

    public userHasLiked(uids: any[]) {
        if(uids)
            return uids.some((x:any) => x === this.user.uid);
        return false;
    }

    public saveComment(comment: string, entry: any) {
        if(!entry.comments)
            entry.comments = [];
        entry.comments.push({uid: this.user.uid, comment, created: new Date() });
        db.collection('entries').doc(entry.eid).update({ comments: entry.comments });
    }

    public saveUser() {
        if(this.user.weight === undefined)
            this.user.weight = 0;
        return db.collection('users').doc(this.user.id).set(this.user);
    }

}

export default UserData;
