
<template>
    <div>
        <div class="hero is-light">
            <div class="hero-body">
                <div class="container">
                <h1 class="title">
                    Skapa konto
                </h1>
                <h2 class="subtitle">
                    <p>Har du redan ett konto? Logga in <router-link to="/login">här </router-link></p>
                </h2>
                </div>
            </div>
        </div>
        <div class="section container">
            <form v-on:submit.prevent="signUp">
                <div class="columns">
                    <div class="column is-4 is-offset-4">
                        <img src="../assets/logo_large.png">
                        
                        <b-field label="Namn">
                            <b-input v-model="username" type="text" placeholder="Kalle Kula" minlength="5" maxlength="30"></b-input>
                        </b-field>
                        <b-field label="Email">
                            <b-input v-model="email" type="email" placeholder="kalle.kula@hiq.se" ></b-input>
                        </b-field>
                        <b-field label="Lösenord">
                            <b-input v-model="password" type="password" minlength="6">
                            </b-input>
                        </b-field>
                        <div class="field">
                            <input type="submit" class="button is-primary input" value="Skapa"/>
                        </div>
                    </div>
                </div>
            </form>
        </div>
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
                username: ''
            };
        },
        methods: {
            signUp() {
                firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then(
                    (user) => {
                        const newUser = {
                            uid: user.user.uid,
                            name: this.$data.username,
                            email: this.$data.email
                        };
                        db.collection('users').add(newUser).then(() => router.push({ name: 'home'}));
                    },
                    (err) => {
                        this.$toast.open({
                            message: 'Något gick snett :(. <br>' + err.message,
                            type: 'is-danger'
                        });
                    },
                );
            },
        },
    };
</script>
