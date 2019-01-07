<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Tillgängliga utmaningar 
          </h1>
          <h2 class="subtitle">
            En lista med kommande, pågående och avslutade utmaningar
          </h2>
        </div>
      </div>
    </div>
    <div class="container">
        <section class="section">
            <div class="columns">
                <div v-for="c in challenges" v-bind:key="c.id" class="column is-one-third">
                    <div class="card">
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
                                Från: <b><time>{{ c.startdate | moment('LLL')  }}</time></b>
                                <br>
                                Till: <b><time>{{ c.enddate | moment('LLL')  }}</time></b>
                                <br>
                                Status: <b v-if="c.status() == 'ended'" class="has-text-danger">Avslutad</b> 
                                <b v-if="c.status() == 'started'" class="has-text-warning">Påbörjad</b> 
                                <b v-if="c.status() == 'notstarted'" class="has-text-success">Inte påbörjad</b> 
                            </div>
                        </div>
                        <footer class="card-footer">
                            <a href="#" class="card-footer-item">
                                <input type="radio"
                                        v-bind:id="c.id"
                                        name="challengeSelect"
                                        v-bind:value="c"
                                        v-model="challenge"
                                        v-on:change="changeChallenge"
                                        v-bind:checked="c.id ==  userData.user.default_challenge">
                                <label v-bind:for="c.id"> Välj</label>
                            </a>
                        </footer>
                    </div>
                </div>
            </div>
        </section>
    </div>
  </div>  
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { userData } from '../main';
import Challenge from '../entities/Challenge';

@Component
export default class Challenges extends Vue {
    data() {
        return {
            challenges: [],
            challenge: null,
            userData: userData
        };
    }

    changeChallenge() {
        userData.user.default_challenge = this.$data.challenge.id;
        userData.saveUser().then(() => userData.loadUser(userData.user));
    }

    beforeMount() {
        userData.loadChallenges().then((c:Challenge[]) => { 
            this.$data.challenges = c;
            this.$data.challenge = c.find((c:Challenge) => c.id == userData.user.default_challenge);
        });
    }
}
</script>