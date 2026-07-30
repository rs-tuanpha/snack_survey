<script setup lang="ts">
import type { IUser } from '@/core/interfaces/model/user'
import type { IOption } from '@/core/interfaces/model/option'
import UiStatusBadge from './UiStatusBadge.vue'
import UiDatePill from './UiDatePill.vue'
import UiTimePill from './UiTimePill.vue'
import UiAvatarStack from './UiAvatarStack.vue'
import UiOptionChip from './UiOptionChip.vue'
import { uniqueVoters } from '@/core/utils/voter'

defineProps<{
  title: string
  open: boolean
  dateLabel: string
  timeLabel: string
  voters?: IUser[]
  topOptions?: IOption[]
}>()

defineEmits<{
  (e: 'click'): void
  (e: 'click-voters', users: IUser[]): void
}>()
</script>

<template>
  <div
    class="rounded-[28px] p-[3px] cursor-pointer"
    :class="open ? 'topic-card-ring' : 'bg-transparent'"
    @click="$emit('click')"
  >
    <div
      class="flex flex-col gap-[18px] p-6 rounded-[25px] bg-white"
      :class="!open && 'shadow-[0_2px_12px_0_rgba(0,0,0,0.04)] border border-stone-100'"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <UiStatusBadge :open="open" />
          <span class="font-serif font-bold text-[22px] text-ink truncate">{{ title }}</span>
        </div>
        <UiAvatarStack
          v-if="voters?.length"
          :users="voters"
          :title="`${voters.length} người đã vote`"
          @click="$emit('click-voters', voters)"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiDatePill :label="dateLabel" />
        <UiTimePill :label="timeLabel" :ended="!open" />
      </div>

      <div v-if="!open && topOptions?.length" class="flex gap-3 flex-wrap" @click.stop>
        <UiOptionChip
          v-for="opt in topOptions"
          :key="opt.id"
          :title="opt.title"
          :thumbnail="opt.thumbnail"
          :vote-count="uniqueVoters(opt.voteBy).length"
        />
      </div>
    </div>
  </div>
</template>
