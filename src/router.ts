import Vue from 'vue';
import { firebase } from '@firebase/app';
import '@firebase/auth';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Login from './views/Login.vue';
import SignUp from './views/SignUp.vue';
import ActivityList from './views/ActivityList.vue';
import Profile from './views/Profile.vue';
import Challenges from './views/Challenges.vue';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
    {
      path: '/activity_list/:userId',
      name: 'ActivityList',
      component: ActivityList,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/profile/',
      name: 'Profile',
      component: Profile,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/challenges/',
      name: 'Challenges',
      component: Challenges,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/sign-up',
      name: 'SignUp',
      component: SignUp,
    },
    {
      path: '*',
      redirect: '/sign-up',
    },
  ],
});

router.beforeEach((to, from, next) => {
  const currentUser = firebase.auth!().currentUser;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth && !currentUser) {
    next('/login');
  } 
  else if (!requiresAuth && currentUser) {
    next('/');
  }
  else if (requiresAuth && currentUser) {
    next();
  } 
  else
    next();
});

export default router;
