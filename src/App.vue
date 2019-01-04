<template>
  <section id="app">
    <link rel="stylesheet" 
        href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" 
        integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" 
        crossorigin="anonymous">
    <nav class="navbar" role="navigation" aria-label="main navigation" style = "border-radius: 0em">
      <div class="container">
      <div class="navbar-brand">
        <a class="navbar-item">
        <router-link to="/">
          <img src="./assets/logo.png" width="56" height="28">
        </router-link>
        </a>
        <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        </a>
      </div>
      <div id="navbarBasicExample" class="navbar-menu">
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
        <div class="navbar-end">
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
          <strong>Workout Challenge </strong> v0.01
        </p>
      </div>
    </footer>
    <b-loading :is-full-page="false" :active.sync="userData.isLoading" :can-cancel="true"></b-loading>
  </section>
</template>
<script>
  import firebase from 'firebase';
  import { userData } from './main';

  export default {
      name: 'app',
      data() {
          return {
              userData: userData,
          };
      },
      methods: {
        logout() {
          firebase.auth().signOut().then(() => {
            this.$router.replace('login');
          });
        },
      }
  };
</script>
<style>
</style>
