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
          <div class="column auto">
            <h1 class="title">Spurtvinnare</h1>
            <b-table :data="userData.weeklyStats" :columns="columns"></b-table>
          </div>
        </div>
        <div class="columns">
          <div class="column auto">
            <h1 class="title">Total ställning</h1>
          </div>
        </div>
        <div class="columns">
          <div class="column auto is-mobile">
            <nav class="level is-mobile">
              <p class="level-item has-text-centered">
                <a class="link is-info" v-bind:class="{'has-text-weight-bold has-text-primary': !userData.runOnly && !userData.cycleOnly && !userData.miscOnly }" @click="userData.filterActivities('')">
                  <span class="icon  is-small">
                  <i class="fas fa-check" v-if="!userData.runOnly && !userData.cycleOnly && !userData.miscOnly"></i>
                  </span>
                  Alla
                </a>
              </p>
              <p class="level-item has-text-centered">
                <a class="link is-info" v-bind:class="{'has-text-weight-bold has-text-primary': userData.runOnly }" @click="userData.filterActivities('run')">
                  <span class="icon  is-small">
                    <i class="fas fa-check" v-if="userData.runOnly"></i>
                  </span>
                  Löpning
                  </a>
              </p>
              <p class="level-item has-text-centered">
                <span class="icon has-text-warning">
                  <i class="fas fa-star fa-2x"></i>
                </span>
              </p>
              <p class="level-item has-text-centered">
                <a class="link is-info" @click="userData.filterActivities('cycle')" v-bind:class="{'has-text-weight-bold has-text-primary': userData.cycleOnly }">
                  <span class="icon  is-small">
                    <i class="fas fa-check" v-if="userData.cycleOnly"></i>
                  </span>
                  Cykling</a>
              </p>
              <p class="level-item has-text-centered">
                <a class="link is-info" @click="userData.filterActivities('misc')" v-bind:class="{'has-text-weight-bold has-text-primary': userData.miscOnly }">
                  <span class="icon  is-small">
                    <i class="fas fa-check" v-if="userData.miscOnly"></i>
                  </span>
                  Övriga</a>
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
                <div class="columns is-2 is-variable is-vcentered is-mobile" v-for="stats in userStats" v-bind:key="stats.uid">
                  <div class="column is-one-fifth has-text-right">
                    <a href="#"><router-link :to="{ name: 'ActivityList', params: {userId: stats.id } }">
                      <div class="columns is-vcentered is-mobile">
                        <div class="column">
                          <h1 class="is-vcentered">{{stats.name}}</h1>
                        </div>
                        <div class="column is-narrow is-hidden-mobile">
                          <figure class="image is-32x32" >
                            <img class="is-rounded" v-bind:src="userData.getAvatarUrl(stats)">
                          </figure>
                        </div>
                      </div>
                      </router-link>
                    </a>
                  </div>
                  <div class="column auto">
                      <progress class="progress is-large" v-bind:class="[chartType == 'points' ? 'is-primary' : chartType == 'kcal' ? 'is-danger' : 'is-warning']" v-bind:value="((chartType == 'points' ? stats.totalPoints : chartType == 'kcal' ? stats.totalKcal : stats.totalTime) / max) * 100" max="100">100%</progress>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="dropdown is-hoverable">
                      <div class="dropdown-trigger">
                        <a aria-haspopup="true" aria-controls="dropdown-menu4">
                          <h1><span v-kify="chartType == 'points' ? stats.totalPoints : chartType == 'kcal' ? stats.totalKcal : stats.totalTime" ></span>{{ chartType == 'points' ? ' Poäng' : chartType == 'kcal' ? ' Kcal' : ' Minuter' }}</h1>
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
                    Totalt  <b>{{ total.minutes * 1000 * 60 | duration('as', 'hours').toFixed(1) }} </b> timmar
                  </span>
                </p>
                <p class="card-footer-item">
                  <span>
                    Totalt  <b>{{total.kcal}} </b> kcal
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
          
          <div class="column is-one-third">
            <h2 class="content is-medium"><span>Senaste aktiviteter</span>
              <span class="is-pulled-right">
                <b-pagination
                    :total="userData.statsData.allEntries.length"
                    :current.sync="current"
                    :size="'is-small'"
                    :rounded="false"
                    :simple="true"
                    :per-page="20">
                </b-pagination>
              </span>
            </h2>
            <div v-for="entry in latestEntries" v-bind:key="entry.id" class="columns is-vcentered has-background-light is-mobile" style="border-radius: 0.4em; margin: 0.4em 0">
              <div class="media-left column is-1 has-background-light">
                  <figure class="image is-32x32" >
                    <img class="is-rounded" v-bind:src="userData.getAvatarUrl(entry.user)">
                  </figure>
              </div>
              <div class="media-content column auto">
                <p><router-link :to="{ name: 'ActivityList', params: {userId: entry.user.id } }">{{ entry.name }}</router-link>
                <span class="has-text-grey is-6 is-pulled-right"> {{ entry.created | moment("calendar")}}</span></p>
                <p class="is-6">
                  <span class="icon has-text-grey-dark">
                    <i v-bind:class="entry.fa"></i>
                  </span>
                 {{ minuteHour(entry) }} {{ minuteHourTitle(entry) }} {{ entry.activity }} 
                </p>
                <p class="subtitle is-7" style="margin: 0">
                  <a @click="comment(entry)">
                    <span class="icon" v-bind:class="[entry.comments && entry.comments.length ? 'has-text-info': 'has-text-grey-light']">
                        <i class="fas fa-comment"></i>
                    </span>
                  </a>
                  <a @click="userData.like(entry)">
                    <span class="icon" v-bind:class="[entry.likes && entry.likes.length ? (userData.userHasLiked(entry.likes) ? 'has-text-danger' : 'liked') : 'has-text-grey-light']">
                        <i class="fas fa-heart"></i>
                    </span>
                  </a>
                  <span v-if="entry.likes && entry.likes.length"><b>{{ userData.getUserName(entry.likes[0]) }}</b><span v-if="entry.likes.length > 1"> och 
                    <div class="dropdown is-hoverable" style="vertical-align: baseline">
                      <div class="dropdown-trigger">
                        <a aria-haspopup="true" aria-controls="dropdown-menu4">
                        {{entry.likes.length-1}}
                        </a>
                      </div>
                      <div class="dropdown-menu" id="dropdown-menu4" role="menu">
                        <div class="dropdown-content">
                          <div class="dropdown-item">
                            <div v-for="like in entry.likes.slice(1)" v-bind:key="like">{{ userData.getUserName(like) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span v-if="entry.likes.length == 2"> annan</span><span v-else> andra</span></span> gillar</span>
                  <span v-else class="has-text-grey-light"><i>Bli först att gilla</i></span>
                </p>
                <p class="subtitle is-6">
                  <span v-for="comment in entry.comments" v-bind:key="comment.created.seconds" style="display:block">
                    <i class="has-text-grey">{{ userData.getUserName(comment.uid) }}: </i>{{ comment.comment }}
                  </span>
                </p>
              </div>
              <div class="media-content column is-2">
                <p class="subtitle is-5  has-text-centered " v-bind:style="getPointColor(entry.points)"><b>{{ entry.points.toFixed(0) }}</b></p>
                <p class="title is-7 has-text-centered" v-bind:style="getPointColor(entry.points)">poäng</p>
              </div>
            </div>
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
const _ = require('lodash');

Vue.component('RegisterActivity', RegisterActivity);

@Component
export default class Home extends Vue {
  public chartType = 'points';
  public current = 1;
  public showAllLaps = false;

  public data() {
    return {
      name: userData.user.name,
      challenge: userData.challenge,
      userData
    };
  }

  get userStats() {
    const stats = userData.statsData.userStats.filter((s: any) => s.totalPoints > 0);
    stats.sort((a: any, b: any) => this.chartType === 'points' ? b.totalPoints - a.totalPoints : (this.chartType === 'kcal' ? b.totalKcal - a.totalKcal : b.totalTime - a.totalTime));
    return stats;
  }

  get total() {
    if (userData.statsData.userStats.length < 2)
      return 1;
    const totMinutes = userData.statsData.userStats.map((x: any) => x.totalTime).reduce((a: any, b: any) => a + b);
    const totKcal = userData.statsData.userStats.map((x: any) => x.totalKcal).reduce((a: any, b: any) => a + b);
    return { kcal: totKcal, minutes: totMinutes };
  }

  get max() {
    if (userData.statsData.userStats.length < 2)
      return 1;
    const max = userData.statsData.userStats.map((x: any) => this.chartType === 'points' ? x.totalPoints
      : this.chartType === 'kcal' ? x.totalKcal : x.totalTime).reduce((a: any, b: any) => {
        return Math.max(a, b);
    });
    return max > 0 ? max : 1;
  }

  get filteredActivities() {
    return userData.activities.map(x =>  ({ text: x.text, id: x.id })).filter(x =>
      userData.runOnly ? x.text.indexOf('Löpning') === 0
      : (userData.cycleOnly ? x.text.toLowerCase().indexOf('cykling') !== -1
      : (userData.miscOnly ? x.text.indexOf('Löpning') === -1 && x.text.toLowerCase().indexOf('cykling') === -1
      : false)));
  }

  get latestEntries() {
    const entries = userData.statsData.allEntries;
    entries.sort((a: any, b: any) => b.created - a.created);
    return entries.slice((this.current - 1) * 20, 20 + (this.current - 1) * 20);
  }

  public minuteHour(entry: any) {
    return entry.minutes < 100 ? entry.minutes : (entry.minutes / 60).toFixed(1);
  }

  public minuteHourTitle(entry: any) {
    return entry.minutes < 100 ? 'min' : 'tim';
  }

  public comment(entry: any) {
    this.$dialog.prompt({
        message: 'Skriv din kommentar',
        inputAttrs: {
            placeholder: '',
            maxlength: 200,
        },
        confirmText: 'Skicka',
        cancelText: 'Avbryt',
        onConfirm: (comment) => {
          userData.saveComment(comment, entry);
        }
    });
  }

  public getPointColor(points: number)
  {
    const hsl = 'hsl(0, 0%, @value%)';
    const percent = points / 600;
    const value = 90 - (90 * percent);
    return { color: hsl.replace('@value', value.toString()) };
  }

  public toggleAllLaps() {
    this.showAllLaps = !this.showAllLaps;
  }

  // --------------
    tabledata = <any>[];
    columns = [
        {
            field: 'week',
            label: 'Vecka',
            width: '40',
            renderHtml: true,
            centered: true
        },
        {
            field: 'w',
            label: 'Vinnare totalt',
            renderHtml: true
        },
        {
            field: 'wkcal',
            label: 'Kcal',
            renderHtml: true  
        },
        {
            field: 'wminutes',
            label: 'Minuter',
            renderHtml: true
        },
        {
            field: 'wnumberofacts',
            label: 'Antal aktiviteter',
            renderHtml: true
        },
        {
            field: 'winnervariation',
            label: 'Störst variation',
            renderHtml: true
        }
    ]
  //  ------------

  @Watch('filteredActivities')
  public filterPressed(value: any) {
    this.current = 1;
    userData.loadStats({activities: value.map((x: any) => x.id)});
  }

  @Watch('userData.challenge')
  public callangeChange() {
    userData.loadStats();
  }
}
</script>
