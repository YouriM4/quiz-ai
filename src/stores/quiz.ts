import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, LeaderboardEntry, AchievementDef } from '@/types'
import defaultQuestions from '@/data/questions.json'

const STORAGE_KEY_QUESTIONS    = 'quiz_questions'
const STORAGE_KEY_LEADERBOARD  = 'quiz_leaderboard'
const STORAGE_KEY_ACHIEVEMENTS = 'quiz_achievements'

// --- Answer sentinel values ---
// -1 = timed out, -2 = skipped, >= 0 = option index

function loadSetting<T>(key: string, defaultVal: T): T {
  const stored = localStorage.getItem('quiz_setting_' + key)
  if (stored !== null) {
    try { return JSON.parse(stored) } catch { /* ignore */ }
  }
  return defaultVal
}
function saveSetting(key: string, value: unknown) {
  localStorage.setItem('quiz_setting_' + key, JSON.stringify(value))
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ========================
//  Achievement definitions
// ========================
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_quiz',     name: 'Eerste Quiz',       description: 'Voltooi je eerste quiz',                    icon: '🎯' },
  { id: 'five_quizzes',   name: 'Op Gang',           description: 'Voltooi 5 quizzes',                        icon: '⚡' },
  { id: 'twenty_quizzes', name: 'Quizmaster',        description: 'Voltooi 20 quizzes',                       icon: '👑' },
  { id: 'fifty_quizzes',  name: 'Veteraan',          description: 'Voltooi 50 quizzes',                       icon: '🏅' },
  { id: 'perfect',        name: 'Perfecte Score',    description: 'Behaal 100% in een quiz',                  icon: '💯' },
  { id: 'streak_5',       name: 'Vuurstreak',        description: 'Behaal een streak van 5',                  icon: '🔥' },
  { id: 'streak_10',      name: 'Onstopbaar',        description: 'Behaal een streak van 10',                 icon: '💥' },
  { id: 'speed_demon',    name: 'Snelheidsduivel',   description: 'Voltooi een quiz (5+ vragen) in < 60s',    icon: '⏱️' },
  { id: 'no_jokers',      name: 'Geen Hulp Nodig',   description: 'Behaal 80%+ zonder jokers te gebruiken',   icon: '💪' },
  { id: 'brain_20',       name: 'Brainiac',          description: 'Beantwoord 20+ vragen correct in één quiz', icon: '🧠' },
]

