<template>
  <div class="max-w-xl mx-auto px-4 py-16">
    <div v-if="!store.quizFinished" class="text-center">
      <p class="text-gray-400 mb-4">Geen quiz afgerond.</p>
      <RouterLink to="/" class="text-indigo-400 hover:underline">Terug naar home</RouterLink>
    </div>

    <div v-else class="animate-slide-up text-center">
      <div class="text-7xl mb-4">{{ emoji }}</div>
      <h1 class="text-3xl font-bold text-white mb-2">{{ message }}</h1>
      <p class="text-gray-400 mb-8">{{ store.playerName }}</p>

      <!-- Score circle -->
      <div class="relative w-40 h-40 mx-auto mb-8">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" stroke-width="2.5" />
          <circle cx="18" cy="18" r="15.9" fill="none" :stroke="scoreColor" stroke-width="2.5"
            stroke-linecap="round" :stroke-dasharray="`${percentage} ${100 - percentage}`"
            class="transition-all duration-1000" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold text-white">{{ percentage }}%</span>
          <span class="text-sm text-gray-400">{{ store.score }}/{{ store.totalQuestions }}</span>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-4 gap-3 mb-6">
        <div class="stat-card">
          <div class="text-xl font-bold text-emerald-400">{{ store.score }}</div>
          <div class="text-xs text-gray-400">Goed</div>
        </div>
        <div class="stat-card">
          <div class="text-xl font-bold text-red-400">{{ wrongCount }}</div>
          <div class="text-xs text-gray-400">Fout</div>
        </div>
        <div class="stat-card">
          <div class="text-xl font-bold text-orange-400">
            {{ store.maxStreak > 0 ? store.maxStreak + 'x' : '-' }}
          </div>
          <div class="text-xs text-gray-400">Streak</div>
        </div>
        <div class="stat-card">
          <div class="text-xl font-bold text-sky-400">{{ formatTime(elapsedSeconds) }}</div>
          <div class="text-xs text-gray-400">Tijd</div>
        </div>
      </div>

      <!-- New achievements -->
      <div v-if="store.newlyUnlocked.length > 0" class="mb-6 animate-bounce-in">
        <h3 class="text-sm font-semibold text-amber-400 mb-3">Nieuwe prestaties ontgrendeld!</h3>
        <div class="flex flex-wrap gap-2 justify-center">
          <div
            v-for="id in store.newlyUnlocked"
            :key="id"
            class="flex items-center gap-2 bg-amber-900/30 border border-amber-700 rounded-xl px-4 py-2"
          >
            <span class="text-2xl">{{ getAchievementIcon(id) }}</span>
            <div class="text-left">
              <p class="text-sm font-semibold text-amber-200">{{ getAchievementName(id) }}</p>
              <p class="text-xs text-amber-400/70">{{ getAchievementDesc(id) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Answers review -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left mb-8">
        <h2 class="font-semibold text-gray-300 mb-4">Antwoorden</h2>
        <div class="space-y-3">
          <div v-for="(q, i) in store.activeQuestions" :key="q.id" class="flex items-start gap-3">
            <span class="mt-0.5 flex-shrink-0 text-base">
              <span v-if="store.answers[i] === q.correctIndex" class="text-emerald-400">✓</span>
              <span v-else-if="store.answers[i] === -2" class="text-sky-400" title="Overgeslagen">⏭</span>
              <span v-else-if="store.answers[i] === -1" class="text-amber-400" title="Tijd op">⏱</span>
              <span v-else class="text-red-400">✗</span>
            </span>
            <div class="min-w-0">
              <p class="text-sm text-gray-300">{{ q.question }}</p>
              <p v-if="store.answers[i] !== q.correctIndex" class="text-xs text-emerald-400 mt-0.5">
                Juist: {{ q.options[q.correctIndex] }}
              </p>
              <p v-if="store.answers[i] === -2" class="text-xs text-sky-400/70 mt-0.5">Overgeslagen</p>
              <p v-else-if="store.answers[i] === -1" class="text-xs text-amber-400/70 mt-0.5">Tijd verlopen</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button @click="playAgain"
          class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl transition-all">
          Opnieuw spelen
        </button>
        <RouterLink to="/leaderboard"
          class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 active:scale-95 text-white font-semibold rounded-xl transition-all text-center">
          Leaderboard
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useQuizStore, ACHIEVEMENT_DEFS } from '@/stores/quiz'
import confetti from 'canvas-confetti'

const store = useQuizStore()
const router = useRouter()

const percentage = computed(() =>
  store.totalQuestions > 0 ? Math.round((store.score / store.totalQuestions) * 100) : 0
)
const wrongCount = computed(() =>
  store.totalQuestions - store.score - store.skippedCount
)
const elapsedSeconds = computed(() => {
  const last = store.leaderboard.find(e => e.id === store.leaderboard[store.leaderboard.length - 1]?.id)
  return last?.timeSeconds ?? 0
})

const emoji   = computed(() => {
  if (percentage.value === 100) return '🏆'
  if (percentage.value >= 80)  return '🌟'
  if (percentage.value >= 60)  return '👍'
  if (percentage.value >= 40)  return '😅'
  return '💪'
})
const message = computed(() => {
  if (percentage.value === 100) return 'Perfect score!'
  if (percentage.value >= 80)  return 'Uitstekend!'
  if (percentage.value >= 60)  return 'Goed gedaan!'
  if (percentage.value >= 40)  return 'Aardig geprobeerd!'
  return 'Volgende keer beter!'
})
const scoreColor = computed(() => {
  if (percentage.value >= 80) return '#10b981'
  if (percentage.value >= 60) return '#f59e0b'
  return '#ef4444'
})

function formatTime(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function getAchievementIcon(id: string) { return ACHIEVEMENT_DEFS.find(a => a.id === id)?.icon ?? '🏆' }
function getAchievementName(id: string) { return ACHIEVEMENT_DEFS.find(a => a.id === id)?.name ?? '' }
function getAchievementDesc(id: string) { return ACHIEVEMENT_DEFS.find(a => a.id === id)?.description ?? '' }

function playAgain() { store.resetQuiz(); router.push('/') }

onMounted(() => {
  if (!store.quizFinished) return
  if (percentage.value >= 80) {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
    if (percentage.value === 100) {
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } }), 300)
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 500)
    }
  }
})
</script>

<style scoped>
.stat-card { @apply bg-gray-900 border border-gray-800 rounded-xl p-3; }
</style>
