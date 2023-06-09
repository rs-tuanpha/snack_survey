import { createRouter, createWebHashHistory } from 'vue-router'
import checkAuth from './auth.router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/layouts/BasicLayout/index.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/Home/index.vue')
      },
      {
        path: process.env.VUE_APP_ADMIN_PATH!,
        name: 'topicAmin',
        component: () => import('@/views/Admin/index.vue')
      },
      {
        path: '/vote-topic/:id',
        name: 'topicVote',
        component: () => import('@/views/Topic/index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
  // Always scroll to top
  scrollBehavior() {
    return { top: 0 }
  }
})

/**
 * Handle check authencation
 */
checkAuth(router)

export default router
