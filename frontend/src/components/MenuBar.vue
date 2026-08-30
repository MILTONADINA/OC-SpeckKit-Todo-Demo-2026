<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { emailRules } from "../config/validation.js";
import Utils from "../config/utils.js";
import authServices, { clearUserSession, persistUserSession } from "../services/authServices.js";
import userServices from "../services/userServices.js";

const router = useRouter();

const user = ref(Utils.getStore("user"));
const profileMenuOpen = ref(false);
const showEditDialog = ref(false);
const editLoading = ref(false);
const editErrorMessage = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const editFormRef = ref(null);

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.join(" ") || user.value.username;
});

const requiredRules = {
  fName: [(value) => !!value?.trim() || "First name is required."],
  lName: [(value) => !!value?.trim() || "Last name is required."],
  username: [(value) => !!value?.trim() || "Username is required."],
};

const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];

const confirmPasswordRules = [
  (value) => !password.value || !!value || "Please confirm your password.",
  (value) => !password.value || value === password.value || "Passwords do not match.",
];

function refreshUserFromStore() {
  user.value = Utils.getStore("user");
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUserFromStore);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUserFromStore);
});

async function openEditProfile() {
  profileMenuOpen.value = false;
  editErrorMessage.value = "";

  if (!user.value?.userId) {
    return;
  }

  try {
    const response = await userServices.getUser(user.value.userId);
    fName.value = response.data.fName;
    lName.value = response.data.lName;
    email.value = response.data.email;
    username.value = response.data.username;
    password.value = "";
    confirmPassword.value = "";
    showEditDialog.value = true;
  } catch (error) {
    editErrorMessage.value = error.response?.data?.message || "Failed to load profile.";
    showEditDialog.value = true;
  }
}

function closeEditDialog() {
  showEditDialog.value = false;
  editErrorMessage.value = "";
}

async function handleSaveProfile() {
  editErrorMessage.value = "";

  const { valid } = await editFormRef.value.validate();

  if (!valid || !user.value?.userId) {
    return;
  }

  editLoading.value = true;

  const payload = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };

  if (password.value) {
    payload.password = password.value;
  }

  try {
    const response = await userServices.updateUser(user.value.userId, payload);

    persistUserSession({
      ...user.value,
      userId: response.data.id,
      fName: response.data.fName,
      lName: response.data.lName,
      email: response.data.email,
      username: response.data.username,
      role: response.data.role,
    });

    refreshUserFromStore();
    closeEditDialog();
  } catch (error) {
    editErrorMessage.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    editLoading.value = false;
  }
}

async function handleLogOut() {
  profileMenuOpen.value = false;

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

    <v-menu v-model="profileMenuOpen" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-account-circle"
          variant="text"
          aria-label="Open profile menu"
        />
      </template>

      <v-list min-width="280">
        <v-list-item
          :title="displayName"
          :subtitle="user?.username"
        />
        <v-list-item :subtitle="user?.email" />

        <v-divider class="my-2" />

        <v-list-item>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            block
            @click="openEditProfile"
          >
            Edit Profile
          </v-btn>
        </v-list-item>

        <v-list-item @click="handleLogOut">
          <v-list-item-title>Log out</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="showEditDialog" max-width="560">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">Edit Profile</v-card-title>

        <v-alert
          v-if="editErrorMessage"
          type="error"
          class="mb-4"
          density="compact"
        >
          {{ editErrorMessage }}
        </v-alert>

        <v-form ref="editFormRef" @submit.prevent="handleSaveProfile">
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
                label="New password"
                type="password"
                autocomplete="new-password"
                density="comfortable"
                rounded="lg"
                :rules="passwordRules"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="confirmPassword"
                label="Confirm new password"
                type="password"
                autocomplete="new-password"
                density="comfortable"
                rounded="lg"
                :rules="confirmPasswordRules"
              />
            </v-col>
          </v-row>

          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="closeEditDialog">
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              :loading="editLoading"
            >
              Save
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>
