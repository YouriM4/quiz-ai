<template>
  <div class="max-w-2xl mx-auto px-4 py-10">
    <div v-if="!store.quizStarted" class="text-center py-20">
      <p class="text-gray-400 mb-4">Geen actieve quiz gevonden.</p>
      <RouterLink to="/" class="text-indigo-400 hover:underline">Terug naar home</RouterLink>
    </div>

    <div v-else-if="store.quizFinished" class="text-center py-20">
      <RouterLink to="/result" class="text-indigo-400 hover:underline">Bekijk resultaat</RouterLink>
    </div>

    <div v-else class="animate-fade-in">
      <!-- Header row -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-gray-400">
          Vraag <span class="text-white font-semibold">{{ store.currentIndex + 1 }}</span> / {{ store.totalQuestions }}
        </span>
        <span
          v-if="store.currentStreak >= 2"
          class="flex items-center gap-1 text-sm font-bold text-orange-400 animate-bounce-in"
        >
          🔥 {{ store.currentStreak }}x streak
        </span>
        <span class="text-sm text-gray-400">
          Score: <span class="text-emerald-400 font-semibold">{{ store.score }}</span>
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-1.5 bg-gray-800 rounded-full mb-4 overflow-hidden">
        <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" :style="{ width: store.progress + '%' }" />
      </div>

      <!-- Timer bar -->
      <div v-if="store.timerEnabled" class="mb-6">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-gray-500">Tijd over</span>
          <span
            class="text-xs font-bold tabular-nums transition-colors"
            :class="timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-gray-400'"
          >{{ timeLeft }}s</span>
        </div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-1000 linear"
            :class="timerBarColor"
            :style="{ width: timerPercent + '%' }"
          />
        </div>
      </div>

      <!-- Question card -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-7 mb-5" :key="store.currentIndex">
        <div class="flex flex-wrap gap-2 mb-5">
          <span v-if="store.currentQuestion.category"
            class="text-xs px-3 py-1 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-800">
            {{ store.currentQuestion.category }}
          </span>
          <span v-if="store.currentQuestion.difficulty"
            class="text-xs px-3 py-1 rounded-full border" :class="difficultyClass">
            {{ store.currentQuestion.difficulty }}
          </span>
        </div>

        <h2 class="text-xl font-semibold text-white mb-7 leading-relaxed">
          {{ store.currentQuestion.question }}
        </h2>

        <div class="grid gap-3">
          <button
            v-for="(option, idx) in store.currentQuestion.options"
            :key="idx"
            @click="selectAnswer(idx)"
            :disabled="answered || store.eliminatedOptions.includes(idx)"
            class="w-full text-left px-5 py-4 rounded-xl border font-medium transition-all duration-200"
            :class="getOptionClass(idx)"
          >
            <span class="inline-flex items-center gap-3">
              <span class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                :class="getLetterClass(idx)">
                {{ letters[idx] }}
              </span>
              <span :class="store.eliminatedOptions.includes(idx) ? 'line-through text-gray-600' : ''">
                {{ option }}
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- Bottom: jokers + next -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <!-- Jokers row -->
        <div class="flex gap-2 flex-wrap">
          <!-- 50/50 -->
          <button
            v-if="store.jokerAvailable && !answered"
            @click="store.useJoker()"
            class="joker-btn border-amber-800 bg-amber-900/40 hover:bg-amber-900/70 text-amber-300"
            title="Elimineer 2 foute antwoorden"
          >
            ✂️ 50/50
            <span v-if="store.jokersLeft > 1" class="text-xs opacity-70">({{ store.jokersLeft }})</span>
          </button>

          <!-- Skip -->
          <button
            v-if="store.skipAvailable && !answered"
            @click="doSkip"
            class="joker-btn border-sky-800 bg-sky-900/40 hover:bg-sky-900/70 text-sky-300"
            title="Sla deze vraag over"
          >
            ⏭️ Skip
            <span v-if="store.skipsLeft > 1" class="text-xs opacity-70">({{ store.skipsLeft }})</span>
          </button>

          <!-- Extra time -->
          <button
            v-if="store.extraTimeAvailable && !answered && store.timerEnabled"
            @click="doExtraTime"
            class="joker-btn border-emerald-800 bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-300"
            title="Voeg 15 seconden toe"
          >
            ⏱️ +15s
            <span v-if="store.extraTimesLeft > 1" class="text-xs opacity-70">({{ store.extraTimesLeft }})</span>
          </button>

          <!-- Used jokers info -->
          <div v-if="!store.jokerAvailable && !store.skipAvailable && !store.extraTimeAvailable && !answered"
            class="text-xs text-gray-600 flex items-center">
            Geen jokers meer
          </div>
        </div>

        <!-- Next button -->
        <button
          v-if="answered"
          @click="next"
          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl transition-all animate-bounce-in"
        >
          {{ store.isLastQuestion ? 'Resultaat bekijken' : 'Volgende vraag' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const store = useQuizStore()
const router = useRouter()
const selected = ref<number | null>(null)
const timedOut = ref(false)
const skipped  = ref(false)
const letters  = ['A', 'B', 'C', 'D', 'E']

const answered = computed(() => selected.value !== null || timedOut.value || skipped.value)

// Timer
const timeLeft = ref(store.timePerQuestion)
let timerInterval: ReturnType<typeof setInterval> | null = null

function startTimer() {
  stopTimer()
  timeLeft.value = store.timePerQuestion
  timedOut.value = false
  if (!store.timerEnabled) return
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) { stopTimer(); onTimeout() }
  }, 1000)
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}
function onTimeout() {
  if (answered.value) return
  timedOut.value = true
  store.answerQuestion(-1)
}

