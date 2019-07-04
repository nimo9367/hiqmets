<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Skapa utmaning 
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
                <div class="column is-one-fifth is-pulled-right">
                    <div class="field">
                        <b-switch v-model="challenge.isPublic">
                            {{ challenge.isPublic ? "Synlig för alla" : "Ej synlig" }}
                        </b-switch>
                    </div>
                    <a class="button is-primary" @click="createChallange">Skapa utmaning</a>
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

@Component
export default class CreateChallenge extends Vue {
    challenge = new Challenge();

    async createChallange() {
        this.challenge.activities = this.selectedActivities;
        this.challenge.uid = userData.user.uid;
        console.log(this.challenge);
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
            console.log(e);
        }
    }

    availableActivities: any[] = [];

    get selectedActivities() {
        return this.availableActivities.filter(x => !x.deselected).map(x => x.id);
    }

    public async beforeMount() {
        const urls = await Axios.get(functionsBaseUrl + "getActivities");
         const acts = urls.data.map(a => {
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
}
</script>