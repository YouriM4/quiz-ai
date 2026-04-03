<template>
  <div class="max-w-xl mx-auto px-4 py-12">
    <div class="animate-fade-in text-center mb-8">
      <div class="text-7xl mb-4">🎯</div>
      <h1 class="text-4xl font-bold text-white mb-2">Quiz App</h1>
      <p class="text-gray-400">Test je kennis!</p>
    </div>

    <div class="bg-gray-900 rounded-2xl p-7 border border-gray-800 space-y-6">

      <!-- Naam -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1.5">Jouw naam</label>
        <input
          v-model="name"
          type="text"
          placeholder="Voer je naam in..."
          maxlength="30"
          class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          @keyup.enter="start"
        />
      </div>

      <!-- Categorie multi-select -->
      <div v-if="store.availableCategories.length > 0">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-300">Categorieën</label>
          <button
            @click="store.selectAllCategories()"
            class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {{ store.selectedCategories.length === 0 ? 'Alle geselecteerd' : 'Alles selecteren' }}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="cat in store.availableCategories"
            :key="cat"
            @click="store.toggleCategory(cat)"
            class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left"
            :class="isCatActive(cat)
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'"
          >
            <span>{{ cat }}</span>
            <span class="text-xs opacity-60">{{ categoryCount(cat) }}</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          <template v-if="store.selectedCategories.length === 0">
            Alle categorieën geselecteerd
          </template>
          <template v-else>
            {{ store.selectedCategories.length }} categorie{{ store.selectedCategories.length !== 1 ? 'ën' : '' }} geselecteerd
          </template>
        </p>
      </div>

      <!-- Quiz preview stats -->
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-gray-800 rounded-xl p-3">
          <div class="text-2xl font-bold text-indigo-400">{{ store.previewCount }}</div>
          <div class="text-xs text-gray-400 mt-1">Vragen</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-3">
          <div class="text-2xl font-bold text-emerald-400">{{ store.leaderboard.length }}</div>
          <div class="text-xs text-gray-400 mt-1">Spelers</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-3">
          <div class="text-2xl font-bold text-amber-400">
            {{ store.leaderboard.length > 0 ? store.leaderboard[0].percentage + '%' : '-' }}
          </div>
          <div class="text-xs text-gray-400 mt-1">Topscore</div>
        </div>
      </div>

      <!-- Active settings badges -->
      <div class="flex flex-wrap gap-2">
        <span v-if="store.timerEnabled"       class="badge">⏱️ {{ store.timePerQuestion }}s</span>
        <span v-if="store.shuffleEnabled"     class="badge">🔀 Shuffle</span>
        <span v-if="store.maxQuestions > 0"   class="badge">🔢 Max {{ store.maxQuestions }}</span>
        <span v-if="store.difficultyFilter"   class="badge">🎯 {{ difficultyLabel }}</span>
        <span v-if="store.jokerCount > 0"     class="badge">✂️ {{ store.jokerCount }}x joker</span>
        <RouterLink to="/settings" class="badge hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
          ⚙️ Instellingen
        </RouterLink>
      </div>

      <button
        @click="start"
        :disabled="!name.trim() || store.previewCount === 0"
        class="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-base"
        :class="name.trim() && store.previewCount > 0
          ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
          : 'bg-gray-700 cursor-not-allowed opacity-50'"
      >
        {{ store.previewCount === 0 ? 'Geen vragen voor deze filters' : `Start quiz (${store.previewCount} vragen)` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()
const router = useRouter()
const name = ref('')

const difficultyLabel = computed(() => {
  const map: Record<string, string> = { easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Moeilijk' }
  return map[store.difficultyFilter] ?? ''
})

function isCatActive(cat: string) {
  return store.selectedCategories.length === 0 || store.selectedCategories.includes(cat)
}

function categoryCount(cat: string) {
  return store.questions.filter(q => q.category === cat).length
}

function start() {
  if (!name.value.trim() || store.previewCount === 0) return
  store.startQuiz(name.value.trim())
  router.push('/quiz')
}
</script>

<style scoped>
.badge { @apply text-xs px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg; }
</style>
