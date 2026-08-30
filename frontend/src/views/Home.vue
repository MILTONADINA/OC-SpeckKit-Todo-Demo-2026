<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import authServices, { clearUserSession } from "../services/authServices.js";

const router = useRouter();

const user = computed(() => Utils.getStore("user"));

async function handleSignOut() {
  try {
    await authServices.logoutUser();
  } catch {
    // Session may already be invalid; still clear local state.
  }

  clearUserSession();
  await router.push({ name: "login" });
}
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-2">Welcome, {{ user?.fName }}!</h1>
    <p class="text-body-1 mb-6">
      You are signed in. The full dashboard arrives in Feature 2.
    </p>

    <v-btn
      color="primary"
      variant="elevated"
      class="oc-cta"
      @click="handleSignOut"
    >
      Sign out
    </v-btn>
  </v-container>
</template>
