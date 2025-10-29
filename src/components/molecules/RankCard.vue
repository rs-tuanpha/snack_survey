<template>
  <div :style="cardStyle">
    <img
      v-if="index < 3"
      :src="RANK_ICON[index]"
      width="40"
      height="40"
      style="position: absolute; top: -8px; left: -8px; z-index: 10"
    />
    <v-card
      class="glass-card-sm"
      style="
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 8px;
        text-align: center;
      "
    >
      <div style="width: 100%; height: 136px">
        <v-img
          height="136px"
          :src="Boolean(props.option?.image) ? props.option.image : DEFAULT_CARD_IMG"
          cover
        ></v-img>
      </div>
      <div style="position: relative; flex: 1; border-top: 1px solid #ebebeb; margin-bottom: 8px">
        <v-chip
          class="glass-chip-vue"
          variant="flat"
          append-icon="mdi-star"
          style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%)"
        >
          <p style="font-size: 16px; font-weight: 700; margin: 0">
            {{ props.option.voteCount || 0 }}
          </p>
        </v-chip>
        <p
          class="glass-text"
          style="
            font-size: 14px;
            font-weight: 700;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            margin-bottom: 1px;
            padding: 16px 8px 0;
          "
        >
          {{ option?.title ?? '' }}
        </p>
        <a
          :href="option?.link"
          target="_blank"
          class="glass-text-secondary"
          style="
            display: block;
            width: 100%;
            font-size: 12px;
            padding: 0 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-decoration: none;
          "
        >
          {{ props.option?.link }}
        </a>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { IOption } from '@/core/interfaces/model/option'
import { type StyleValue } from 'vue'
import { RANK_ICON, DEFAULT_CARD_IMG } from '@/core/constants/app'

const props = defineProps<{
  index: number
  option: IOption
  cardStyle?: StyleValue
}>()
</script>

<script lang="ts">
export default {
  name: 'RankCard'
}
</script>
