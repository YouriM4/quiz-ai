import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import QuizView from '@/views/QuizView.vue'
import ResultView from '@/views/ResultView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import ManageView from '@/views/ManageView.vue'
import SettingsView from '@/views/SettingsView.vue'
import StatsView from '@/views/StatsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',            name: 'home',        component: HomeView },
    { path: '/quiz',        name: 'quiz',        component: QuizView },
    { path: '/result',      name: 'result',      component: ResultView },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/manage',      name: 'manage',      component: ManageView },
    { path: '/settings',    name: 'settings',    component: SettingsView },
    { path: '/stats',       name: 'stats',       component: StatsView },
  ]
})

export default router
