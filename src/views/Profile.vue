<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Din profil
          </h1>
          <h2 class="subtitle">
            Ändra dina uppgifter
          </h2>
        </div>
      </div>
    </div>
    <div>
      <div class="container section">
        <form>
            <div class="columns">
                <div class="column is-4">
                    <div class="columns">
                        <div class="column is-one-third">
                          <figure class="image is-128x128" >
                            <img class="is-rounded" v-bind:src="userData.getAvatarUrl(userData.user)">
                          </figure>
                        </div>
                        <div class="column auto">
                            <b-field label="Namn">
                                <b-input v-model="userData.user.name"></b-input>
                            </b-field>
                            <label class="label">Avatar (ratio 1:1 max 1MB)</label>
                            <FileUploader v-bind:imgName="'profile_pics/' + userData.user.uid" v-on:url="setImgUrl"></FileUploader>
                        </div>
                    </div>
                    <div class="content">
                        <p>Nedan följer information vilken endast används för att ge en bättre beräknad kaloriförbrukning. Bryr du dig inte om det kan du skita i det.</p>
                    </div>
                    <b-field
                        label="Kön">
                        <b-select v-model="userData.user.sex" placeholder="Välj" expanded>
                            <option value="rest">Övriga</option>
                            <option value="man">Man</option>
                            <option value="woman">Kvinna</option>
                        </b-select>
                    </b-field>
                    <b-field label="Vikt (kg)">
                        <b-input v-model="userData.user.weight"
                            type="number"
                            min="30"
                            max="250"></b-input>
                    </b-field>
                    <a class="button" @click="saveUser()">Spara</a>
                </div>
            </div>
        </form>
        <button class="button" @click="generateStats">
            Generera veckostatistik
        </button>
      </div>
    </div>
  </div>  
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { userData, db } from '../main';
import FileUploader from '@/components/FileUploader.vue';
import moment from 'moment';
const _ = require('lodash');

Vue.component('FileUploader', FileUploader);

@Component
export default class Profile extends Vue {
    public data() {
        return { userData };
    }
    public saveUser() {
        userData.saveUser().then(() => {
            this.$toast.open('Profil sparad');
        });
    }
    public setImgUrl(imgUrl: string) {
        userData.user.avatar = imgUrl;
        this.saveUser();
    }

    public generateStats() {
        const week = 1
        var startdate = moment(userData.challenge.startdate).add(7 * (week - 1), 'd').toDate();
        var enddate = moment(userData.challenge.startdate).add(7 * week, 'd').toDate();
        db.collection('entries')
            .where('cid', '==', userData.challenge.id)
            .where('created', '>=', startdate)
            .where('created', '<=', enddate)
            .orderBy("created", "desc").get().then((entries) => {
                let userGroups = _.values(_.groupBy(entries.docs.map(x => x.data()), 'uid'));
                const stats = <any>[];
                userGroups.forEach((group: any) => {
                    const userStats = <any>{};
                    userStats.uid = group[0].uid;
                    userStats.points = _.sumBy(group, (e: any) => e.mets * e.minutes);
                    userStats.kcal =  _.sumBy(group, (e: any) => parseFloat(e.kcal));
                    userStats.minutes =  _.sumBy(group, (e: any) => parseFloat(e.minutes));
                    userStats.variation =  _.values(_.groupBy(group, 'aid')).length;
                    userStats.numberOfActs =  group.length;
                    userStats.longestAct = _.maxBy(group, (a: any) => parseFloat(a.minutes));
                    stats.push(userStats);
                });

                let winner = _.take(_.orderBy(stats, 'points', 'desc'), 3);
                let winnerKcal = _.take(_.orderBy(stats, 'kcal', 'desc'), 3);
                let winnerMinutes = _.take(_.orderBy(stats, 'minutes', 'desc'), 3);
                let winnerVariation = _.take(_.orderBy(stats, 'variation', 'desc'), 3);
                let winnerNumberOfActs = _.take(_.orderBy(stats, 'numberOfActs', 'desc'), 3);
                let winnerLongestAct = _.take(_.orderBy(stats,  (s:any) => parseFloat(s.longestAct.minutes), 'desc'), 3);


                const completeStats = <any>[];
                let placement = 1;
                winner.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winner',
                        value: w.points,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerKcal.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnerkcal',
                        value: w.kcal,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerMinutes.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnerminutes',
                        value: w.minutes,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerVariation.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnervariation',
                        value: w.variation,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;

                winnerNumberOfActs.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnernumberofacts',
                        value: w.numberOfActs,
                        week: week,
                        uid: w.uid
                    });
                    placement++;
                });
                placement = 1;
                
                winnerLongestAct.forEach((w: any) => {
                    completeStats.push({
                        place: placement,
                        type: 'winnerlongestact',
                        value: parseFloat(w.longestAct.minutes),
                        week: week,
                        uid: w.uid,
                        metadata: w.longestAct.aid
                    });
                    placement++;
                });
                placement = 1;

                completeStats.forEach((d: any) => {
                    db.collection('stats').add(d);
                });
                // Vinnare v.X
                // Flest kcal
                // Flest minuter
                // Störst variation
                // Flest reggade aktiviteter 
                // Längsta pass

                // Populäraste aktivitet
                // Aktivitet med mest poäng
                // Aktivitet med mest tid
                // Aktivitet med högst förbränning
                
            });
    }
}
</script>