<template>
  <div class="min-h-screen bg-gray-950">
    <nav class="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div
        class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between"
      >
        <RouterLink
          to="/"
          class="text-xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Quiz App
        </RouterLink>
        <div class="flex gap-1 flex-wrap">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="
              $route.path === link.to
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            "
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </nav>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";

const $route = useRoute();

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/stats", label: "Stats" },
  { to: "/manage", label: "Vragen" },
  { to: "/settings", label: "Instellingen" },
];
</script>
