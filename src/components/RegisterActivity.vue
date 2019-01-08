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
    importing = false;
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

        this.saveActivity(userData.selectedActivity.id, this.minutes, userData.selectedActivity.mets, userData.selectedActivity.text, '');
        userData.user.favoriteActivity = userData.selectedActivity.id;
        userData.saveUser();
    }
    saveActivity(activityId: string, minutes: string|null, mets: number, activityText: string, importId: string,) {
        const ref = db.collection('entries').doc();
        const mins = minutes == null ? 0 : minutes;
        var setWithMerge = ref.set({
            mets: mets,
            minutes: minutes,
            kcal: (mets * (userData.user.weight ? userData.user.weight : 75) * (<number>mins  / 60)).toFixed(0),
            aid: activityId,
            cid: userData.challenge.id,
            uid: userData.user.uid,
            created: this.$data.datetime ? this.$data.datetime : new Date(),
            import_id: importId,
        }, { merge: true }).then(() => {
            this.$toast.open({
                message: minutes + ' minuter ' + activityText + ' tillagt',
                position: 'is-top',
                type: 'is-success'
            });
        }).catch(e => console.log(e));
    }
    mounted() {
        const stravaCode = this.$route.query.code;
        if(!stravaCode)
            return;
        console.log('mounted')
        stravaImporter.doImport(<string>stravaCode).then(entries => {
            if(this.$props.quickAdd)
                return;
            
            this.$toast.open({
                message: 'Importerar...',
                position: 'is-top'
            });
            userData.loadChallenges().then(() => {
                
                userData.loadEntries(this.$route.params.userId);
                setTimeout(() => {
                    let numOfImports = 0;
                    entries.forEach((e:any) => {
                        console.log(e);
                        let date = new Date(e.start_date);
                        console.log(userData.challenge.startdate)
                        console.log(userData.challenge.enddate)
                        if(date > userData.challenge.startdate && date < userData.challenge.enddate) {
                            if(e.type == 'Run') {
                                let act =  null;
                                if(e.speed < 4.3) 
                                    act = userData.activities.find((a:any) => a.id == 'GoVsauDModSzhqsvlRt8');
                                else if(e.speed < 4.8)
                                    act = userData.activities.find((a:any) => a.id == 'orRILUtzEQripFpCBv2S');
                                else if(e.speed < 5.3)
                                    act = userData.activities.find((a:any) => a.id == 'Np0XNmsrpvQFFi0lJhXJ');
                                else if(e.speed < 5.8)
                                    act = userData.activities.find((a:any) => a.id == 'yRgnfVYGujFGVqGUntjQ');
                                else
                                    act = userData.activities.find((a:any) => a.id == 'Hm9afyKMaBLcHmNvlXC3');
                                console.log(userData)
                                if(act && !userData.entriesData.entries.find((entry:any) => entry.import_id == e.id)) {
                                    this.saveActivity(act.id, e.minutes.toFixed(0), act.mets, act.text, e.id);
                                    numOfImports++;
                                }
                            }
                        }
                    });
                    
            
                    this.$toast.open({
                        message: 'Importerade ' + numOfImports + ' aktivitet/er',
                        position: 'is-top'
                    });
                }, 2000)
            });
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
