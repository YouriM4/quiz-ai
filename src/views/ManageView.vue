<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="text-3xl font-bold text-white mb-2">Vragen beheren</h1>
    <p class="text-gray-400 text-sm mb-8">Voeg vragen toe via het formulier of importeer via JSON</p>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 bg-gray-900 border border-gray-800 rounded-xl p-1">
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

    <!-- Tab: Lijst -->
    <div v-if="activeTab === 'list'" class="animate-fade-in">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-gray-400">{{ store.questions.length }} vragen</span>
        <button
          @click="activeTab = 'add'"
          class="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          + Vraag toevoegen
        </button>
      </div>

      <div v-if="store.questions.length === 0" class="text-center py-16 text-gray-500">
        Geen vragen. Voeg er een toe!
      </div>

      <div class="space-y-3">
        <div
          v-for="q in store.questions"
          :key="q.id"
          class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap gap-2 mb-2">
                <span v-if="q.category" class="text-xs px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full">
                  {{ q.category }}
                </span>
                <span v-if="q.difficulty" class="text-xs px-2 py-0.5 rounded-full" :class="diffBadge(q.difficulty)">
                  {{ q.difficulty }}
                </span>
              </div>
              <p class="text-white font-medium">{{ q.question }}</p>
              <div class="mt-2 grid grid-cols-2 gap-1">
                <span
                  v-for="(opt, i) in q.options"
                  :key="i"
                  class="text-xs px-2 py-1 rounded-lg"
                  :class="i === q.correctIndex ? 'bg-emerald-900/50 text-emerald-300' : 'text-gray-500'"
                >
                  {{ ['A','B','C','D'][i] }}. {{ opt }}
                </span>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button
                @click="editQuestion(q)"
                class="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Bewerken
              </button>
              <button
                @click="confirmDelete(q.id)"
                class="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Toevoegen / Bewerken -->
    <div v-if="activeTab === 'add'" class="animate-fade-in">
      <h2 class="text-lg font-semibold text-white mb-6">
        {{ editingId ? 'Vraag bewerken' : 'Nieuwe vraag' }}
      </h2>

      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div>
          <label class="label">Vraag *</label>
          <textarea
            v-model="form.question"
            rows="3"
            placeholder="Wat is...?"
            class="input resize-none"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div v-for="(_, i) in form.options" :key="i">
            <label class="label">
              Antwoord {{ ['A','B','C','D'][i] }}
              <span v-if="i === form.correctIndex" class="text-emerald-400 text-xs ml-1">(juist)</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model="form.options[i]"
                type="text"
                :placeholder="`Optie ${['A','B','C','D'][i]}`"
                class="input flex-1"
              />
              <button
                @click="form.correctIndex = i"
                :class="form.correctIndex === i ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
                class="px-3 rounded-lg transition-colors text-sm font-bold"
                title="Markeer als juist antwoord"
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Categorie (optioneel)</label>
            <input v-model="form.category" type="text" placeholder="bijv. Wetenschap" class="input" />
          </div>
          <div>
            <label class="label">Moeilijkheid (optioneel)</label>
            <select v-model="form.difficulty" class="input">
              <option value="">-- Geen --</option>
              <option value="easy">Makkelijk</option>
              <option value="medium">Gemiddeld</option>
              <option value="hard">Moeilijk</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            @click="saveQuestion"
            :disabled="!isFormValid"
            class="flex-1 py-3 font-semibold rounded-xl transition-all text-white"
            :class="isFormValid ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95' : 'bg-gray-700 opacity-50 cursor-not-allowed'"
          >
            {{ editingId ? 'Opslaan' : 'Vraag toevoegen' }}
          </button>
          <button
            @click="cancelEdit"
            class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>

    <!-- Tab: JSON Import -->
    <div v-if="activeTab === 'json'" class="animate-fade-in">
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-2">Importeer via JSON</h2>
        <p class="text-sm text-gray-400 mb-4">
          Plak een JSON-array met vragen. Elk object moet de volgende velden bevatten:
          <code class="text-indigo-300">question</code>,
          <code class="text-indigo-300">options</code> (array van 2-5 strings),
          <code class="text-indigo-300">correctIndex</code> (getal).
          Optioneel: <code class="text-indigo-300">category</code>, <code class="text-indigo-300">difficulty</code>.
        </p>

        <!-- Example -->
        <details class="mb-4">
          <summary class="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">Voorbeeld JSON</summary>
          <pre class="mt-2 text-xs bg-gray-800 rounded-lg p-3 text-gray-300 overflow-auto">{{ exampleJson }}</pre>
        </details>

        <textarea
          v-model="jsonInput"
          rows="10"
          placeholder='[{ "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 }]'
          class="input resize-y font-mono text-sm"
          :class="jsonError ? 'border-red-500' : ''"
        />
        <p v-if="jsonError" class="text-red-400 text-sm mt-2">{{ jsonError }}</p>
        <p v-if="jsonSuccess" class="text-emerald-400 text-sm mt-2">{{ jsonSuccess }}</p>

        <div class="flex gap-3 mt-4">
          <button
            @click="importJson(false)"
            class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
          >
            Toevoegen aan bestaande
          </button>
          <button
            @click="importJson(true)"
            class="flex-1 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
          >
            Vervangen (overschrijven)
          </button>
        </div>
      </div>

      <!-- Export -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-2">Exporteer vragen</h2>
        <p class="text-sm text-gray-400 mb-4">Download alle huidige vragen als JSON-bestand.</p>
        <button
          @click="exportJson"
          class="py-2.5 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
        >
          Download JSON
        </button>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="deleteId" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full animate-bounce-in text-center">
        <div class="text-4xl mb-4">🗑️</div>
        <h3 class="text-lg font-bold text-white mb-2">Vraag verwijderen?</h3>
        <p class="text-gray-400 text-sm mb-6">Dit kan niet ongedaan worden gemaakt.</p>
        <div class="flex gap-3">
          <button @click="deleteId = null" class="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl">
            Annuleren
          </button>
          <button @click="doDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl">
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuizStore } from '@/stores/quiz'
import type { Question } from '@/types'

