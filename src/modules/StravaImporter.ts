import axios from 'axios';
import { userData } from '../main';
import Entry from '@/entities/Entry';

class StravaImporter {

    
    private static callback = window.location.origin +'/%23/activity_list/';
    private static clientId = '31123';
    private static clientSecret = '6401b0528ab1fe5c6d94b621555220b29973da7f';

    public static authorize() {
        const userId =  userData.user.id;
        window.location.href = 'https://www.strava.com/oauth/authorize?client_id=' + StravaImporter.clientId + '&redirect_uri=' + StravaImporter.callback + userId + '&response_type=code&scope=activity%3Aread_all';
    }
    public static doImport(code: string) {
       return axios.post('https://www.strava.com/oauth/token', {
           client_id: StravaImporter.clientId,
           client_secret: StravaImporter.clientSecret,
           code: code
       }).then((response:any) => { 
            const type = response.data.token_type;
            const token = response.data.access_token;
            let d = new Date();
            d.setDate(d.getDate() + 1)
            const before = (d.getTime() / 1000);
            const after = new Date(2018, 1, 1).getTime() / 1000
            return axios.get('https://www.strava.com/api/v3/athlete/activities?before=' + before + '&after=' + after + '&page=1&per_page=100', { headers: { Authorization: type + ' ' + token } }).then((response) => {
                const data = response.data;
                var entries = data.map((act:any) => {
                    return { id: act.id, type: act.type, start_date: act.start_date_local, speed: (act.elapsed_time/60)/(act.distance/1000), minutes: act.elapsed_time/60};
                });

                return entries;
            })
        });
    }
}

export default StravaImporter;