<script setup lang="ts">
import type { IUser } from '@/core/interfaces/model/user'
import UiAvatar from './UiAvatar.vue'

withDefaults(
  defineProps<{
    users?: IUser[]
    max?: number
    title?: string
  }>(),
  {
    users: () => [],
    max: 3
  }
)

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <div
    v-if="users.length"
    class="flex -space-x-2 shrink-0 cursor-pointer"
    :title="title || `${users.length} người`"
    @click.stop="$emit('click')"
  >
    <UiAvatar
      v-for="user in users.slice(0, max)"
      :key="user.id || user.username"
      :src="user.avatar"
      :fallback="user.username"
      size="sm"
      class="!w-6 !h-6"
    />
  </div>
</template>