const store = useQuizStore()

const tabs = [
  { id: 'list', label: `Vragen (${store.questions.length})` },
  { id: 'add', label: 'Toevoegen' },
  { id: 'json', label: 'JSON Import/Export' },
]

const activeTab = ref('list')
const editingId = ref<string | null>(null)
const deleteId = ref<string | null>(null)
const jsonInput = ref('')
const jsonError = ref('')
const jsonSuccess = ref('')

const form = reactive({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  category: '',
  difficulty: '' as '' | 'easy' | 'medium' | 'hard',
})

const isFormValid = computed(() =>
  form.question.trim() &&
  form.options.filter(o => o.trim()).length >= 2
)

const exampleJson = `[
  {
    "question": "Wat is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctIndex": 1,
    "category": "Wiskunde",
    "difficulty": "easy"
  }
]`

function diffBadge(d: string) {
  if (d === 'easy') return 'bg-emerald-900/50 text-emerald-300'
  if (d === 'medium') return 'bg-amber-900/50 text-amber-300'
  return 'bg-red-900/50 text-red-300'
}

function editQuestion(q: Question) {
  editingId.value = q.id
  form.question = q.question
  form.options = [...q.options, '', '', '', ''].slice(0, 4)
  form.correctIndex = q.correctIndex
  form.category = q.category || ''
  form.difficulty = (q.difficulty as '' | 'easy' | 'medium' | 'hard') || ''
  activeTab.value = 'add'
}

function cancelEdit() {
  editingId.value = null
  resetForm()
  activeTab.value = 'list'
}

function resetForm() {
  form.question = ''
  form.options = ['', '', '', '']
  form.correctIndex = 0
  form.category = ''
  form.difficulty = ''
}

function saveQuestion() {
  if (!isFormValid.value) return
  const payload = {
    question: form.question.trim(),
    options: form.options.filter(o => o.trim()),
    correctIndex: form.correctIndex,
    ...(form.category ? { category: form.category.trim() } : {}),
    ...(form.difficulty ? { difficulty: form.difficulty as 'easy' | 'medium' | 'hard' } : {}),
  }
  if (editingId.value) {
    store.updateQuestion(editingId.value, payload)
    editingId.value = null
  } else {
    store.addQuestion(payload)
  }
  resetForm()
  activeTab.value = 'list'
}

function confirmDelete(id: string) {
  deleteId.value = id
}

function doDelete() {
  if (deleteId.value) {
    store.deleteQuestion(deleteId.value)
    deleteId.value = null
  }
}

function importJson(replace: boolean) {
  jsonError.value = ''
  jsonSuccess.value = ''
  try {
    const count = replace
      ? store.replaceWithJson(jsonInput.value)
      : store.importFromJson(jsonInput.value)
    jsonSuccess.value = `${count} vra${count === 1 ? 'ag' : 'gen'} succesvol ${replace ? 'geladen' : 'toegevoegd'}!`
    jsonInput.value = ''
  } catch (e) {
    jsonError.value = 'Ongeldige JSON. Controleer het formaat en probeer opnieuw.'
  }
}

function exportJson() {
  const data = JSON.stringify(store.questions, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quiz-vragen.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.label {
  @apply block text-sm font-medium text-gray-300 mb-1.5;
}
.input {
  @apply w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500
    focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition;
}
</style>
