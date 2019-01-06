import { db, countdown } from '../main';
import User from './User';
import Challenge from '../entities/Challenge';

class UserData {
    public isLoggedIn: boolean = false;
    public isLoading: boolean = false;
    public user: User = new User();

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
        entries: <any>[]
    }
    public loadEntries(userId:string) {
        this.isLoading = true;
        const self = this;
        self.entriesData.entries = [];
        db.collection('users').doc(userId).get().then(user => {
            const cid = this.user.default_challenge;
            const u = user.data();
            if(!cid || !u)
             return;
            if(u)
                this.entriesData.loadedUsersName = u.name;
            return db.collection('entries')
            .where('uid', '==', u.uid)
            .where('cid', '==', cid)
            .orderBy("created", "desc")
            .where('created', '>=', this.challenge.startdate)
            .where('created', '<=', this.challenge.enddate)
            .limit(100)
            .onSnapshot((entries: any) => {
                this.entriesData.totalMinutes = 0;
                this.entriesData.totalKcal = 0;
                this.entriesData.totalPoints = 0;
                const stats: any[] = [];
                entries.docs.forEach((e: any) => {
                const entry = e.data();
                const act = this.activities.find((a:any) => a.id == entry.aid);
                const newEntry = {
                    id: e.id,
                    created: entry.created ? entry.created.seconds : '',
                    activity: act ? act.text : '',
                    minutes: entry.minutes,
                    kcal: entry.kcal,
                    points: entry.minutes * entry.mets,
                };

                if(entry.minutes)
                    this.entriesData.totalMinutes += parseInt(entry.minutes);
                if(newEntry.kcal)
                    this.entriesData.totalKcal += parseInt(newEntry.kcal);
                if(newEntry.points)
                    this.entriesData.totalPoints += parseInt(newEntry.points.toFixed(0));

                stats.push(newEntry);
                });
                self.entriesData.entries = stats;
                this.isLoading = false;
            });
        });
    }

    public statsData = {
        userStats: <any>[]
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
                  uid: user.id,
                  name: u.name,
                  totalTime: 0,
                  totalPoints: 0,
                  totalKcal: 0
                };
                stats = stats.filter(x => x.uid !=  user.id);
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
                });
                stats.push(userObj);
                stats.sort((a, b) => b.totalPoints - a.totalPoints );
                this.statsData.userStats = stats;
                this.isLoading = false;
            });
        });
      });
    }

    public saveUser() {
        return db.collection('users').doc(this.user.id).set(this.user);
    }

}

export default UserData;
