<template>
  <div :style="cardStyle">
    <img
      v-if="isRankCard && index < 3"
      :src="`/assets/${index + 1}.webp`"
      width="40"
      height="40"
      style="position: absolute; top: -8px; left: -8px; z-index: 10"
    />
    <v-card
      style="box-shadow: none; border: 1px solid #ebebeb"
      :style="{ padding: isRankCard ? '8px' : '0', 'text-align': isRankCard ? 'center' : 'left' }"
    >
      <v-img
        :height="isRankCard ? '136px' : '116px'"
        :src="props.option?.thumbnail ?? '/assets/default-vote-thumb.jpg'"
        cover
      ></v-img>
      <div style="border-top: 1px solid #ebebeb">
        <v-chip
          v-if="isRankCard"
          variant="flat"
          append-icon="mdi-star"
          style="margin-top: -20px"
          color="orange"
        >
          <p style="font-size: 16px; font-weight: 700; color: #252525; margin: 0">
            {{ option?.voteBy?.length }}
          </p>
        </v-chip>
        <p
          style="
            font-size: 14px;
            font-weight: 700;
            color: #252525;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            margin-bottom: 1px;
            padding: 4px 8px 0;
          "
        >
          {{ option?.title ?? '' }}
        </p>
        <a
          :href="option?.link"
          target="_blank"
          style="
            display: block;
            width: 100%;
            font-size: 12px;
            padding: 0 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          {{ props.option?.link }}
        </a>
        <v-card-actions v-if="!isRankCard">
          <div class="w-100 d-flex justify-space-between align-center">
            <div class="d-flex mt-1">
              <div
                v-for="user in option?.voteBy?.slice(0, 4)"
                :key="user.username"
                style="margin-right: -8px"
              >
                <v-avatar color="secondary" class="m-1" size="30">
                  <v-img v-if="user.avatar" :src="user.avatar" :alt="user.username"></v-img>
                  <span v-else>{{ user.username.charAt(0).toLocaleUpperCase() }}</span>
                  <v-tooltip activator="parent" location="top">{{ user.username }}</v-tooltip>
                </v-avatar>
              </div>
              <div v-if="props.option?.voteBy?.length > 4" class="mr-1">
                <v-avatar
                  color="light-blue-darken-2"
                  class="m-1 cursor-pointer"
                  size="30"
                  @click.stop="onClickSeeMore(option)"
                >
                  {{ option?.voteBy?.length - 4 }}<sup>+</sup>
                </v-avatar>
                <v-tooltip activator="parent" location="top">{{
                  `${option?.voteBy?.length - 4} others people`
                }}</v-tooltip>
              </div>
            </div>
            <v-icon
              icon="mdi-thumb-up"
              size="x-large"
              :color="
                props.option.voteBy.some((voter) => voter.id === currentAccount?.id)
                  ? 'red-darken-1'
                  : 'blue-darken-3'
              "
              @click.prevent="handleChangeVote(index)"
            ></v-icon>
          </div>
        </v-card-actions>
      </div>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import type { StyleValue } from 'vue'

const props = defineProps<{
  isRankCard: boolean
  index: number
  option: IOption
  currentAccount: IUser | null
  cardStyle?: StyleValue
}>()
const emits = defineEmits<{
  (e: 'handleChangeVote', index: number): void
  (e: 'onClickSeeMore', payload: IOption): void
}>()

const handleChangeVote = (index: number) => {
  emits('handleChangeVote', index)
}

const onClickSeeMore = (payload: IOption) => {
  emits('onClickSeeMore', payload)
}
</script>
