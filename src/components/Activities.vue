<template>
    <div class="field">
        <div class="control has-icons-left">
            <b-select 
                v-model="userData.selectedActivity"
                v-bind:disabled="disabled"
                placeholder="Aktivitet"
                icon="futbol"
                expanded
                icon-pack="fas">
                <option v-for="act in userData.activities" v-bind:value="act" v-bind:key="act.text" >
                    {{ act.text }}
                </option>
            </b-select>
            <!-- <a class="butten" @click="populate()">Populate</a> -->
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import firebase from 'firebase';
import { db, userData } from '../main';

@Component({props: ['disabled']})
export default class Activites extends Vue {
    public name = 'Activities';
    public userData = userData;

    public populate() {
        const data = [{ mets: 7.0, text: 'Lätt jogging', strava_map: 'Run' },
{ mets: 11.5, text: 'Löpning 5.5 min/km', strava_map: 'Run' }, 
{ mets: 12.5, text: 'Löpning 5 min/km', strava_map: 'Run' }, 
{ mets: 13.5, text: 'Löpning 4.5 min/km', strava_map: 'Run' }, 
{ mets: 15.0, text: 'Löpning 4 min/km', strava_map: 'Run' }, 
{ mets: 6, text: 'Tyngdlyftning' },
{ mets: 9.5, text: 'CrossFit' }, 
{ mets: 6, text: 'Dans' }, 
{ mets: 8, text: 'Cykling', strava_map: 'Bicycle' }, 
{ mets: 7, text: 'Padel/Tennis' }, 
{ mets: 12, text: 'Squash' }, 
{ mets: 7, text: 'Badminton' }, 
{ mets: 3.8, text: 'Promenad rask takt' }, 
{ mets: 8, text: 'Längdskidor' }];
        data.forEach(d => {
            db.collection('activities').add(d);
        });
    }
    public beforeMount() {
        db.collection('activities').orderBy('text').onSnapshot(snapshot => {
            const acts: any[] = [];
            snapshot.forEach(doc => {
                const act =  doc.data();
                act.id = doc.id;
                acts.push(act);
            });
            userData.selectedActivity = acts.find((a) => a.id == userData.user.favoriteActivity);
            if(!userData.selectedActivity)
                userData.selectedActivity = acts.find((a) => a.text.indexOf('Löpning 5') == 0);
            userData.activities = acts;
        });
    }
}
</script>

<style scoped>
</style>
