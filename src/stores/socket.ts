import { defineStore } from 'pinia'
import { io, Socket } from 'socket.io-client'
import type { IOptionModel } from '@/core/interfaces/model/option'

interface ISocketState {
  socket: Socket | null
  connected: boolean
  currentTopic: string | null
}

export interface VoteUpdateData {
  topic_id: string
  option_id: string
  count: number
  user_id: string
  username: string
  action: 'vote' | 'unvote'
}

export interface NewOptionData {
  option: IOptionModel
}

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8000'

export const useSocketStore = defineStore('socket', {
  state: (): ISocketState => ({
    socket: null,
    connected: false,
    currentTopic: null
  }),

  actions: {
    connect() {
      if (this.socket) return

      this.socket = io(URL)

      this.socket.on('connect', () => {
        this.connected = true
        console.log('Socket connected')
      })

      this.socket.on('disconnect', () => {
        this.connected = false
        this.currentTopic = null
        console.log('Socket disconnected')
      })

      // Listen for new options
      this.socket.on('new_option', (data: IOptionModel) => {
        // Handle new option event
        console.log('New option received:', data)
      })

      // Listen for vote updates
      this.socket.on('vote_option', (data: VoteUpdateData) => {
        // Handle vote update event
        console.log('Vote update received:', data)
      })
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
        this.currentTopic = null
      }
    },

    joinTopic(topicId: string) {
      if (!this.socket || !this.connected) return

      this.socket.emit('join_topic', {
        "topicId": topicId
    })
      this.currentTopic = topicId
      console.log('Joined topic:', topicId)
    },

    leaveTopic() {
      if (!this.socket || !this.connected || !this.currentTopic) return

      this.socket.emit('leave_topic', this.currentTopic)
      this.currentTopic = null
      console.log('Leave topic')
    }
  }
})
