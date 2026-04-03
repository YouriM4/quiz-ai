<template>
  <div class="max-w-2xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white">Statistieken</h1>
      <p class="text-gray-400 text-sm mt-1">Jouw quiz prestaties en achievements</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-8">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Overzicht -->
    <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in">
      <div v-if="store.leaderboard.length === 0" class="text-center py-16 text-gray-500">
        <div class="text-5xl mb-4">📊</div>
        <p>Nog geen quizzes gespeeld. Start je eerste quiz!</p>
      </div>

      <template v-else>
        <!-- Overview cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="stat-card">
            <div class="text-2xl font-bold text-indigo-400">{{ store.leaderboard.length }}</div>
            <div class="text-xs text-gray-400 mt-1">Quizzes</div>
          </div>
          <div class="stat-card">
            <div class="text-2xl font-bold text-emerald-400">{{ avgScore }}%</div>
            <div class="text-xs text-gray-400 mt-1">Gemiddeld</div>
          </div>
          <div class="stat-card">
            <div class="text-2xl font-bold text-amber-400">{{ bestScore }}%</div>
            <div class="text-xs text-gray-400 mt-1">Beste</div>
          </div>
          <div class="stat-card">
            <div class="text-2xl font-bold text-sky-400">{{ formatTime(totalTime) }}</div>
            <div class="text-xs text-gray-400 mt-1">Totale tijd</div>
          </div>
        </div>

        <!-- Extra stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="stat-card">
            <div class="text-xl font-bold text-orange-400">
              {{ longestStreak > 0 ? longestStreak + 'x' : '-' }}
            </div>
            <div class="text-xs text-gray-400 mt-1">Langste streak</div>
          </div>
          <div class="stat-card">
            <div class="text-xl font-bold text-purple-400">{{ totalCorrect }}</div>
            <div class="text-xs text-gray-400 mt-1">Totaal goed</div>
          </div>
          <div class="stat-card">
            <div class="text-xl font-bold text-pink-400">{{ totalQuestions }}</div>
            <div class="text-xs text-gray-400 mt-1">Totaal vragen</div>
          </div>
        </div>

        <!-- Recent scores visual -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 class="text-sm font-semibold text-gray-400 mb-4">Laatste {{ recentEntries.length }} quizzes</h3>
          <div class="flex items-end gap-1.5 h-28">
            <div
              v-for="(entry, i) in recentEntries"
              :key="entry.id"
              class="flex-1 rounded-t-md transition-all relative group cursor-default"
              :class="barColor(entry.percentage)"
              :style="{ height: Math.max(8, entry.percentage) + '%' }"
            >
              <!-- Tooltip -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {{ entry.percentage }}% · {{ entry.name }}
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-600">
            <span>Oudste</span>
            <span>Nieuwste</span>
          </div>
        </div>

        <!-- Recent entries list -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <h3 class="text-sm font-semibold text-gray-400 px-5 pt-4 pb-2">Recente quizzes</h3>
          <div
            v-for="entry in recentEntriesReversed"
            :key="entry.id"
            class="px-5 py-3 border-t border-gray-800/50 flex items-center justify-between"
          >
            <div>
              <span class="text-white font-medium text-sm">{{ entry.name }}</span>
              <span class="text-gray-500 text-xs ml-2">{{ entry.date }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-400">{{ entry.score }}/{{ entry.total }}</span>
              <span
                class="font-bold text-sm tabular-nums"
                :class="entry.percentage >= 80 ? 'text-emerald-400' : entry.percentage >= 60 ? 'text-amber-400' : 'text-red-400'"
              >{{ entry.percentage }}%</span>
              <span class="text-xs text-gray-500">{{ formatTime(entry.timeSeconds) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Tab: Achievements -->
    <div v-if="activeTab === 'achievements'" class="animate-fade-in">
      <div class="flex items-center justify-between mb-6">
        <span class="text-sm text-gray-400">
          {{ store.achievementCount }} / {{ achievements.length }} ontgrendeld
        </span>
        <div class="h-2 bg-gray-800 rounded-full w-40 overflow-hidden">
          <div
            class="h-full bg-amber-500 rounded-full transition-all"
            :style="{ width: (store.achievementCount / achievements.length) * 100 + '%' }"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="rounded-2xl p-4 border transition-colors"
          :class="ach.unlocked
            ? 'bg-gray-900 border-amber-800/50'
            : 'bg-gray-900/50 border-gray-800 opacity-50'"
        >
          <div class="flex items-start gap-3">
            <span class="text-3xl" :class="ach.unlocked ? '' : 'grayscale'">{{ ach.icon }}</span>
            <div>
              <p class="font-semibold text-sm" :class="ach.unlocked ? 'text-white' : 'text-gray-500'">
                {{ ach.name }}
              </p>
              <p class="text-xs mt-0.5" :class="ach.unlocked ? 'text-gray-400' : 'text-gray-600'">
                {{ ach.description }}
              </p>
              <p v-if="ach.unlocked" class="text-xs text-amber-500/70 mt-1">
                Ontgrendeld op {{ formatDate(ach.unlockedAt!) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuizStore, ACHIEVEMENT_DEFS } from '@/stores/quiz'

const store = useQuizStore()

const tabs = [
  { id: 'overview',     label: 'Overzicht' },
  { id: 'achievements', label: `Achievements (${store.achievementCount}/${ACHIEVEMENT_DEFS.length})` },
]
const activeTab = ref('overview')

// --- Stats computed ---
const avgScore = computed(() => {
  if (store.leaderboard.length === 0) return 0
  return Math.round(store.leaderboard.reduce((s, e) => s + e.percentage, 0) / store.leaderboard.length)
})
const bestScore = computed(() => {
  if (store.leaderboard.length === 0) return 0
  return Math.max(...store.leaderboard.map(e => e.percentage))
})
const totalTime = computed(() => store.leaderboard.reduce((s, e) => s + e.timeSeconds, 0))
const totalCorrect = computed(() => store.leaderboard.reduce((s, e) => s + e.score, 0))
const totalQuestions = computed(() => store.leaderboard.reduce((s, e) => s + e.total, 0))
const longestStreak = computed(() => {
  return Math.max(0, ...store.leaderboard.map(e => e.maxStreak || 0))
})

const recentEntries = computed(() => store.leaderboard.slice(-20))
const recentEntriesReversed = computed(() => [...store.leaderboard].reverse().slice(0, 10))

// --- Achievements ---
const achievements = computed(() =>
  ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: !!store.unlockedAchievements[def.id],
    unlockedAt: store.unlockedAchievements[def.id] || null,
  }))
)

function barColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500/80'
  if (pct >= 60) return 'bg-amber-500/80'
  return 'bg-red-500/80'
}

function formatTime(s: number) {
  if (s >= 3600) {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60)
    return `${h}u ${m}m`
  }
  const m = Math.floor(s / 60); const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.stat-card { @apply bg-gray-900 border border-gray-800 rounded-xl p-4 text-center; }
</style>
