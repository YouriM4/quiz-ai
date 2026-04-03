<template>
  <div class="max-w-2xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white">Leaderboard</h1>
        <p class="text-gray-400 text-sm mt-1">Top spelers van alle tijden</p>
      </div>
      <button
        v-if="store.leaderboard.length > 0"
        @click="confirmClear"
        class="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition-colors"
      >
        Wissen
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="store.leaderboard.length === 0" class="text-center py-20">
      <div class="text-5xl mb-4">🏆</div>
      <p class="text-gray-400">Nog geen scores. Speel een quiz om hier te verschijnen!</p>
      <RouterLink to="/" class="mt-4 inline-block text-indigo-400 hover:underline">Start een quiz</RouterLink>
    </div>

    <!-- Top 3 podium -->
    <div v-else>
      <div v-if="store.leaderboard.length >= 3" class="grid grid-cols-3 gap-3 mb-8 items-end">
        <!-- 2nd place -->
        <div class="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center">
          <div class="text-3xl mb-2">🥈</div>
          <div class="font-semibold text-white truncate">{{ store.leaderboard[1].name }}</div>
          <div class="text-2xl font-bold text-gray-300 mt-1">{{ store.leaderboard[1].percentage }}%</div>
          <div class="text-xs text-gray-500 mt-1">{{ store.leaderboard[1].score }}/{{ store.leaderboard[1].total }}</div>
        </div>
        <!-- 1st place -->
        <div class="bg-gradient-to-b from-amber-900/40 to-gray-900 border border-amber-700/50 rounded-2xl p-4 text-center -mt-4">
          <div class="text-4xl mb-2">🥇</div>
          <div class="font-bold text-white truncate">{{ store.leaderboard[0].name }}</div>
          <div class="text-3xl font-bold text-amber-400 mt-1">{{ store.leaderboard[0].percentage }}%</div>
          <div class="text-xs text-gray-400 mt-1">{{ store.leaderboard[0].score }}/{{ store.leaderboard[0].total }}</div>
        </div>
        <!-- 3rd place -->
        <div class="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center">
          <div class="text-3xl mb-2">🥉</div>
          <div class="font-semibold text-white truncate">{{ store.leaderboard[2].name }}</div>
          <div class="text-2xl font-bold text-orange-300 mt-1">{{ store.leaderboard[2].percentage }}%</div>
          <div class="text-xs text-gray-500 mt-1">{{ store.leaderboard[2].score }}/{{ store.leaderboard[2].total }}</div>
        </div>
      </div>

      <!-- Full list -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-800 grid grid-cols-12 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span class="col-span-1">#</span>
          <span class="col-span-4">Naam</span>
          <span class="col-span-2 text-center">Score</span>
          <span class="col-span-2 text-center">%</span>
          <span class="col-span-2 text-center">Tijd</span>
          <span class="col-span-1 text-right">Datum</span>
        </div>
        <div
          v-for="(entry, idx) in store.leaderboard"
          :key="entry.id"
          class="px-5 py-3 grid grid-cols-12 items-center border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
          :class="idx < 3 ? 'bg-gray-800/10' : ''"
        >
          <span class="col-span-1 font-bold" :class="rankColor(idx)">{{ idx + 1 }}</span>
          <span class="col-span-4 text-white font-medium truncate">{{ entry.name }}</span>
          <span class="col-span-2 text-center text-gray-300">{{ entry.score }}/{{ entry.total }}</span>
          <span class="col-span-2 text-center font-semibold" :class="percentColor(entry.percentage)">
            {{ entry.percentage }}%
          </span>
          <span class="col-span-2 text-center text-gray-400 text-sm">{{ formatTime(entry.timeSeconds) }}</span>
          <span class="col-span-1 text-right text-gray-500 text-xs">{{ entry.date }}</span>
        </div>
      </div>
    </div>

    <!-- Confirm modal -->
    <div v-if="showConfirm" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full animate-bounce-in text-center">
        <div class="text-4xl mb-4">⚠️</div>
        <h3 class="text-lg font-bold text-white mb-2">Leaderboard wissen?</h3>
        <p class="text-gray-400 text-sm mb-6">Dit verwijdert alle scores permanent.</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
            Annuleren
          </button>
          <button @click="doClear" class="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors">
            Wissen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()
const showConfirm = ref(false)

function confirmClear() { showConfirm.value = true }
function doClear() {
  store.clearLeaderboard()
  showConfirm.value = false
}

function rankColor(idx: number) {
  if (idx === 0) return 'text-amber-400'
  if (idx === 1) return 'text-gray-300'
  if (idx === 2) return 'text-orange-400'
  return 'text-gray-500'
}

function percentColor(pct: number) {
  if (pct >= 80) return 'text-emerald-400'
  if (pct >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}
</script>
