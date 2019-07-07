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
                        <p class="title">{{ userData.entriesData.totalMinutes * 1000 * 60 | duration('as', 'hours') | toDecimals(1) }}</p>
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
              <div class="columns heading is-mobile has-text-centered">
                  <div class="column is-one-sixth">Datum</div>
                  <div class="column is-one-sixth">Aktivitet</div>
                  <div class="column is-one-sixth">Minuter</div>
                  <div class="column is-one-sixth">Kcal</div>
                  <div class="column is-one-sixth">Poäng</div>
                  <div class="column is-one-sixth"></div>
              </div>
              <div class="column has-background-light" style="border-radius: 0.4em; margin: 0.4em 0px;" v-for="entry in pagedEntries" v-bind:key="entry.id">
                <div class="columns is-mobile has-text-centered" style="margin-bottom:0">
                    <div class="column is-one-sixth has-text-left"><time>{{ entry.created | moment("calendar")  }}</time></div>
                    <div class="column is-one-sixth"><span class="tag is-success"><i v-bind:class="entry.fa"></i><span class="is-hidden-mobile">&nbsp;{{ entry.activity }}</span></span></div>
                    <div class="column is-one-sixth has-text-centered"><span class="title is-5">{{ entry.minutes }}</span></div>
                    <div class="column is-one-sixth"><span class="title is-5">{{ entry.kcal }}</span></div>
                    <div class="column is-one-sixth"><span class="title is-5 has-text-success">{{ entry.points }}</span></div>
                    <div v-if="isLoggedInUser" class="column is-one-sixth"><a @click="confirmRemove(entry)" class="delete is-medium "></a></div>
                    <div v-else class="column is-one-sixth"></div>
                </div>
                <div class="columns">
                  <div class="column is-one-third">
                    <a @click="comment(entry)" class="has-text-grey-light">
                      <span class="icon is-medium" v-bind:class="[entry.comments && entry.comments.length? 'has-text-info' : 'has-text-grey-light']">
                          <i class="fas fa-comment fa-comment-2x"></i>
                      </span>
                    </a>
                    <a @click="userData.like(entry)">
                      <span class="icon is-medium" v-bind:class="[entry.likes && entry.likes.length ? (userData.userHasLiked(entry.likes) ? 'has-text-danger' : 'liked') : 'has-text-grey-light']">
                          <i class="fas fa-heart fa-heart-2x"></i>
                      </span>
                      <i v-if="!entry.likes || !entry.likes.length" class="has-text-grey-light"> Var först med att gilla</i>
                    </a>
                    <span v-if="entry.likes && entry.likes.length">
                      {{ entry.likes.map(like => userData.getUserName(like)).reverse().join(', ') }}
                    </span>
                    <div class="columns">
                      <div class="column">
                        <div v-if="entry.comments && entry.comments.length">
                          <div v-for="comment in entry.comments" v-bind:key="comment.created.seconds">
                            <i class="has-text-grey-light">{{ userData.getUserName(comment.uid) }}: </i>{{comment.comment}}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
import { db, userData } from '../main';

Vue.component('RegisterActivity', RegisterActivity);

@Component
export default class ActivityList extends Vue {
  self = this;
  current = 0;

  public data() {
    return {
      name: userData.user.name,
      challenge: userData.challenge,
      userData: userData,
      userId: this.$route.params.userId,
      props: ['userId']
    };
  }

  public more() {
    if (userData.entriesData.entries.length > (this.current + 1) * 10)
      this.current++;
  }

  public less() {
    if (this.current > 0)
      this.current--;
  }

  get pagedEntries() {
    return userData.entriesData.entries.slice(this.current * 10, this.current * 10 + 10);
  }

  public confirmRemove(entry: any) {
      this.$dialog.confirm({
          title: 'Ta bort aktivitet',
          message: 'Är du säker på att du vill <b>ta bort</b> aktivitet? Kan inte ångras.',
          confirmText: 'Ta bort',
          type: 'is-danger',
          hasIcon: true,
          onConfirm: () => this.remove(entry)
      });
  }

  public remove(entry: any) {
    const that = this;
    db.collection('entries').doc(entry.id).delete().then(() => {
      this.updateUserStats(entry);
      that.$toast.open('Aktivitet borttagen!');
    }).catch((error) => {
      that.$toast.open('Error removing document: ' + error);
    });
  }

  private updateUserStats(act) {
      // Ugly hack because FB is slow to propagate 
      const stats = userData.statsData.userStats.find(x => x.uid == act.uid);
      console.log(userData.statsData.userStats);
      if(stats) {
          stats.totalPoints -= act.points;
          stats.totalKcal -= Number(act.kcal);
          stats.totalMinutes -= Number(act.minutes);
          stats.totalNumber -= 1;
      }
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

  get isLoggedInUser() {
    return this.$data.userData.user.id === this.$route.params.userId;
  }

  public mounted() {
    if (!userData.challenge.id.length) {
      userData.loadChallenges().then(() => {
        userData.loadEntries(this.$route.params.userId);
      });
    } else {
        userData.loadEntries(this.$route.params.userId);
    }
  }
}
</script>