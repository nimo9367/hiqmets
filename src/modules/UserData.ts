import { db, countdown } from '../main';
import User from './User';
import Challenge from '../entities/Challenge';

class UserData {
    public isLoggedIn: boolean = false;
    public isLoading: boolean = false;
    public user: User = new User();
    public runOnly = false;
    public cycleOnly = false;
    public miscOnly = false;

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

            if(snapshot.empty)
            {
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
                    this.loadStats();
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
            .where('cid', '==', cid)
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
                    const newEntry = {
                        id: e.id,
                        created: entry.created ? entry.created.seconds : '',
                        activity: act ? act.text : '',
                        minutes: entry.minutes,
                        kcal: entry.kcal,
                        points: entry.minutes * entry.mets,
                        import_id: entry.import_id,
                    };

                    if(entry.minutes)
                        self.entriesData.totalMinutes += parseInt(entry.minutes);
                    if(newEntry.kcal)
                        self.entriesData.totalKcal += parseInt(newEntry.kcal);
                    if(newEntry.points)
                        self.entriesData.totalPoints += parseInt(newEntry.points.toFixed(0));

                    stats.push(newEntry);
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

    public loadStats(options:any = {}) {
      const self: any = this;
      this.isLoading = true;
      db.collection('users').get().then(users => {
        let stats: any[] = [];
        users.docs.forEach(user => {
          const u = user.data();
          const cid = this.user.default_challenge;
          if(!cid || !u)
            return;
          return db.collection('entries')
            .where('uid', '==', u.uid)
            .where('cid', '==', cid)
            .orderBy("created", "desc")
            .where('created', '>=', this.challenge.startdate)
            .where('created', '<=', this.challenge.enddate)
            .onSnapshot((entries: any) => {
                const userObj = {
                    id: user.id,
                    uid: u.uid,
                    name: u.name,
                    totalTime: 0,
                    totalPoints: 0,
                    totalKcal: 0,
                    avatar: u.avatar,
                };
                stats = stats.filter(x => x.id !=  user.id);
                this.statsData.allEntries = this.statsData.allEntries.filter((x:any) => x.user.uid != u.uid);
                entries.docs.forEach((e: any) => {
                    const entry = e.data();
                    if(options && options.activities && options.activities.length && !options.activities.some((x: any) => x == entry.aid))
                        return;
                    if(entry.minutes)
                        userObj.totalTime += parseInt(entry.minutes);
                    
                    if(entry.minutes && entry.mets)
                        userObj.totalPoints += parseInt((entry.minutes * entry.mets).toFixed());
                    if(entry.kcal)
                        userObj.totalKcal += parseInt(entry.kcal);
                    const act = self.activities.find((x: any) => x.id == entry.aid);
                    if(act) {
                        this.statsData.allEntries.push({
                            eid: e.id,
                            minutes: entry.minutes,
                            name: userObj.name,
                            activity: act.text,
                            fa: act.fa,
                            created:  new Date(entry.created.seconds*1000),
                            user: {avatar: userObj.avatar, uid: userObj.uid, id: userObj.id},
                            likes: entry.likes,
                            comments: entry.comments
                        });
                    }
                });
                stats.push(userObj);
                stats.sort((a, b) => b.totalPoints - a.totalPoints );
                if(stats.length > 1) {
                    for(let i = 1; i < stats.length; i++) {
                        let prev = stats[i - 1];
                        let pointDiff = prev.totalPoints - stats[i].totalPoints;
                        let runMins = (pointDiff / 11.5).toFixed(0);
                        let bettanMins = (pointDiff / 9.5).toFixed(0);
                        let walkMins = (pointDiff / 3.8).toFixed(0);
                        stats[i].nextPositionText = '<b>' + runMins + '</b> minuter <b>löpning</b> 5.5 min/km, <b>' + bettanMins + '</b> minuter <b>bettanpass</b> eller <b>' + walkMins + '</b> minuter <b>promenad</b> i rask takt för att gå om <b>' + prev.name + '</b>';
                    }
                }
                this.statsData.userStats = stats;
                this.isLoading = false;
            });
        });
      });
    }

    public like(entry:any) {
        let likes = [];
        if(entry.likes) {
            const idx = entry.likes.indexOf(this.user.uid);
            console.log(idx);
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
        const u = this.statsData.userStats.find((x:any)=> x.uid == uid);
        if(u)
            return u.name;
        return 'Ny användare';

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
