
<template>
  <div class="sign-up">
    <p>Let's create a new account !</p>
    <input type="text" v-model="username" placeholder="Username"><br>
    <input type="text" v-model="email" placeholder="Email"><br>
    <input type="password" v-model="password" placeholder="Password"><br>
    <button @click="signUp">Sign Up</button>
    <span>or go back to <router-link to="/login">login</router-link>.</span>
  </div>
</template>

 <script>
    import firebase from 'firebase';
    import router from '../router';
    import { db } from '../main';

    export default {
        name: 'signUp',
        data() {
            return {
                email: '',
                password: '',
                username: '',
            };
        },
        methods: {
            signUp() {
                const that = this;
                firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then(
                    (user) => {
                        const newUser = {
                            uid: user.user.uid,
                            name: that.username,
                            email: that.email,
                        };
                        db.collection('users').add(newUser).then(() => router.push({ name: 'home'}));
                    },
                    (err) => {
                        alert('Oops. ' + err.message);
                    },
                );
            },
        },
    };
</script>
