<template>
  <v-dialog v-model="dialogVisible" persistent width="auto">
    <v-card min-height="120">
      <v-card-text> {{ messages }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn class="text-none" color="red-darken-1" variant="flat" @click="emits('onCancel')"
          >Không</v-btn
        >
        <v-btn class="text-none" color="blue-darken-2" variant="flat" @click="emits('onOk')"
          >Có</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{
  open: boolean
  messages: string
}>()
const emits = defineEmits(['onOk', 'onCancel'])
const dialogVisible = ref<boolean>(props.open)
watch(
  () => props.open,
  (val) => {
    dialogVisible.value = val
  }
)
</script>
