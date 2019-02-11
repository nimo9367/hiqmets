import Vue from 'vue';
import App from './App.vue';
import router from './router';
import firebase from 'firebase';
import UserData from './modules/UserData';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
require('./static/style.css');
export const moment = require('moment');
export const countdown = require('countdown')


countdown.setLabels(
  ' millisekund| sekund| minut| timme| dag| vecka| månad| år| decennium| 100 år| millennium',
  ' millisekunder| sekunder| minuter| timmar| dagar| veckor| månader| år| decennium| 100 år| millennia',
  ' och ',
  ', ',
  '',
  function(n:any){ return n.toString(); });

Vue.use(Buefy, {
  defaultDateFormatter: (date:any) => date.toLocaleDateString('sv-SE'),
  defaultIconPack: 'fas',
});
require('moment/locale/sv');

Vue.use(require('vue-moment'), {
    moment
});

Vue.config.productionTip = true;
Vue.config.devtools = true;

// Initialize Firebase
let app: any;
const config = {
  apiKey: 'AIzaSyBA4i2B7QBVcsvsfZnqD60yf_u-G9sbWc0',
  authDomain: 'hiqmets-fb.firebaseapp.com',
  databaseURL: 'https://hiqmets-fb.firebaseio.com',
  projectId: 'hiqmets-fb',
  storageBucket: 'hiqmets-fb.appspot.com',
  messagingSenderId: '915954119',
};
firebase.initializeApp(config);
export const db = firebase.firestore();
export const userData = new UserData();
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    userData.isLoggedIn = true;
    userData.loadUser(user);
    
  }
  else
    userData.isLoggedIn = false;


  // Directives
  Vue.directive('kify', (el, binding) => {
    el.innerHTML = binding.value > 1000 ? (binding.value / 1000).toFixed(1) + 'K': binding.value;
  });

  if (!app) {
    /* eslint-disable no-new */
    app = new Vue({
      router,
      render: (h) => h(App),
    }).$mount('#app');
  }
});