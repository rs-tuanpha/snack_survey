<script setup lang="ts">
import { decimalTrunc, formatNumber } from '@/core/utils/regexValidate'
import { db } from '@/plugins/firebase'
import { collection } from 'firebase/firestore'
import { defineAsyncComponent } from 'vue'
import { useCollection } from 'vuefire'
const TheWelcome = defineAsyncComponent(() => import('@/components/templates/home/TheWelcome.vue'))
const topics = useCollection(collection(db, 'topics'))
/**
 * Page view: Home
 */
</script>

<template>
  <main>
    <TheWelcome />
    <RouterLink v-for="topic in topics" :to="`/vote-topic/${topic.id}`" :key="topic.id">
      <v-btn class="btn-primary">{{ topic.name }} </v-btn>
    </RouterLink>
  </main>
</template>

<style scoped lang="scss">
@import './styles.scss';
</style>
