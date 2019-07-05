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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { db, userData } from '../main';
import Axios from 'axios';
import { functionsBaseUrl } from '../globals';

@Component({props: ['disabled']})
export default class Activites extends Vue {
    public name = 'Activities';
    public userData = userData;
    
    @Watch('userData.challenge.id', { immediate: true })
    public loadActivities() {
        if(!userData.challenge.id)
            return;

        Axios.get(functionsBaseUrl + "activities/" + userData.challenge.id).then(response => {
            const acts = response.data;
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
