<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import authServices, { clearUserSession } from "../services/authServices.js";

const router = useRouter();

const user = computed(() => Utils.getStore("user"));

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.join(" ") || user.value.username;
});

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
  <v-app-bar color="surface" elevation="1">
    <v-app-bar-title class="text-primary font-weight-bold">
      Todo Speckit
    </v-app-bar-title>

    <v-spacer />

    <span v-if="displayName" class="text-body-2 me-4">
      {{ displayName }}
    </span>

    <v-btn
      color="primary"
      variant="elevated"
      class="oc-cta me-4"
      @click="handleSignOut"
    >
      Sign out
    </v-btn>
  </v-app-bar>
</template>
