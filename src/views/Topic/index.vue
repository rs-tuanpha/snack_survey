<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'

const options: IOption[] = [
  {
    id: '1',
    title: 'mon 1',
    link: 'adfba',
    voteBy: [{ name: 'A' }, { name: 'B' }]
  },
  {
    id: '2',
    title: 'mon 2',
    link: 'adfba',
    voteBy: [{ name: 'A' }, { name: 'B' }, { name: 'A' }, { name: 'B' }]
  },
  {
    id: '3',
    title: 'mon 3',
    link: 'adfba',
    voteBy: []
  },
  {
    id: '4',
    title: 'mon 4',
    link: 'adfba',
    voteBy: []
  },
  {
    id: '5',
    title: 'mon 5',
    link: 'adfba',
    voteBy: []
  }
]
</script>

<template>
  <v-container>
    <v-sheet
      elevation="1"
      max-width="638"
      rounded="lg"
      width="100%"
      class="border-top-violet pa-6 mx-auto"
      border
    >
      <h1 class="text-h4">Xả quỹ tháng X</h1>
      <p class="mt-3 text-medium-emphasis text-body-1">Tối đa 30k</p>
      <v-divider class="border-opacity-50"></v-divider>
    </v-sheet>

    <v-sheet
      elevation="1"
      max-width="638"
      rounded="lg"
      width="100%"
      class="mt-3 pa-6 mx-auto"
      border
    >
      <ul>
        <li
          v-for="option in options"
          :key="option.id"
          class="d-flex align-center mb-2 px-4 py-2 elevation-1"
        >
          <v-avatar color="primary">
            {{ option.voteBy.length }}
          </v-avatar>
          <div class="flex-grow-1 mx-4">
            <p class="mb-1 text-h6">{{ option.title }}</p>
            <a :href="option.link" target="_blank">{{ option.link }}</a>
            <div class="d-flex">
              <div v-for="user in option.voteBy.slice(0, 3)" :key="user.name" class="mr-1">
                <v-avatar color="secondary" class="m-1" size="30">
                  {{ user.name }}
                </v-avatar>
              </div>
              <div v-if="option.voteBy.length > 3" class="mr-1">
                <v-avatar color="secondary" class="m-1" size="30"> ... </v-avatar>
              </div>
            </div>
          </div>
          <div>
            <v-btn class="h-100">Vote</v-btn>
          </div>
        </li>
      </ul>
    </v-sheet>
  </v-container>
</template>

<style scoped lang="scss">
@import './styles.scss';
</style>
