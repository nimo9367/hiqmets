<template>
  <div>
    <div class="hero is-light">
      <div class="hero-body">
        <div v-if="challenge" class="container">
           <div class="media">
            <div class="media-left">
              <figure class="image is-64x64">
                <img class="is-rounded" v-bind:src="userData.getAvatarUrl(userData.entriesData)">
              </figure>
            </div>
            <div class="media-content">
              <h1 class="title">
                <span>{{ this.userData.entriesData.loadedUsersName }}</span>
              </h1>
              <h2 class="subtitle">
                {{ challenge.name }} 
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="container">
        <section class="section">
          <div class="columns">
            <div class="column auto">
              <div class="columns heading is-mobile">
                <div class="column is-four-fifths">
                  <nav class="level is-mobile">
                    <div class="level-item  has-text-centered">
                        <div>
                        <p class="heading">Timmar</p>
                        <p class="title">{{ userData.entriesData.totalMinutes * 1000 * 60 | duration('as', 'hours').toFixed(1) }}</p>
                        </div>
                    </div>
                    <div class="level-item  has-text-centered">
                        <div>
                        <p class="heading">Kcal</p>
                        <p class="title" v-kify="userData.entriesData.totalKcal" v-bind:title="userData.entriesData.totalKcal"></p>
                        </div>
                    </div>
                    <div class="level-item  has-text-centered">
                        <div>
                        <p class="heading">Poäng</p>
                        <p class="title has-text-success" v-kify="userData.entriesData.totalPoints" v-bind:title="userData.entriesData.totalPoints"></p>
                        </div>
                    </div>
                  </nav>
                </div>
              </div>
              <div class="columns heading is-mobile">
                  <div class="column is-one-sixth">Datum</div>
                  <div class="column is-one-sixth">Aktivitet</div>
                  <div class="column is-one-sixth">Minuter</div>
                  <div class="column is-one-sixth">Kcal</div>
                  <div class="column is-one-sixth">Poäng</div>
                  <div class="column is-one-sixth"></div>
              </div>
              <div v-for="entry in pagedEntries" class="columns  is-mobile" v-bind:key="entry.id">
                  <div class="column is-one-sixth "><time>{{ entry.created | moment("calendar")  }}</time></div>
                  <div class="column is-one-sixth"><span class="tag is-success">{{ entry.activity }}</span></div>
                  <div class="column is-one-sixth">{{ entry.minutes }}</div>
                  <div class="column is-one-sixth">{{ entry.kcal }}</div>
                  <div class="column is-one-sixth has-text-success">{{ entry.points }}</div>
                  <div v-if="isLoggedInUser" class="column is-one-sixth"><a @click="confirmRemove(entry.id)" class="delete is-medium "></a></div>
                  <div v-else class="column is-one-sixth"></div>
              </div>
              <div class="columns">
                <div class="column">
                  <a v-if="current > 0" @click="less" role="button" href="#" class="pagination-next"><span class="icon"><i class="fas fa-angle-left fa-lg"></i></span></a>
                  <a v-if="userData.entriesData.entries.length > (this.current + 1) * 10" @click="more" role="button" href="#" class="pagination-next"><span class="icon"><i class="fas fa-angle-right fa-lg"></i></span></a>
                </div>
              </div>
            </div>
            <div class="column is-one-quarter is-mobile" v-if="userData.challenge.enddate > new Date()">
              <RegisterActivity v-bind:disabled="!isLoggedInUser"></RegisterActivity>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import RegisterActivity from '@/components/RegisterActivity.vue'; 
import firebase from 'firebase';
import { db, userData } from '../main';

Vue.component('RegisterActivity', RegisterActivity);

@Component
export default class ActivityList extends Vue {
  self = this;
  data() {
    return {
      name: userData.user.name,
      challenge: userData.challenge,
      userData: userData,
      userId: this.$route.params.userId,
      props: ['userId']
    }
  }

  current = 0;

  more() {
    if(userData.entriesData.entries.length > (this.current + 1) * 10)
      this.current++;
  }

  less() {
    if(this.current > 0)
      this.current--;
  }

  get pagedEntries() {
    return userData.entriesData.entries.slice(this.current * 10, this.current * 10 + 10)
  }

  confirmRemove(id:any) {
        this.$dialog.confirm({
            title: 'Ta bort aktivitet',
            message: 'Är du säker på att du vill <b>ta bort</b> aktivitet? Kan inte ångras.',
            confirmText: 'Ta bort',
            type: 'is-danger',
            hasIcon: true,
            onConfirm: () => this.remove(id)
        })
    }
  
  remove(id:any) {
    const that = this;
    db.collection("entries").doc(id).delete().then(function() {
      that.$toast.open('Aktivitet borttagen!')
    }).catch(function(error) {
      console.error("Error removing document: ", error);
    });
  } 
  
  get isLoggedInUser() {
    return this.$data.userData.user.id == this.$route.params.userId;
  }

  mounted() {
    if(!userData.challenge.id.length){
      userData.loadChallenges().then(() => {
        userData.loadEntries(this.$route.params.userId);
      })
    }
    else
        userData.loadEntries(this.$route.params.userId);
  }
}
</script>