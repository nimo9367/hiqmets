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
      </div>
    </div>
  </div>  
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { userData, db } from '../main';
import FileUploader from '@/components/FileUploader.vue';
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
}
</script>