<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div v-if="challenge" class="container">
            <b-collapse :open="false">
              <a slot="trigger">
                <h1 class="title has-text-link">
                  <span class="has-text-link">{{ challenge.name }}</span>
                </h1>
              </a>
              <div class="">
                  <div class="spacer-bottom">
                    <article class="message ">
                      <div class="message-body"> 
                        {{ challenge.description }}
                      </div>
                    </article>
                  </div>
              </div>
          </b-collapse>
          <h2 class="subtitle">
            {{ challenge.countDownStr }}
          </h2>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="section">
        <div class="columns">
          <div class="column auto is-mobile">
            <nav class="level is-mobile">
              <p class="level-item has-text-centered">
                <a class="link is-info" v-bind:class="{'has-text-weight-bold has-text-primary': !runOnly && !cycleOnly && !miscOnly}" @click="filterActivities('')">Alla</a>
              </p>
              <p class="level-item has-text-centered">
                <a class="link is-info" v-bind:class="{'has-text-weight-bold has-text-primary': runOnly }" @click="filterActivities('run')">Löpning</a>
              </p>
              <p class="level-item has-text-centered">
                <span class="icon has-text-warning">
                  <i class="fas fa-star fa-2x"></i>
                </span>
              </p>
              <p class="level-item has-text-centered">
                <a class="link is-info" @click="filterActivities('cycle')" v-bind:class="{'has-text-weight-bold has-text-primary': cycleOnly }">Cykling</a>
              </p>
              <p class="level-item has-text-centered">
                <a class="link is-info" @click="filterActivities('misc')" v-bind:class="{'has-text-weight-bold has-text-primary': miscOnly }">Övriga</a>
              </p>
            </nav>
            <div class="tags ">
              <span v-for="act in filteredActivities" v-bind:key="act.id" class="tag is-light">
                {{act.text}}
              </span>
            </div>
            <div class="card">
              <div class="card-content">
                <div class="columns is-mobile">
                  <div  class="column">
                    <nav class="level">
                        <div  class="level-item" >
                          <b-field>
                            <b-radio-button v-model="chartType"
                                native-value="points" size="is-small">
                                <span>Poäng</span>
                            </b-radio-button>
                            <b-radio-button v-model="chartType"
                                native-value="kcal"
                                type="is-danger"  size="is-small">
                                <span>Kcal</span>
                            </b-radio-button>
                            <b-radio-button v-model="chartType"
                                native-value="minutes"
                                type="is-warning"  size="is-small">
                                <span>Minuter</span>
                            </b-radio-button>
                          </b-field>
                        </div>
                    </nav>
                  </div>
                </div>
                <div class="columns is-vcentered is-mobile" v-for="stats in userStats" v-bind:key="stats.uid">
                  <div class="column is-one-fifth has-text-right">
                    <a href="#"><router-link :to="{ name: 'ActivityList', params: {userId: stats.uid } }">
                      <div class="columns is-vcentered is-mobile">
                        <div class="column">
                          <h1 class="is-vcentered">{{stats.name}}</h1>
                        </div>
                        <div class="column is-narrow  is-hidden-mobile">
                          <figure class="image is-32x32" >
                            <img class="is-rounded" v-bind:src="userData.getAvatarUrl(stats)">
                          </figure>
                        </div>
                      </div>
                      </router-link>
                    </a>
                  </div>
                  <div class="column is-three-fifth">
                      <progress class="progress is-large" v-bind:class="[chartType == 'points' ? 'is-primary' : chartType == 'kcal' ? 'is-danger' : 'is-warning']" v-bind:value="((chartType == 'points' ? stats.totalPoints : chartType == 'kcal' ? stats.totalKcal : stats.totalTime) / max) * 100" max="100">100%</progress>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="dropdown is-hoverable">
                      <div class="dropdown-trigger">
                        <a aria-haspopup="true" aria-controls="dropdown-menu4">
                          <h1>{{ chartType == 'points' ? stats.totalPoints + ' Poäng' : chartType == 'kcal' ? stats.totalKcal + ' Kcal' : stats.totalTime + ' Minuter' }}</h1>
                        </a>
                      </div>
                      <div class="dropdown-menu" id="dropdown-menu4" role="menu">
                        <div class="dropdown-content">
                          <div class="dropdown-item">
                            <span v-if="stats.nextPositionText" v-html="stats.nextPositionText"></span>
                            <span v-else>Just nu är {{stats.name}} ledare</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <footer class="card-footer">
                <p class="card-footer-item">
                  <span>
                    Totalt  <b>{{total.minutes}} </b> Minuter
                  </span>
                </p>
                <p class="card-footer-item">
                  <span>
                    Totalt  <b>{{total.kcal}} </b> Kcal
                  </span>
                </p>
              </footer>
            </div>
            
            <div class="spacer-top columns">
              <div class="column">
              <article class="message is-info">
                <div class="message-body"> 
                  Poängen räknas ut genom aktiviteternas METs multiplicerat med antal minuter den givna aktiviteten är utförd. <a href="https://en.wikipedia.org/wiki/Metabolic_equivalent">METs</a> 
                  (metabolic equivalent of task) är ett objektivt ratio av den energi som en person gör av med relativt till personens massa. Som exempel motsvarar 1 kcal: <b>1 * METs * vikt(kg) * timmar</b>.
                  Genom att använda MET som en faktor för att räkna ut poängen kan vi således få ett något som är jämförbart oberoende av utförd aktivitet samt personens vikt.
                </div>
              </article>
              </div>
            </div>
          </div>
          
          <div class="column  is-one-quarter">
            <RegisterActivity></RegisterActivity>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import Activities from '@/components/Activities.vue'; // @ is an alias to /src
