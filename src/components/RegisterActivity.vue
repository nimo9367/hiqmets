<template>
    <div>
        <div v-if="!quickAdd" class="card">
            <div class="card-image">
                <figure class="image is-4by3 is-hidden-mobile">
                    <img src="../assets/winter.jpg" alt="Placeholder image">
                </figure>
            </div>
            <div class="card-content">
                <div class="media">
                    <p class="title is-4">Registrera aktivitet</p>
                </div>
                <div class="content">
                    <span>
                    Lägg till aktivitet och tid spenderad. Du ges en poäng baserad på aktivitetens <a href="https://en.wikipedia.org/wiki/Metabolic_equivalent">METs</a>.
                    </span>
                </div>
                <div class="content">
                    <Activities v-bind:disabled="disabled"></Activities>
                    <div class="field">
                        <b-field>
                            <b-input v-bind:disabled="disabled" v-model="minutes"
                                placeholder="Minuter spenderade"
                                type="number"
                                icon="clock">
                            </b-input>
                        </b-field>
                    </div>
                    <b-field label="Tidpunkt">
                        <b-datepicker
                            v-bind:disabled="disabled" 
                            v-model="datetime"
                            placeholder="Click to select..."
                            icon="calendar">
                        </b-datepicker>
                    </b-field> 
                    <b-field>
                        <b-timepicker
                            v-bind:disabled="disabled" 
                            v-model="datetime"
                            placeholder="Type or select a date..."
                            icon="clock"
                            editable>
                        </b-timepicker>
                    </b-field>
                </div>
            </div>
            <footer v-if="!disabled" class="card-footer">
            <a @click="save" class="card-footer-item">Lägg till</a>
            </footer>
        </div>
        <div v-if="quickAdd" >
             <div class="modal-card" style="width:300px;">
                <section class="modal-card-body">
                    <Activities v-bind:disabled="disabled"></Activities>
                    <div class="field">
                        <b-field>
                            <b-input v-bind:disabled="disabled" v-model="minutes"
                                placeholder="Minuter spenderade"
                                type="number"
                                icon="clock">
                            </b-input>
                        </b-field>
                    </div>
                    
                    <a @click="save" class="button is-primary input">Lägg till</a>
                </section>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import firebase from 'firebase';
import { db, userData } from '../main';
import Activities from '@/components/Activities.vue';
import axios from 'axios';
import stravaImporter from '../modules/StravaImporter';
import Entry from '@/entities/Entry';

Vue.component('Activities', Activities);

@Component({props: ['disabled', 'quickAdd']})
export default class RegisterActivity extends Vue {
    name = 'RegisterActivity';
    minutes = null;
    components = {
        Activities,
    };

    endo = {
        userName: '',
        password: ''
    }

    data() {
        return {
            datetime: new Date(),
        };
    };

    get disableSave() {
        return this.minutes == null;
    }

    save() {
        if(this.disableSave)
            return;

        const ref = db.collection('entries').doc();
        const mins = this.minutes == null ? 0 : this.minutes;
        var setWithMerge = ref.set({
            mets: userData.selectedActivity.mets,
            minutes: this.minutes,
            kcal: (userData.selectedActivity.mets * (userData.user.weight ? userData.user.weight : 82) * (<number>mins  / 60)).toFixed(0),
            aid: userData.selectedActivity.id,
            cid: userData.challenge.id,
            uid: userData.user.uid,
            created: this.$data.datetime,
        }, { merge: true }).then(() => {
            this.$toast.open({
                message: this.minutes + ' minuter ' + userData.selectedActivity.text + ' tillagt',
                position: 'is-top',
                type: 'is-success'
            });
        }).catch(e => console.log(e));
        userData.user.favoriteActivity = userData.selectedActivity.id;
        userData.saveUser();
    }
    beforeMount() {
        const stravaCode = this.$route.query.code;
        if(!stravaCode)
            return;
        stravaImporter.doImport(<string>stravaCode).then(entries => {
            console.log(entries);
        }).catch(() => {
            this.$toast.open({
                message: 'Importen misslyckades :(',
                position: 'is-top',
                type: 'is-danger'
            });
        })
    }
    importData() {
        stravaImporter.authorize();
    }
}
</script>

<style scoped>
</style>
