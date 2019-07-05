<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ externalCid ? "Ändra utmaning" : "Skapa utmaning" }}
          </h1>
          <h2 class="subtitle">
            Skapa en ny utmaning för dig och dina vänner
          </h2>
        </div>
      </div>
    </div>
    <div class="container">
        <section class="section">
            <div class="columns">
                <div class="column auto">
                    <b-field label="Namn">
                        <b-input v-model="challenge.name"></b-input>
                    </b-field>
                    <b-field label="Beskrivning">
                        <b-input v-model="challenge.description" maxlength="600" type="textarea"></b-input>
                    </b-field>
                </div>
                <div class="column auto">
                    <b-field label="Startdatum">
                        <b-datepicker 
                            v-model="challenge.startdate" 
                            inline 
                        >
                        </b-datepicker>
                    </b-field>
                </div>
                <div class="column auto">
                    <b-field label="Slutdatum">
                        <b-datepicker 
                            v-model="challenge.enddate" 
                            inline 
                        >
                        </b-datepicker>
                    </b-field>
                </div>
            </div>
            <div class="columns">
                <div class="column auto">
                    
                    <div v-for="act in availableActivities" v-bind:key="act.key"  style="display:inline-block">
                        <b-checkbox-button 
                            v-model="act.deselected"
                            type="is-success">
                            <span class="icon">
                                <i v-bind:class="act.fa" class="fa-lg"></i>
                            </span>
                            <span>{{ act.text }}</span>
                        </b-checkbox-button>
                    </div>
                </div>
            </div>
            <div class="columns">
                <div class="column auto">
                </div>
                <div class="column is-one-fifth">
                    <span class="field is-pulled-right">
                        <b-switch v-model="challenge.isPublic">
                            {{ challenge.isPublic ? "Synlig för alla" : "Ej synlig" }}
                        </b-switch>
                    </span>
                    <a class="button is-primary is-pulled-right" @click="saveChallange">{{ externalCid ? "Ändra utmaning" : "Skapa utmaning" }}</a>
                </div>
            </div>
        </section>
    </div>
  </div>  
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { userData, db } from '../main';
import Challenge from '../entities/Challenge';
import Axios from 'axios';
import { functionsBaseUrl } from '../globals';
import Challenges from './Challenges.vue';

@Component
export default class CreateChallenge extends Vue {
    externalCid: string = '';
    challenge: Challenge = new Challenge();

    async saveChallange() {
        this.challenge.activities = this.selectedActivities;
        this.challenge.uid = userData.user.uid;
        try {
            if(this.challenge.id) {
                await db.collection('challenges')
                    .doc(this.challenge.id)
                    .set(this.challenge.toPOCO());
            }
            else {
                await db.collection('challenges')
                    .doc()
                    .set(this.challenge.toPOCO());
            }
            this.$toast.open('Utmaning skapad');
        }
        catch(e) {
            this.$toast.open({ 
                message: 'Utmaning kunde inte skapas', 
                type: 'is-danger'
            });
        }
    }

    availableActivities: any[] = [];

    get selectedActivities() {
        return this.availableActivities.filter(x => !x.deselected).map(x => x.id);
    }

    private async getChallenge() {
        const available = await userData.loadChallenges();
        const c = available.find(x => x.id === this.externalCid);
        this.challenge = c ? c : new Challenge();
    }

    private async getActivities() {
        const urls = await Axios.get(functionsBaseUrl + "activities");
        const acts = urls.data.map(a => {
            if(this.challenge.activities)
                a.deselected = !this.challenge.activities.some(aid => aid === a.id );
            else
                a.deselected = true;
            return a;
        });
        acts.sort((a, b) => {
            const textA = a.text.toUpperCase();
            const textB = b.text.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        this.availableActivities = acts;
    }

    public async beforeMount() {
        this.externalCid = this.$route.params.cid;
        this.getChallenge().then(() => {
            this.getActivities();
        });
    }
}
</script>