const timerPercent = computed(() => Math.max(0, (timeLeft.value / store.timePerQuestion) * 100))
const timerBarColor = computed(() => {
  if (timeLeft.value <= 5)  return 'bg-red-500'
  if (timeLeft.value <= 10) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const difficultyClass = computed(() => {
  const d = store.currentQuestion?.difficulty
  if (d === 'easy')   return 'bg-emerald-900/50 text-emerald-300 border-emerald-800'
  if (d === 'medium') return 'bg-amber-900/50 text-amber-300 border-amber-800'
  return 'bg-red-900/50 text-red-300 border-red-800'
})

function getOptionClass(idx: number) {
  if (store.eliminatedOptions.includes(idx)) return 'bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
  if (!answered.value) return 'bg-gray-800 border-gray-700 hover:border-indigo-500 hover:bg-gray-700 text-gray-200 cursor-pointer'
  const correct = store.currentQuestion.correctIndex
  if (skipped.value) {
    if (idx === correct) return 'bg-emerald-900/40 border-emerald-500 text-emerald-200 cursor-default'
    return 'bg-gray-800/50 border-gray-700/50 text-gray-500 cursor-default'
  }
  if (idx === correct) return 'bg-emerald-900/40 border-emerald-500 text-emerald-200 cursor-default'
  if (idx === selected.value && idx !== correct) return 'bg-red-900/40 border-red-500 text-red-200 cursor-default'
  return 'bg-gray-800/50 border-gray-700/50 text-gray-500 cursor-default'
}

function getLetterClass(idx: number) {
  if (store.eliminatedOptions.includes(idx)) return 'bg-gray-800 text-gray-600'
  if (!answered.value) return 'bg-gray-700 text-gray-300'
  const correct = store.currentQuestion.correctIndex
  if (idx === correct) return 'bg-emerald-500 text-white'
  if (idx === selected.value && idx !== correct) return 'bg-red-500 text-white'
  return 'bg-gray-700 text-gray-500'
}

function selectAnswer(idx: number) {
  if (answered.value || store.eliminatedOptions.includes(idx)) return
  stopTimer()
  selected.value = idx
  store.answerQuestion(idx)
}

function doSkip() {
  if (answered.value) return
  stopTimer()
  skipped.value = true
  store.skipQuestion()
}

function doExtraTime() {
  if (store.useExtraTime()) {
    timeLeft.value += 15
  }
}

function next() {
  selected.value = null
  timedOut.value = false
  skipped.value = false
  if (store.isLastQuestion) {
    store.finishQuiz()
    router.push('/result')
  } else {
    store.nextQuestion()
  }
}

watch(() => store.currentIndex, () => {
  selected.value = null
  timedOut.value = false
  skipped.value = false
  startTimer()
}, { immediate: true })

onUnmounted(() => stopTimer())
</script>

<style scoped>
.joker-btn {
  @apply flex items-center gap-1.5 px-3 py-2 border text-sm font-semibold rounded-xl transition-all active:scale-95;
}
</style>
