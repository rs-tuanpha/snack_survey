import { createRouter, createWebHashHistory } from 'vue-router'
import checkAuth from './auth.router'

const routes = [
  {
    path: '/',
    name: 'app',
    component: () => import('@/layouts/BasicLayout/index.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/Home/index.vue')
      },
      {
        path: '/change_password',
        name: 'changePassword',
        component: () => import('@/views/User/ProfilePage.vue')
      },
      {
        path: process.env.VUE_APP_ADMIN_PATH!,
        name: 'topicAmin',
        component: () => import('@/views/Admin/TopicManagePage.vue')
      },
      {
        path: '/management/users',
        name: 'userManagment',
        component: () => import('@/views/Admin/UserManagePage.vue')
      },
      {
        path: '/vote-topic/:id',
        name: 'topicVote',
        component: () => import('@/views/Topic/index.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/LoginPage.vue')
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
