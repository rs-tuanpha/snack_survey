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
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <div>Basic layout</div>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <a href="#" @click.prevent="logout">Logout</a>
      </nav>
    </div>
  </header>
</template>
