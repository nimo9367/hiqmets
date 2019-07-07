<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Tillgängliga utmaningar 
          </h1>
          <h2 class="subtitle">
            En lista med kommande, pågående och avslutade utmaningar. Välj en i listan eller:
          </h2>
            <a href="#/createchallenge" class="button is-primary">Skapa ny utmaning!</a>
        </div>
      </div>
    </div>
    <div class="container">
        <section class="section">
            <div class="columns is-multiline">
                <div v-for="c in challenges" v-bind:key="c.id" class="column is-one-third">
                    <div class="card" v-bind:class="{'selected': c.id == userData.user.default_challenge}">
                        <header class="card-header">
                            <p class="card-header-title">
                            {{c.name}}
                            </p>
                            <a href="#" class="card-header-icon" aria-label="more options">
                            </a>
                        </header>
                        <div class="card-content">
                            <div class="content">
                                {{c.description}}
                                <br>
                                <br>
                                Skapad av: <b>{{ userData.getUserName(c.uid) }}</b>
                                <br>
                                Från: <b><time>{{ c.startdate | moment('LLL')  }}</time></b>
                                <br>
                                Till: <b><time>{{ c.enddate | moment('LLL')  }}</time></b>
                                <br>
                                Status: <b v-if="c.status() == 'ended'" class="has-text-danger">Avslutad</b> 
                                <b v-if="c.status() == 'started'" class="has-text-warning">Påbörjad</b> 
                                <b v-if="c.status() == 'notstarted'" class="has-text-success">Inte påbörjad</b> 
                                <br>
                                Inbjudan: https://outch.work?i={{ c.id }} &nbsp;
                                
                                <a href="#" @click="copy(c.id)">
                                    <i class="fas fa-copy fa-lg"></i>
                                </a>
                            </div>
                        </div>
                        <footer class="card-footer">
                            <a href="#" @click="changeChallenge(c.id)" class="card-footer-item">
                                <span lass="icon">
                                    <i class="fas fa-eye fa-lg"></i>
                                </span>
                                &nbsp;
                                Välj
                            </a>
                            <a hreaf="#" class="card-footer-item" @click="joinChallenge(c.id)">
                                <span v-if="isInChallenge(c.id)" class="icon">
                                    <i class="fas fa-check fa-lg"></i>
                                </span>
                                
                                <span v-if="!isInChallenge(c.id)" class="icon">
                                    <i class="fas fa-sign-in-alt fa-lg"></i>
                                </span>
                                &nbsp;
                                {{ isInChallenge(c.id) ? 'Deltar' : 'Delta' }} 
                            </a>
                            <router-link class="card-footer-item" v-if="c.uid === userData.user.uid" :to="{ name: 'CreateChallenge', params: { cid: c.id } }">
                                <span lass="icon">
                                    <i class="fas fa-pencil-alt fa-lg"></i>
                                </span>
                                &nbsp;
                                Ändra
                            </router-link>
                        </footer>
                    </div>
                </div>
            </div>
        </section>
    </div>
  </div>  
</template>

<style scoped>
.selected {
    border-color: #2cc26b;
}
</style>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { userData } from '../main';
import Challenge from '../entities/Challenge';

@Component
export default class Challenges extends Vue {
    public data() {
        return {
            challenges: [],
            userData
        };
    }

    public copy(cid: string) { 
        const fullLink = document.createElement('input');
        document.body.appendChild(fullLink);
        fullLink.value = window.location.origin + '/#/?i=' + cid;
        fullLink.select();
        document.execCommand("copy", false);
        fullLink.remove();
        this.$toast.open({
            message: 'Inbjudningslänk kopierad',
            type: 'is-success'
        });
    }

    public isInChallenge(cid: string) {
        if(!userData.user.challenges)
            return;
        return userData.user.challenges.find(x => x === cid);
    }

    public joinChallenge(cid: string) {
        if(!userData.user.challenges)
            userData.user.challenges = [];
        if(userData.user.challenges.find(x => x === cid))
            userData.user.challenges = userData.user.challenges.filter(x => x !== cid) ;
        else
            userData.user.challenges.push(cid);
        userData.saveUser().then(() => userData.loadUser(userData.user)); 
    }

    public changeChallenge(cid: string) {
        userData.user.default_challenge = cid;
        userData.saveUser().then(() => userData.loadUser(userData.user));
    }

    public beforeMount() {
        userData.loadChallenges().then((c: Challenge[]) => this.$data.challenges = c);
    }
}
</script>