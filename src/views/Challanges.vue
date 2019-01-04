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
                <div v-for="c in challanges" v-bind:key="c.id" class="column is-one-third">
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
                                Status: <b v-if="c.status() == 'ended'" class="has-text-danger">Avslutad</b> <b v-if="c.status() == 'started'" class="has-text-warning">Påbörjad</b> <b v-if="c.status() == 'notstarted'" class="has-text-success">Inte påbörjad</b> 
                            </div>
                        </div>
                        <footer class="card-footer">
                            <a href="#" class="card-footer-item">
                                <input type="radio"
                                        v-bind:id="c.id"
                                        name="challangeSelect"
                                        v-bind:value="c"
                                        v-model="challange"
                                        v-on:change="changeChallange"
                                        v-bind:checked="c.id ==  userData.user.default_challange">
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
import Challange from '../entities/Challange';

@Component
export default class Challanges extends Vue {
    data() {
        return {
            challanges: [],
            challange: null,
            userData: userData
        };
    }

    changeChallange() {
        userData.user.default_challange = this.$data.challange.id;
        userData.saveUser().then(() => userData.loadUser( userData.user.id));
    }

    beforeMount() {
        userData.loadChallanges().then((c:Challange[]) => { 
            this.$data.challanges = c;
            this.$data.challange = c.find((c:Challange) => c.id == userData.user.default_challange);
        });
    }
}
</script>