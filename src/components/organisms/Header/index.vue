<script lang="ts" setup>
import authService from '@/services/auth.service';

/**
 * Organism: Header
 */

const logout = () => {
  authService.logout();
}
</script>

<template>
  <header class="glass-container">
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <img alt="Vue logo" class="logo mr-4" src="@/assets/logo.svg" width="40" height="40" />
        <h1 class="glass-text text-h5">SnackSurveyMaster</h1>
      </div>

      <nav class="d-flex align-center gap-4">
        <RouterLink to="/" class="glass-text-secondary text-decoration-none">Home</RouterLink>
        <RouterLink to="/about" class="glass-text-secondary text-decoration-none">About</RouterLink>
        <v-btn 
          @click="logout" 
          class="glass-btn-secondary"
          size="small"
        >
          <v-icon icon="mdi-logout" class="mr-1"></v-icon>
          Logout
        </v-btn>
      </nav>
    </div>
  </header>
</template>
