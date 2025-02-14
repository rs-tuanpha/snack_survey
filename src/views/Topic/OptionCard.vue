<template>
  <div :style="cardStyle">
    <img
      v-if="isRankCard && index < 3"
      :src="RANK_ICON[index]"
      width="40"
      height="40"
      style="position: absolute; top: -8px; left: -8px; z-index: 10"
    />
    <v-card
      style="box-shadow: none; border: 1px solid #ebebeb; height: 100%;display: flex; flex-direction: column; padding: 8px"
      :style="{ padding: isRankCard ? '8px' : '0', 'text-align': isRankCard ? 'center' : 'left' }"
    >
      <div style="width: 100%;" :style="{height:isRankCard ? '136px' : '116px'}">
        <v-img
          :height="isRankCard ? '136px' : '116px'"
          :src="Boolean(props.option?.thumbnail) ? props.option.thumbnail : '/assets/default-vote-thumb.jpg'"
          cover
        ></v-img>
      </div>
      <div style="position: relative;flex: 1; border-top: 1px solid #ebebeb; margin-bottom: 8px;">
        <v-chip
          v-if="isRankCard"
          variant="flat"
          append-icon="mdi-star"
          style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%);"
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
          :style="{paddingTop: isRankCard ? '16px' : '4px'}"
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
      </div>
      <v-card-actions v-if="!isRankCard" style="padding-top: 0;">
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
    </v-card>
  </div>
</template>
<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import type { StyleValue } from 'vue'
import { RANK_ICON } from '@/core/constants/app'

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
