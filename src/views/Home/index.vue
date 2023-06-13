<script setup lang="ts">
  import { ref } from 'vue'
  import { useTopicStore } from '@/stores/topic'
  import Cookies from 'js-cookie'

  const show = ref(true)
  const accounts = useTopicStore().accountList;
  const topics = ref(useTopicStore().openTopicList);
  const account = ref(null);

  const login = () => {
    show.value = false;
    useTopicStore().getOpenTopicList();
    topics.value = useTopicStore().openTopicList;
    Cookies.set('account_info', account.value, { expires: 7 });
  }
</script>

<template>
    <div class="py-4">
      <v-container class="">
        <v-row justify="center">
            <v-col cols="6">
            <v-card
            class="mx-auto pa-4 pb-4"
            max-width="448"
            rounded="md"
            v-if="show">
              <v-autocomplete
              label="Chọn tài khoản"
              :items="accounts"
              item-title="username"
              item-value="id"
              v-model="account"
            >
            </v-autocomplete>
            <v-btn class="bg-blue-darken-2 float-right" @click="login">Đăng nhập</v-btn>
            </v-card>	
        </v-col>
      </v-row>
    </v-container>

    <v-container class="">
      <v-row justify="center">
        <v-col cols="6">
          <v-row justify="center">
          <v-col v-for="{id, name, description} in topics" :key="id" cols="12">
          <v-hover v-slot="{ isHovering, props }">
            <v-card :title="name" :text="description" variant="outlined"  :elevation="isHovering ? 12 : 2" v-bind="props" :class="isHovering ? 'bg-indigo-lighten-2' : ''"
              target="_blank" :href="'vote-topic/'+ id">
            </v-card>
          </v-hover>
          </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
    </div>
</template>
