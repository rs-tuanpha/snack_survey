export interface ITopic {
  id: string
  name: string
  description: string
  status: 'open' | 'close'
  timeline: string
}
