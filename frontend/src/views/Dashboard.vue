<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";

const lists = ref([]);
const loading = ref(true);
const errorMessage = ref("");

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);

const createName = ref("");
const editName = ref("");
const selectedList = ref(null);

const createFormRef = ref(null);
const editFormRef = ref(null);
const createLoading = ref(false);
const editLoading = ref(false);
const deleteLoading = ref(false);

const nameRules = [
  (value) => !!value?.trim() || "List name is required.",
];

async function loadLists() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = response.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load lists.";
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  createName.value = "";
  showCreateDialog.value = true;
}

function openEditDialog(list) {
  selectedList.value = list;
  editName.value = list.name;
  showEditDialog.value = true;
}

function openDeleteDialog(list) {
  selectedList.value = list;
  showDeleteDialog.value = true;
}

async function handleCreate() {
  errorMessage.value = "";

  const { valid } = await createFormRef.value.validate();

  if (!valid) {
    return;
  }

  createLoading.value = true;

  try {
    const response = await listServices.createList({ name: createName.value.trim() });
    lists.value = [...lists.value, response.data].sort((a, b) => a.name.localeCompare(b.name));
    showCreateDialog.value = false;
    createName.value = "";
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to create list.";
  } finally {
    createLoading.value = false;
  }
}

async function handleEdit() {
  errorMessage.value = "";

  const { valid } = await editFormRef.value.validate();

  if (!valid || !selectedList.value) {
    return;
  }

  editLoading.value = true;

  try {
    const response = await listServices.updateList(selectedList.value.id, {
      name: editName.value.trim(),
    });
    lists.value = lists.value
      .map((list) => (list.id === selectedList.value.id ? response.data : list))
      .sort((a, b) => a.name.localeCompare(b.name));
    showEditDialog.value = false;
    selectedList.value = null;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to rename list.";
  } finally {
    editLoading.value = false;
  }
}

async function handleDelete() {
  if (!selectedList.value) {
    return;
  }

  errorMessage.value = "";
  deleteLoading.value = true;

  try {
    await listServices.deleteList(selectedList.value.id);
    lists.value = lists.value.filter((list) => list.id !== selectedList.value.id);
    showDeleteDialog.value = false;
    selectedList.value = null;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to delete list.";
  } finally {
    deleteLoading.value = false;
  }
}

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4">My Lists</h1>

      <v-btn
        color="primary"
        variant="elevated"
        class="oc-cta"
        @click="openCreateDialog"
      >
        + New List
      </v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" class="mb-4" density="compact">
      {{ errorMessage }}
    </v-alert>

    <div v-if="loading" class="py-8">
      <v-progress-linear indeterminate color="primary" />
    </div>

    <p v-else-if="lists.length === 0" class="text-body-1">
      No lists yet. Create your first list.
    </p>

    <v-list v-else lines="one" class="bg-transparent">
      <v-list-item
        v-for="list in lists"
        :key="list.id"
        :title="list.name"
        class="mb-2 rounded-lg bg-surface"
      >
        <template #append>
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            aria-label="Edit list"
            @click="openEditDialog(list)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            aria-label="Delete list"
            @click="openDeleteDialog(list)"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="showCreateDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">New List</v-card-title>

        <v-form ref="createFormRef" @submit.prevent="handleCreate">
          <v-text-field
            v-model="createName"
            label="List name"
            density="comfortable"
            rounded="lg"
            :rules="nameRules"
            class="mb-4"
          />

          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="showCreateDialog = false">
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              :loading="createLoading"
            >
              Create
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">Rename List</v-card-title>

        <v-form ref="editFormRef" @submit.prevent="handleEdit">
          <v-text-field
            v-model="editName"
            label="List name"
            density="comfortable"
            rounded="lg"
            :rules="nameRules"
            class="mb-4"
          />

          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="showEditDialog = false">
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

    <v-dialog v-model="showDeleteDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">Delete List</v-card-title>
        <v-card-text class="px-0">
          Are you sure you want to delete
          <strong>{{ selectedList?.name }}</strong>?
        </v-card-text>

        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleteLoading"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>