import RegisterActivity from '@/components/RegisterActivity.vue'; 
import firebase from 'firebase';
import { db, userData } from '../main';

Vue.component('RegisterActivity', RegisterActivity);

@Component
export default class Home extends Vue {
  data() {
    return {
      name: userData.user.name,
      challenge: userData.challenge,
      userData: userData
    };
  }

  get userStats() {
    return userData.statsData.userStats.filter((s:any) => s.totalPoints > 0);
  }

  get total() {
    if(userData.statsData.userStats.length < 2)
      return 1;
    var totMinutes = userData.statsData.userStats.map((x:any) => x.totalTime).reduce((a: any, b: any) => a + b);
    var totKcal = userData.statsData.userStats.map((x:any) => x.totalKcal).reduce((a: any, b: any) => a + b);
    return { kcal: totKcal, minutes: totMinutes };
  }
  get max() {
    if(userData.statsData.userStats.length < 2)
      return 1;
    const max = userData.statsData.userStats.map((x:any) => this.chartType == 'points' ? x.totalPoints : this.chartType == 'kcal' ? x.totalKcal : x.totalTime).reduce((a: any, b: any) => {
        return Math.max(a, b);
    });
    return max > 0 ? max : 1;
  }

  get filteredActivities() {
    return userData.activities.map(x => { return { text: x.text, id: x.id }})
      .filter(x => this.runOnly ? x.text.indexOf('Löpning') == 0 : (this.cycleOnly ? x.text.indexOf('Cykling') == 0 : (this.miscOnly ? x.text.indexOf('Löpning') == -1 && x.text.indexOf('Cykling') == -1 : false)));
  }

  runOnly = false;
  cycleOnly = false;
  miscOnly = false;
  chartType = 'points'

  filterActivities(filter: string) {
    if(filter == 'run') {
      this.runOnly = true;
      this.cycleOnly = false;
      this.miscOnly = false;
    }
    else if(filter == 'cycle') {
      this.runOnly = false;
      this.cycleOnly = true;
      this.miscOnly = false;
    }
    else if(filter == 'misc') {
      this.runOnly = false;
      this.cycleOnly = false;
      this.miscOnly = true;
    }
    else {
      this.runOnly = false;
      this.cycleOnly = false;
      this.miscOnly = false;
    }

  }

  @Watch('filteredActivities')
  filterPressed(value: any) {
    userData.loadStats({activities: value.map((x:any) => x.id)});
  }

  @Watch('userData.challenge')
  callangeChange() {
    userData.loadStats();
  }
}
</script>
