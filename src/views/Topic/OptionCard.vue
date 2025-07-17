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
      style="
        box-shadow: none;
        border: 1px solid #ebebeb;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 8px;
      "
      :style="{ padding: isRankCard ? '8px' : '0', 'text-align': isRankCard ? 'center' : 'left' }"
    >
      <div style="width: 100%" :style="{ height: isRankCard ? '136px' : '116px' }">
        <v-img
          :height="isRankCard ? '136px' : '116px'"
          :src="Boolean(props.option?.image) ? props.option.image : DEFAULT_CARD_IMG"
          cover
        ></v-img>
      </div>
      <div style="position: relative; flex: 1; border-top: 1px solid #ebebeb; margin-bottom: 8px">
        <v-chip
          v-if="isRankCard"
          variant="flat"
          append-icon="mdi-star"
          style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%)"
          color="orange"
        >
          <p style="font-size: 16px; font-weight: 700; color: #252525; margin: 0">
            {{ option.vote_count }}
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
          :style="{ paddingTop: isRankCard ? '16px' : '4px' }"
        >
          {{ option?.title ?? '' }}
        </p>
        <a
          v-if="option?.link"
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
      <v-card-actions v-if="!isRankCard" style="padding-top: 0">
        <div class="w-100 d-flex justify-space-between align-center">
          <div class="d-flex mt-1">
            <div
              v-for="userId in Object.keys(option.user_votes).slice(0, 4)"
              :key="userId"
              style="margin-right: -8px"
            >
              <v-avatar color="secondary" class="m-1" size="30">
                <v-img
                  v-if="userMap[userId]?.avatar"
                  :src="userMap[userId].avatar"
                  :alt="userMap[userId].username"
                ></v-img>
                <span v-else>{{ userMap[userId]?.email?.charAt(0).toLocaleUpperCase() }}</span>
                <v-tooltip activator="parent" location="top">{{
                  userMap[userId]?.username
                }}</v-tooltip>
              </v-avatar>
            </div>
            <div v-if="Object.keys(option.user_votes).length > 4" class="mr-1">
              <v-avatar
                color="light-blue-darken-2"
                class="m-1 cursor-pointer"
                size="30"
                @click.stop="onClickSeeMore(option)"
              >
                {{ Object.keys(option.user_votes).length - 4 }}<sup>+</sup>
              </v-avatar>
              <v-tooltip activator="parent" location="top">{{
                `${Object.keys(option.user_votes).length - 4} others people`
              }}</v-tooltip>
            </div>
          </div>
          <v-icon
            v-if="props.option.user_votes && !lodash.isEmpty(props.option.user_votes)"
            icon="mdi-thumb-up"
            size="x-large"
            :color="
              props.option.user_votes.hasOwnProperty(String(currentAccount?.id))
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
import type { IOptionModel } from '@/core/interfaces/model/option'
import type { IUser } from '@/core/interfaces/model/user'
import type { StyleValue } from 'vue'
import lodash from 'lodash'
import { RANK_ICON, DEFAULT_CARD_IMG } from '@/core/constants/app'
import { useUserStore } from '@/stores'

const props = defineProps<{
  isRankCard: boolean
  index: number
  option: IOptionModel
  currentAccount: IUser | null
  cardStyle?: StyleValue
}>()

const emits = defineEmits<{
  (e: 'handleChangeVote', index: number): void
  (e: 'onClickSeeMore', payload: IOptionModel): void
}>()

const userList = useUserStore().getUserList
const userMap = userList.reduce((acc, user) => {
  acc[user.id] = user
  return acc
}, {} as Record<string, IUser>)

const handleChangeVote = (index: number) => {
  emits('handleChangeVote', index)
}

const onClickSeeMore = (payload: IOptionModel) => {
  emits('onClickSeeMore', payload)
}
</script>

<script lang="ts">
export default {
  name: 'OptionCard'
}
</script>
