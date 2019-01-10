<template>
  <section id="app">
    <link rel="stylesheet" 
        href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" 
        integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" 
        crossorigin="anonymous">
    <nav class="navbar is-radiusless" role="navigation" aria-label="main navigation">
      <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item">
          <router-link to="/">
            <img src="./assets/logo.png" width="56" height="28">
          </router-link>
          </a>
          
          <div class="navbar-item" v-if="userData.isLoggedIn && userData.challenge.enddate > new Date()">
            <b-dropdown>
                <button class="button is-success is-small" slot="trigger">
                    <b-icon icon="plus-circle"></b-icon>
                    <span>Aktivitet</span>
                </button>
                <b-dropdown-item custom paddingless>
                  <RegisterActivity v-bind:quickAdd="true"></RegisterActivity>
                </b-dropdown-item>
            </b-dropdown>
          </div>
          <a role="button" class="navbar-burger burger" v-bind:class="{'is-active': burgerActive}" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample" @click="toggleBurger">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          </a>
        </div>
        <div id="navbarBasicExample" class="navbar-menu"  v-bind:class="{'is-active': burgerActive}" >
          <div v-if="userData.isLoggedIn" class="navbar-start">
            <a class="navbar-item">
              <router-link to="/">Topplista</router-link>
            </a>
            <a class="navbar-item">
              <router-link :to="{ name: 'ActivityList', params: {userId: userData.user.id } }">Min aktivitet</router-link>
            </a>
            <a class="navbar-item">
              <router-link to="/challenges">Utmaningar</router-link>
            </a>
            <a class="navbar-item">
              <router-link to="/profile">Profil</router-link>
            </a>
          </div>

          <div class="navbar-end" v-if="userData.isLoggedIn">
            <a class="navbar-item has-text-link" @click="importFromStrava">
              <span class="icon is-small">
                <i class="fab fa-strava"></i>
              </span>
              <span > Import</span>
            </a>
            <div class="navbar-item">
              <div class="buttons">
                <a v-if="!userData.isLoggedIn" class="button is-primary">
                  <router-link to="/sign-up">Skapa konto</router-link>
                </a>
                <a v-if="!userData.isLoggedIn" class="button is-light">
                  <router-link to="/login">Logga in</router-link>
                </a>
                <a  v-if="userData.isLoggedIn" @click="logout" class="button is-light">
                  Logga ut
                </a> 
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <router-view  :key="$route.fullPath" />
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong>Workout Challenge </strong> {{version}}
        </p>
      </div>
    </footer>
    <b-loading :is-full-page="false" :active.sync="userData.isLoading" :can-cancel="true"></b-loading>
  </section>
</template>
<script>
  import firebase from 'firebase';
  import { userData } from './main';
  import stravaImporter from './modules/StravaImporter';

  export default {
      name: 'app',
      data() {
          return {
              userData: userData,
              burgerActive: false,
              stravaImporter: stravaImporter,
              version: require('../package.json').version
          };
      },
      methods: {
        logout() {
          firebase.auth().signOut().then(() => {
            this.$router.replace('login');
          });
        },
        toggleBurger() {
          this.$data.burgerActive = !this.$data.burgerActive;
        },
        importFromStrava() {
          this.$dialog.confirm({
              message: 'Just nu stöds bara import från <b>Strava</b>. Vill du fortsätta?',
              onConfirm: () => stravaImporter.authorize()
          })
        }
      }
  };
</script>
<style>
</style>
