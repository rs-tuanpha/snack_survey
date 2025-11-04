<template>
  <v-dialog :model-value="dialogValue" @update:model-value="handleDialogUpdate" persistent width="auto">
    <v-card min-height="120">
      <v-card-text>{{ text }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          class="text-none"
          color="red-darken-1"
          variant="flat"
          @click="handleCancel"
          :disabled="isLoading"
        >
          Không
        </v-btn>
        <v-btn
          class="text-none"
          color="blue-darken-2"
          variant="flat"
          @click="handleConfirm"
          :loading="isLoading"
          :disabled="isLoading"
        >
          Có
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: boolean
  text?: string
  isLoading?: boolean
}>(), {
  modelValue: false,
  text: 'Bạn có muốn xóa topic không?',
  isLoading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

// Internal state for uncontrolled mode
const internalIsOpen = ref(false)

// Computed to determine if we're in controlled mode
const isControlled = computed(() => props.modelValue !== undefined)

// Dialog value: use modelValue if controlled, otherwise use internal state
const dialogValue = computed({
  get: () => isControlled.value ? props.modelValue! : internalIsOpen.value,
  set: (value: boolean) => {
    if (isControlled.value) {
      emit('update:modelValue', value)
    } else {
      internalIsOpen.value = value
    }
  }
})

// Handle dialog update
const handleDialogUpdate = (value: boolean) => {
  dialogValue.value = value
  if (!value) {
    emit('cancel')
  }
}

// Handle confirm button
const handleConfirm = () => {
  emit('confirm')
}

// Handle cancel button
const handleCancel = () => {
  dialogValue.value = false
  emit('cancel')
}
</script>