export const useQuizStore = defineStore('quiz', () => {
  // --- Question database ---
  const questions = ref<Question[]>(loadQuestions())

  // --- Settings (persisted) ---
  const shuffleEnabled   = ref(loadSetting('shuffleEnabled', false))
  const timerEnabled     = ref(loadSetting('timerEnabled', true))
  const timePerQuestion  = ref(loadSetting('timePerQuestion', 20))
  const maxQuestions     = ref(loadSetting('maxQuestions', 10))
  const difficultyFilter = ref(loadSetting<'' | 'easy' | 'medium' | 'hard'>('difficultyFilter', ''))
  const jokerCount       = ref(loadSetting('jokerCount', 1))
  const skipCount        = ref(loadSetting('skipCount', 1))
  const extraTimeCount   = ref(loadSetting('extraTimeCount', 1))

  // --- Session filters ---
  const selectedCategories = ref<string[]>([])

  // --- Session state ---
  const activeQuestions   = ref<Question[]>([])
  const currentIndex      = ref(0)
  const answers           = ref<(number | null)[]>([])
  const quizStarted       = ref(false)
  const quizFinished      = ref(false)
  const startTime         = ref(0)
  const playerName        = ref('')

  // Jokers (session)
  const jokersLeft        = ref(0)
  const skipsLeft         = ref(0)
  const extraTimesLeft    = ref(0)
  const eliminatedOptions = ref<number[]>([])
  const jokersWereUsed    = ref(false)

  // Streak
  const currentStreak     = ref(0)
  const maxStreak         = ref(0)

  // Leaderboard + Achievements
  const leaderboard  = ref<LeaderboardEntry[]>(loadLeaderboard())
  const unlockedAchievements = ref<Record<string, string>>(loadAchievements()) // id -> date

  // --- Loaders ---
  function loadQuestions(): Question[] {
    const stored = localStorage.getItem(STORAGE_KEY_QUESTIONS)
    if (stored) { try { return JSON.parse(stored) } catch { /* ignore */ } }
    return defaultQuestions as Question[]
  }
  function loadLeaderboard(): LeaderboardEntry[] {
    const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD)
    if (stored) { try { return JSON.parse(stored) } catch { /* ignore */ } }
    return []
  }
  function loadAchievements(): Record<string, string> {
    const stored = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS)
    if (stored) { try { return JSON.parse(stored) } catch { /* ignore */ } }
    return {}
  }
  function saveQuestions()      { localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions.value)) }
  function saveLeaderboard()    { localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(leaderboard.value)) }
  function saveAchievements()   { localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(unlockedAchievements.value)) }

  // --- Setting setters ---
  function setShuffleEnabled(val: boolean)  { shuffleEnabled.value = val;  saveSetting('shuffleEnabled', val) }
  function setTimerEnabled(val: boolean)    { timerEnabled.value = val;    saveSetting('timerEnabled', val) }
  function setTimePerQuestion(val: number)  { timePerQuestion.value = val; saveSetting('timePerQuestion', val) }
  function setMaxQuestions(val: number)     { maxQuestions.value = val;    saveSetting('maxQuestions', val) }
  function setDifficultyFilter(val: '' | 'easy' | 'medium' | 'hard') {
    difficultyFilter.value = val; saveSetting('difficultyFilter', val)
  }
  function setJokerCount(val: number)    { jokerCount.value = val;    saveSetting('jokerCount', val) }
  function setSkipCount(val: number)     { skipCount.value = val;     saveSetting('skipCount', val) }
  function setExtraTimeCount(val: number){ extraTimeCount.value = val; saveSetting('extraTimeCount', val) }

  function resetSettings() {
    setShuffleEnabled(false); setTimerEnabled(true); setTimePerQuestion(20)
    setMaxQuestions(10); setDifficultyFilter(''); setJokerCount(1)
    setSkipCount(1); setExtraTimeCount(1)
    selectedCategories.value = []
  }

  // --- Category selection ---
  function toggleCategory(cat: string) {
    const idx = selectedCategories.value.indexOf(cat)
    if (idx === -1) selectedCategories.value = [...selectedCategories.value, cat]
    else selectedCategories.value = selectedCategories.value.filter(c => c !== cat)
  }
  function selectAllCategories() { selectedCategories.value = [] }

  // --- Computed ---
  const currentQuestion = computed(() => activeQuestions.value[currentIndex.value])
  const totalQuestions  = computed(() => activeQuestions.value.length)
  const score           = computed(() =>
    answers.value.filter((a, i) => a !== null && a !== -1 && a !== -2 && a === activeQuestions.value[i]?.correctIndex).length
  )
  const skippedCount    = computed(() => answers.value.filter(a => a === -2).length)
  const progress        = computed(() =>
    totalQuestions.value > 0 ? (currentIndex.value / totalQuestions.value) * 100 : 0
  )
  const isLastQuestion  = computed(() => currentIndex.value === totalQuestions.value - 1)
  const jokerAvailable  = computed(() => jokersLeft.value > 0)
  const skipAvailable   = computed(() => skipsLeft.value > 0)
  const extraTimeAvailable = computed(() => extraTimesLeft.value > 0)

  const availableCategories = computed(() => {
    const cats = questions.value.map(q => q.category).filter((c): c is string => !!c)
    return [...new Set(cats)]
  })

  function buildPool(): Question[] {
    let pool = [...questions.value]
    if (selectedCategories.value.length > 0)
      pool = pool.filter(q => q.category && selectedCategories.value.includes(q.category))
    if (difficultyFilter.value)
      pool = pool.filter(q => q.difficulty === difficultyFilter.value)
    if (shuffleEnabled.value) pool = shuffle(pool)
    if (maxQuestions.value > 0 && pool.length > maxQuestions.value)
      pool = pool.slice(0, maxQuestions.value)
    return pool
  }

  const previewCount = computed(() => buildPool().length)

  // Newly unlocked achievements (set after finishQuiz, cleared on resetQuiz)
  const newlyUnlocked = ref<string[]>([])

  // --- Quiz lifecycle ---
  function startQuiz(name: string) {
    playerName.value = name
    const pool = buildPool()
    activeQuestions.value = pool
    currentIndex.value = 0
    answers.value = new Array(pool.length).fill(null)
    quizStarted.value = true
    quizFinished.value = false
    startTime.value = Date.now()
    jokersLeft.value = jokerCount.value
    skipsLeft.value = skipCount.value
    extraTimesLeft.value = extraTimeCount.value
    eliminatedOptions.value = []
    jokersWereUsed.value = false
    currentStreak.value = 0
    maxStreak.value = 0
    newlyUnlocked.value = []
  }

  function answerQuestion(optionIndex: number) {
    answers.value[currentIndex.value] = optionIndex
    if (optionIndex === currentQuestion.value?.correctIndex) {
      currentStreak.value++
      if (currentStreak.value > maxStreak.value) maxStreak.value = currentStreak.value
    } else {
      currentStreak.value = 0
    }
  }

  function skipQuestion() {
    if (!skipAvailable.value) return
    answers.value[currentIndex.value] = -2
    skipsLeft.value--
    jokersWereUsed.value = true
    // Streak stays intact when skipping
  }

  function useExtraTime(): boolean {
    if (!extraTimeAvailable.value) return false
    extraTimesLeft.value--
    jokersWereUsed.value = true
    return true // view adds time
  }

  function nextQuestion() {
    eliminatedOptions.value = []
    if (!isLastQuestion.value) currentIndex.value++
    else finishQuiz()
  }

  function finishQuiz() {
    quizFinished.value = true
    const timeSeconds = Math.round((Date.now() - startTime.value) / 1000)
    const entry: LeaderboardEntry = {
      id: Date.now().toString(),
      name: playerName.value,
      score: score.value,
      total: totalQuestions.value,
      percentage: totalQuestions.value > 0 ? Math.round((score.value / totalQuestions.value) * 100) : 0,
      date: new Date().toLocaleDateString('nl-NL'),
      timeSeconds,
      maxStreak: maxStreak.value,
      usedJokers: jokersWereUsed.value,
      skips: skippedCount.value,
    }
    leaderboard.value.push(entry)
    leaderboard.value.sort((a, b) => b.percentage - a.percentage || a.timeSeconds - b.timeSeconds)
    saveLeaderboard()
    checkAchievements(entry)
  }

  function resetQuiz() {
    currentIndex.value = 0; answers.value = []
    quizStarted.value = false; quizFinished.value = false
    playerName.value = ''; activeQuestions.value = []
    eliminatedOptions.value = []; currentStreak.value = 0; maxStreak.value = 0
    newlyUnlocked.value = []
  }

  // --- Joker: 50/50 ---
  function useJoker() {
    if (!jokerAvailable.value || !currentQuestion.value) return
    const q = currentQuestion.value
    const wrongIndices = q.options.map((_, i) => i).filter(i => i !== q.correctIndex)
    eliminatedOptions.value = shuffle(wrongIndices).slice(0, 2)
    jokersLeft.value--
    jokersWereUsed.value = true
  }

  // --- Achievements ---
  function checkAchievements(latest: LeaderboardEntry) {
    const lb = leaderboard.value
    const checks: Record<string, boolean> = {
      first_quiz:     lb.length >= 1,
      five_quizzes:   lb.length >= 5,
      twenty_quizzes: lb.length >= 20,
      fifty_quizzes:  lb.length >= 50,
      perfect:        lb.some(e => e.percentage === 100),
      streak_5:       lb.some(e => (e.maxStreak || 0) >= 5),
      streak_10:      lb.some(e => (e.maxStreak || 0) >= 10),
      speed_demon:    lb.some(e => e.timeSeconds <= 60 && e.total >= 5),
      no_jokers:      lb.some(e => e.usedJokers === false && e.percentage >= 80),
      brain_20:       lb.some(e => e.score >= 20),
    }
    const justUnlocked: string[] = []
    for (const [id, passed] of Object.entries(checks)) {
      if (passed && !unlockedAchievements.value[id]) {
        unlockedAchievements.value[id] = new Date().toISOString()
        justUnlocked.push(id)
      }
    }
    if (justUnlocked.length > 0) {
      saveAchievements()
      newlyUnlocked.value = justUnlocked
    }
  }

  const achievementCount = computed(() => Object.keys(unlockedAchievements.value).length)

  // --- Question management ---
  function addQuestion(q: Omit<Question, 'id'>) {
    questions.value.push({ ...q, id: `q_${Date.now()}` }); saveQuestions()
  }
  function updateQuestion(id: string, updated: Omit<Question, 'id'>) {
    const idx = questions.value.findIndex(q => q.id === id)
    if (idx !== -1) { questions.value[idx] = { id, ...updated }; saveQuestions() }
  }
  function deleteQuestion(id: string) {
    questions.value = questions.value.filter(q => q.id !== id); saveQuestions()
  }
  function importFromJson(json: string) {
    const parsed = JSON.parse(json) as Question[]
    questions.value.push(...parsed.map((q, i) => ({ ...q, id: `imported_${Date.now()}_${i}` })))
    saveQuestions(); return parsed.length
  }
  function replaceWithJson(json: string) {
    const parsed = JSON.parse(json) as Question[]
    questions.value = parsed.map((q, i) => ({ ...q, id: q.id || `imported_${Date.now()}_${i}` }))
    saveQuestions(); return questions.value.length
  }
  function resetQuestionsToDefault() {
    questions.value = (defaultQuestions as Question[]).map(q => ({ ...q })); saveQuestions()
  }
  function clearLeaderboard() { leaderboard.value = []; saveLeaderboard() }

  return {
    questions, activeQuestions, leaderboard, unlockedAchievements, newlyUnlocked, achievementCount,
    shuffleEnabled, timerEnabled, timePerQuestion, maxQuestions, difficultyFilter,
    jokerCount, skipCount, extraTimeCount, selectedCategories,
    setShuffleEnabled, setTimerEnabled, setTimePerQuestion, setMaxQuestions,
    setDifficultyFilter, setJokerCount, setSkipCount, setExtraTimeCount,
    resetSettings, toggleCategory, selectAllCategories,
    currentIndex, answers, quizStarted, quizFinished, playerName,
    jokersLeft, skipsLeft, extraTimesLeft, jokerAvailable, skipAvailable, extraTimeAvailable,
    eliminatedOptions, jokersWereUsed, currentStreak, maxStreak, skippedCount,
    currentQuestion, totalQuestions, score, progress, isLastQuestion,
    availableCategories, previewCount,
    startQuiz, answerQuestion, skipQuestion, useExtraTime,
    nextQuestion, finishQuiz, resetQuiz,
    useJoker,
    addQuestion, updateQuestion, deleteQuestion,
    importFromJson, replaceWithJson, resetQuestionsToDefault, clearLeaderboard,
  }
})
