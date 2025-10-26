import { reactive, readonly } from 'vue'

export interface SnackbarMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
  timestamp: number
}

export interface SnackbarState {
  messages: SnackbarMessage[]
  isVisible: boolean
  currentMessage: SnackbarMessage | null
}

const state = reactive<SnackbarState>({
  messages: [],
  isVisible: false,
  currentMessage: null
})

let messageIdCounter = 0

export function useSnackbar() {
  const generateId = () => `snackbar-${++messageIdCounter}-${Date.now()}`

  const addMessage = (message: string, type: SnackbarMessage['type'], duration: number = 3000) => {
    const newMessage: SnackbarMessage = {
      id: generateId(),
      message,
      type,
      duration,
      timestamp: Date.now()
    }

    state.messages.push(newMessage)
    
    // Show immediately if no current message
    if (!state.currentMessage) {
      showNextMessage()
    }
  }

  const showNextMessage = () => {
    if (state.messages.length === 0) {
      state.isVisible = false
      state.currentMessage = null
      return
    }

    const nextMessage = state.messages.shift()!
    state.currentMessage = nextMessage
    state.isVisible = true

    // Auto dismiss after duration
    setTimeout(() => {
      dismissCurrent()
    }, nextMessage.duration)
  }

  const dismissCurrent = () => {
    state.isVisible = false
    state.currentMessage = null
    
    // Show next message after a short delay
    setTimeout(() => {
      showNextMessage()
    }, 100)
  }

  const clearAll = () => {
    state.messages = []
    state.isVisible = false
    state.currentMessage = null
  }

  return {
    // State
    state: readonly(state),
    
    // Methods
    showSuccess: (message: string, duration?: number) => 
      addMessage(message, 'success', duration),
    
    showError: (message: string, duration?: number) => 
      addMessage(message, 'error', duration),
    
    showWarning: (message: string, duration?: number) => 
      addMessage(message, 'warning', duration),
    
    showInfo: (message: string, duration?: number) => 
      addMessage(message, 'info', duration),
    
    dismiss: dismissCurrent,
    clearAll
  }
}

// Export singleton instance for global use
export const globalSnackbar = useSnackbar()
