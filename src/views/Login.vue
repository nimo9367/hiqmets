<template>
    <div>
        <div class="hero">
            <div class="hero-body">
                <div class="container">
                <h1 class="title">
                    Logga in
                </h1>
                <h2 class="subtitle">
                    <p>Har du inget konto ? Du kan <router-link to="/sign-up">skapa ett </router-link></p>
                </h2>
                </div>
            </div>
        </div>
        <div class="section container">
            
            <form>
                <div class="columns">
                    <div class="column is-4 is-offset-4">
                        <div class="field">
                            <label class="label">Email</label>
                            <input class="input" v-model="email" type="text" placeholder="kallekula@hiq.se" /><br>
                        </div>
                        <div class="field">
                            <label class="label">Lösenord</label>
                            <input class="input" v-model="password" type="password" placeholder="" /><br>
                        </div>
                        
                        <div class="field">
                            <input type="submit" class="button is-primary input" @click="login" value="Logga in"/>
                        </div>
                        <div v-if="error" class="notification is-danger">
                            {{ error }}
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
                firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(
                    (user) => {
                        self.$router.push({name: 'home'});
                    },
                    (err) => {
                        const errorCode = err.code;
                        if (errorCode === 'auth/wrong-password')
                            self.error = 'Oops. Fel lösenord.';
                        else if (errorCode === 'auth/invalid-email')
                            self.error = 'Oops. Felaktig email.';
                        else if (errorCode === 'auth/user-not-found')
                            self.error = 'Oops. Konto inte registrerat.';
                        else
                            self.error = 'Oops. Något gick fel. Kontakta admin.';
                    },
                );
            },
        },
    };
</script>