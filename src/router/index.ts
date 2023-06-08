import { createRouter, createWebHistory } from 'vue-router'
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
        path: '/topic/:id',
        name: 'topic',
        component: () => import('@/views/Topic/index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
