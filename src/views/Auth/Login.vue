<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
              <v-btn class="mt-4" color="primary" type="submit" block> Login </v-btn>
              <v-btn
                class="mt-2 w-24 min-w-min text-blue-500 d-flex justify-end"
                color="transparent"
                text
                block
                style="
                  text-decoration: underline;
                  padding: 0;
                  border: none;
                  box-shadow: none;
                  color: blue;
                  margin-right: 0;
                "
                :to="{ path: '/' }"
              >
                Forgot Password?
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')

import { login as supabaseLogin } from '@/services/account.service'
import { useRouter } from 'vue-router'

const router = useRouter()

const login = async () => {
  try {
    const { data, error } = await supabaseLogin(email.value, password.value)
    if (error) throw error

    // Assuming successful login, you might want to store the user data
    // and redirect to a dashboard or home page
    console.log('Login successful:', data)
    router.replace('/') // Redirect to home page or dashboard
  } catch (error) {
    console.error('Login failed:', error)
    // Handle login error (e.g., show error message to user)
  }
}
</script>
