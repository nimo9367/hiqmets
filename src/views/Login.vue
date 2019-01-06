<template>
    <div>
        <div class="hero is-light">
            <div class="hero-body">
                <div class="container">
                <h1 class="title">
                    Logga in
                </h1>
                <h2 class="subtitle">
                    <p>Har du inget konto? Du kan <router-link to="/sign-up"><span class="has-text-link">skapa ett</span></router-link></p>
                </h2>
                </div>
            </div>
        </div>
        <div class="section container">
            <form v-on:submit.prevent="login">
                <div class="columns">
                    <div class="column is-4 is-offset-4">
                        <img src="../assets/logo_large.png">
                        
                        <div class="card">
                            <div class="card-content">
                                <div class="field">
                                    <a class="button is-danger input" @click="signInWithGoogle">
                                        <span class="icon">
                                            <i class="fab fa-google"></i>
                                        </span>
                                        <span>Logga in med Google</span>
                                    </a>
                                </div>
                                
                                <div class="field">
                                    <a class="button input" href="#/sign-up">
                                        <span class="icon">
                                            <i class="fa fa-star"></i>
                                        </span>
                                        <span>Skapa nytt konto</span>
                                    </a>
                                </div>
                                <p class="has-text-grey has-text-centered" style="margin-top:20px">eller logga in med email</p>
                                <div class="field">
                                    <label class="label">Email</label>
                                    <input class="input" v-model="email" type="text" placeholder="kalle.kula@hiq.se" /><br>
                                </div>
                                <div class="field">
                                    <label class="label">Lösenord</label>
                                    <input class="input" v-model="password" type="password" placeholder="" /><br>
                                    <div class="has-text-right is-size-7">
                                        <a @click="resetPassword">Återställ lösenord</a>
                                    </div>
                                </div>
                                
                                <div class="field">
                                    <input type="submit" class="button is-primary input" value="Logga in"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import firebase from 'firebase';

    export default {
        name: 'login',
        data() {
            return  {
                email: '',
                password: '',
                error: '',
            };
        },
        methods: {
            login() {
                const self = this;
                auth.signInWithEmailAndPassword(this.email, this.password).then(
                    (user) => {
                        self.$router.push({name: 'home'});
                    },
                    (err) => {
                        const errorCode = err.code;
                        if (errorCode === 'auth/wrong-password')
                            self.error = 'Fel lösenord.';
                        else if (errorCode === 'auth/invalid-email')
                            self.error = 'Felaktig email.';
                        else if (errorCode === 'auth/user-not-found')
                            self.error = 'Konto inte registrerat.';
                        else
                            self.error = 'Något gick fel. Kontakta admin.';
                            
                        this.$toast.open({
                            message: 'Något gick snett :(. <br>' + self.error,
                            type: 'is-danger'
                        });
                    },
                );
            },
            signInWithGoogle: function() {
                const provider = new firebase.auth.GoogleAuthProvider()
                firebase.auth().signInWithRedirect(provider).then((result) => {
                    console.log(result)
                }).catch(err => console.log(err))
            },
            resetPassword() {
                const self = this;
                firebase.auth().sendPasswordResetEmail(this.$data.email).then(function() {
                    self.$toast.open({
                        message: 'Email skickat',
                        type: 'is-success'
                    });
                }).catch(function(error) {
                    self.$toast.open({
                        message: 'Något gick snett: "' + error + "'",
                        type: 'is-danger'
                    });
                });
            }
        },
    };
</script>