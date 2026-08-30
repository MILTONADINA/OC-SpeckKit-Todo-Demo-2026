<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { emailRules } from "../config/validation.js";
import authServices, { persistUserSession } from "../services/authServices.js";

const router = useRouter();

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");
const formRef = ref(null);

const requiredRules = {
  fName: [(value) => !!value?.trim() || "First name is required."],
  lName: [(value) => !!value?.trim() || "Last name is required."],
  username: [(value) => !!value?.trim() || "Username is required."],
  password: [(value) => (value && value.length >= 8) || "Password must be at least 8 characters."],
  confirmPassword: [
    (value) => !!value || "Please confirm your password.",
    (value) => value === password.value || "Passwords do not match.",
  ],
};

async function handleSubmit() {
  errorMessage.value = "";

  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const response = await authServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });

    persistUserSession(response.data);
    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Registration failed. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-6" width="100%" max-width="560" elevation="2">
      <v-card-title class="text-h5 text-primary font-weight-bold px-0">
        Create account
      </v-card-title>

      <v-alert v-if="errorMessage" type="error" class="mb-4" density="compact">
        {{ errorMessage }}
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="fName"
              label="First name"
              autocomplete="given-name"
              density="comfortable"
              rounded="lg"
              :rules="requiredRules.fName"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="lName"
              label="Last name"
              autocomplete="family-name"
              density="comfortable"
              rounded="lg"
              :rules="requiredRules.lName"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email"
              density="comfortable"
              rounded="lg"
              :rules="emailRules"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="username"
              label="Username"
              autocomplete="username"
              density="comfortable"
              rounded="lg"
              :rules="requiredRules.username"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              autocomplete="new-password"
              density="comfortable"
              rounded="lg"
              :rules="requiredRules.password"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="confirmPassword"
              label="Confirm password"
              type="password"
              autocomplete="new-password"
              density="comfortable"
              rounded="lg"
              :rules="requiredRules.confirmPassword"
            />
          </v-col>
        </v-row>

        <v-btn
          type="submit"
          color="primary"
          variant="elevated"
          class="oc-cta mb-4"
          block
          :loading="loading"
        >
          Create account
        </v-btn>

        <div class="text-center">
          <v-btn variant="text" :to="{ name: 'login' }">
            Already have an account? Sign in
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>
