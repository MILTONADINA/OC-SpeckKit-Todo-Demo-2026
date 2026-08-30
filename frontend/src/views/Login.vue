<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices, { persistUserSession } from "../services/authServices.js";

const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const formRef = ref(null);

const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value?.trim() || "Password is required."];

async function handleSubmit() {
  errorMessage.value = "";

  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const response = await authServices.loginUser({
      username: username.value.trim(),
      password: password.value,
    });

    persistUserSession(response.data);
    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Sign in failed. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-6" width="100%" max-width="480" elevation="2">
      <v-card-title class="text-h5 text-primary font-weight-bold px-0">
        Sign in
      </v-card-title>

      <v-alert v-if="errorMessage" type="error" class="mb-4" density="compact">
        {{ errorMessage }}
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-text-field
          v-model="username"
          label="Username"
          autocomplete="username"
          density="comfortable"
          rounded="lg"
          :rules="usernameRules"
          class="mb-2"
        />

        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          density="comfortable"
          rounded="lg"
          :rules="passwordRules"
          class="mb-4"
        />

        <v-btn
          type="submit"
          color="primary"
          variant="elevated"
          class="oc-cta mb-4"
          block
          :loading="loading"
        >
          Sign in
        </v-btn>

        <div class="text-center">
          <v-btn variant="text" :to="{ name: 'register' }">
            Create an account
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>
