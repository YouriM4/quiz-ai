<template>
  <div class="max-w-2xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white">Instellingen</h1>
      <p class="text-gray-400 text-sm mt-1">Pas de quiz aan naar jouw voorkeur</p>
    </div>

    <div class="space-y-4">

      <!-- Quiz gedrag -->
      <section class="card">
        <h2 class="section-title">Quiz gedrag</h2>

        <!-- Shuffle -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">🔀</span>
            <div>
              <p class="setting-label">Vragen door elkaar</p>
              <p class="setting-desc">Willekeurige volgorde bij elke quiz</p>
            </div>
          </div>
          <div class="toggle" :class="store.shuffleEnabled ? 'toggle-on' : 'toggle-off'" @click="store.setShuffleEnabled(!store.shuffleEnabled)">
            <div class="toggle-thumb" :class="store.shuffleEnabled ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </div>

        <!-- Max vragen -->
        <div class="setting-row flex-col !items-start gap-3">
          <div class="setting-info w-full">
            <span class="setting-icon">🔢</span>
            <div>
              <p class="setting-label">Aantal vragen per quiz</p>
              <p class="setting-desc">
                {{ store.maxQuestions === 0 ? 'Alle beschikbare vragen worden gespeeld' : `Quiz stopt na ${store.maxQuestions} vragen` }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pl-9">
            <button
              v-for="preset in questionPresets"
              :key="preset.value"
              @click="store.setMaxQuestions(preset.value)"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
              :class="store.maxQuestions === preset.value
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'"
            >
              {{ preset.label }}
            </button>
            <div class="flex items-center gap-2 ml-1">
              <span class="text-xs text-gray-500">Eigen:</span>
              <input
                type="number" min="1" :max="store.questions.length"
                :value="store.maxQuestions === 0 ? '' : store.maxQuestions"
                @change="onMaxQuestionsChange"
                placeholder="Getal"
                class="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <!-- Moeilijkheidsfilter -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">🎯</span>
            <div>
              <p class="setting-label">Moeilijkheidsfilter</p>
              <p class="setting-desc">Speel alleen vragen van een bepaalde moeilijkheid</p>
            </div>
          </div>
          <div class="flex gap-1.5 flex-wrap justify-end">
            <button
              v-for="opt in difficultyOptions"
              :key="opt.value"
              @click="store.setDifficultyFilter(opt.value)"
              class="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors"
              :class="store.difficultyFilter === opt.value ? opt.activeClass : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Timer -->
      <section class="card">
        <h2 class="section-title">Timer</h2>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">⏱️</span>
            <div>
              <p class="setting-label">Tijdslimiet per vraag</p>
              <p class="setting-desc">Automatisch doorgaan als de tijd op is (als fout gerekend)</p>
            </div>
          </div>
          <div class="toggle" :class="store.timerEnabled ? 'toggle-on' : 'toggle-off'" @click="store.setTimerEnabled(!store.timerEnabled)">
            <div class="toggle-thumb" :class="store.timerEnabled ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </div>

        <div v-if="store.timerEnabled" class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">⏳</span>
            <div>
              <p class="setting-label">Seconden per vraag</p>
              <p class="setting-desc">{{ store.timePerQuestion }} seconden</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-400 w-8 text-right tabular-nums">{{ store.timePerQuestion }}s</span>
            <input
              type="range" min="5" max="60" step="5"
              :value="store.timePerQuestion"
              @change="onTimePerQuestionChange"
              class="w-32 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </section>

      <!-- Jokers -->
      <section class="card">
        <h2 class="section-title">Jokers</h2>

        <!-- 50/50 -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">✂️</span>
            <div>
              <p class="setting-label">50/50 jokers</p>
              <p class="setting-desc">Elimineer 2 foute antwoorden</p>
            </div>
          </div>
          <div class="counter">
            <button @click="store.setJokerCount(Math.max(0, store.jokerCount - 1))" class="counter-btn">−</button>
            <span class="counter-val">{{ store.jokerCount }}</span>
            <button @click="store.setJokerCount(Math.min(5, store.jokerCount + 1))" class="counter-btn">+</button>
          </div>
        </div>

        <!-- Skip -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">⏭️</span>
            <div>
              <p class="setting-label">Skip jokers</p>
              <p class="setting-desc">Sla een vraag over zonder gevolgen voor je streak</p>
            </div>
          </div>
          <div class="counter">
            <button @click="store.setSkipCount(Math.max(0, store.skipCount - 1))" class="counter-btn">−</button>
            <span class="counter-val">{{ store.skipCount }}</span>
            <button @click="store.setSkipCount(Math.min(5, store.skipCount + 1))" class="counter-btn">+</button>
          </div>
        </div>

        <!-- Extra time -->
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">⏱️</span>
            <div>
              <p class="setting-label">Extra Tijd jokers</p>
              <p class="setting-desc">Voeg 15 seconden toe aan de timer</p>
            </div>
          </div>
          <div class="counter">
            <button @click="store.setExtraTimeCount(Math.max(0, store.extraTimeCount - 1))" class="counter-btn">−</button>
            <span class="counter-val">{{ store.extraTimeCount }}</span>
            <button @click="store.setExtraTimeCount(Math.min(5, store.extraTimeCount + 1))" class="counter-btn">+</button>
          </div>
        </div>
      </section>

      <!-- Gegevens -->
      <section class="card">
        <h2 class="section-title">Gegevens</h2>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">🏆</span>
            <div>
              <p class="setting-label">Leaderboard wissen</p>
              <p class="setting-desc">{{ store.leaderboard.length }} score{{ store.leaderboard.length !== 1 ? 's' : '' }} opgeslagen</p>
            </div>
          </div>
          <button
            @click="confirmAction('leaderboard')"
            :disabled="store.leaderboard.length === 0"
            class="px-4 py-1.5 rounded-lg text-sm font-medium border border-red-900 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Wissen
          </button>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">📋</span>
            <div>
              <p class="setting-label">Vragen herstellen</p>
              <p class="setting-desc">{{ store.questions.length }} vragen opgeslagen — terug naar standaard</p>
            </div>
          </div>
          <button
            @click="confirmAction('questions')"
            class="px-4 py-1.5 rounded-lg text-sm font-medium border border-amber-900 text-amber-400 hover:bg-amber-900/30 transition-colors"
          >
            Herstellen
          </button>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-icon">⚙️</span>
            <div>
              <p class="setting-label">Instellingen resetten</p>
              <p class="setting-desc">Alle instellingen terug naar standaard</p>
            </div>
          </div>
          <button
            @click="confirmAction('settings')"
            class="px-4 py-1.5 rounded-lg text-sm font-medium border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            Resetten
          </button>
        </div>
      </section>

      <!-- Info -->
      <div class="bg-indigo-950/40 border border-indigo-900/50 rounded-2xl px-5 py-4 flex items-start gap-3 text-sm text-indigo-300">
        <span class="text-lg flex-shrink-0 mt-0.5">💡</span>
        <span>
          Categorie-filter en spelersnaam stel je in op de
          <RouterLink to="/" class="underline hover:text-white">homepagina</RouterLink>
          vlak voor je start.
        </span>
      </div>

    </div>

    <!-- Confirm modal -->
    <Teleport to="body">
      <div v-if="confirmTarget" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full animate-bounce-in text-center">
          <div class="text-4xl mb-4">{{ confirmMeta.icon }}</div>
          <h3 class="text-lg font-bold text-white mb-2">{{ confirmMeta.title }}</h3>
          <p class="text-gray-400 text-sm mb-6">{{ confirmMeta.body }}</p>
          <div class="flex gap-3">
            <button @click="confirmTarget = null" class="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
              Annuleren
            </button>
            <button @click="doConfirm" class="flex-1 py-2.5 font-semibold rounded-xl transition-colors" :class="confirmMeta.btnClass">
              Bevestigen
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()

const questionPresets = [
  { value: 5,  label: '5' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
  { value: 0,  label: 'Alle' },
]

const difficultyOptions: { value: '' | 'easy' | 'medium' | 'hard'; label: string; activeClass: string }[] = [
  { value: '',       label: 'Alle',      activeClass: 'bg-gray-600 border-gray-500 text-white' },
  { value: 'easy',   label: 'Makkelijk', activeClass: 'bg-emerald-700 border-emerald-600 text-white' },
  { value: 'medium', label: 'Gemiddeld', activeClass: 'bg-amber-700 border-amber-600 text-white' },
  { value: 'hard',   label: 'Moeilijk',  activeClass: 'bg-red-700 border-red-600 text-white' },
]

function onMaxQuestionsChange(e: Event) {
  store.setMaxQuestions(Number((e.target as HTMLInputElement).value))
}

function onTimePerQuestionChange(e: Event) {
  store.setTimePerQuestion(Number((e.target as HTMLInputElement).value))
}

type ConfirmTarget = 'leaderboard' | 'questions' | 'settings' | null
const confirmTarget = ref<ConfirmTarget>(null)

const confirmMeta = computed(() => {
  if (confirmTarget.value === 'leaderboard') return {
    icon: '🏆', title: 'Leaderboard wissen?',
    body: 'Alle scores worden permanent verwijderd.',
    btnClass: 'bg-red-600 hover:bg-red-500 text-white',
  }
  if (confirmTarget.value === 'questions') return {
    icon: '📋', title: 'Vragen herstellen?',
    body: 'Alle aangepaste vragen worden vervangen door de standaard vragen.',
    btnClass: 'bg-amber-600 hover:bg-amber-500 text-white',
  }
  return {
    icon: '⚙️', title: 'Instellingen resetten?',
    body: 'Alle instellingen gaan terug naar hun standaardwaarden.',
    btnClass: 'bg-gray-600 hover:bg-gray-500 text-white',
  }
})

function confirmAction(target: ConfirmTarget) {
  confirmTarget.value = target
}

function doConfirm() {
  if (confirmTarget.value === 'leaderboard') store.clearLeaderboard()
  if (confirmTarget.value === 'questions')   store.resetQuestionsToDefault()
  if (confirmTarget.value === 'settings')    store.resetSettings()
  confirmTarget.value = null
}
</script>

<style scoped>
.card         { @apply bg-gray-900 border border-gray-800 rounded-2xl px-5 py-1; }
.section-title { @apply text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4 pb-2; }
.setting-row  { @apply flex items-center justify-between gap-4 py-4 border-b border-gray-800 last:border-0; }
.setting-info { @apply flex items-start gap-3 min-w-0 flex-1; }
.setting-icon { @apply text-xl flex-shrink-0 mt-0.5; }
.setting-label { @apply text-sm font-medium text-white; }
.setting-desc  { @apply text-xs text-gray-500 mt-0.5; }
.toggle       { @apply w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0; }
.toggle-on    { @apply bg-indigo-600; }
.toggle-off   { @apply bg-gray-700; }
.toggle-thumb { @apply w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5; }
.counter     { @apply flex items-center gap-2; }
.counter-btn { @apply w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors leading-none; }
.counter-val { @apply w-6 text-center text-white font-bold; }
</style>
