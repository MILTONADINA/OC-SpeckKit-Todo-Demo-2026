<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";

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

const showItemsDialog = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const itemsErrorMessage = ref("");

const showAddTodoDialog = ref(false);
const showEditTodoDialog = ref(false);
const showDeleteTodoDialog = ref(false);

const addTodoTitle = ref("");
const editTodoTitle = ref("");
const selectedTodo = ref(null);

const addTodoFormRef = ref(null);
const editTodoFormRef = ref(null);
const addTodoLoading = ref(false);
const editTodoLoading = ref(false);
const deleteTodoLoading = ref(false);

const nameRules = [
  (value) => !!value?.trim() || "List name is required.",
];

const todoTitleRules = [
  (value) => !!value?.trim() || "Todo title is required.",
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

async function loadTodos() {
  if (!itemsList.value) {
    return;
  }

  todosLoading.value = true;
  itemsErrorMessage.value = "";

  try {
    const response = await todoServices.getTodos(itemsList.value.id);
    todos.value = response.data;
  } catch (error) {
    itemsErrorMessage.value = error.response?.data?.message || "Failed to load todos.";
  } finally {
    todosLoading.value = false;
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

async function openItemsDialog(list) {
  itemsList.value = list;
  showItemsDialog.value = true;
  await loadTodos();
}

function closeItemsDialog() {
  showItemsDialog.value = false;
  itemsList.value = null;
  todos.value = [];
  itemsErrorMessage.value = "";
}

function openAddTodoDialog() {
  addTodoTitle.value = "";
  showAddTodoDialog.value = true;
}

function openEditTodoDialog(todo) {
  selectedTodo.value = todo;
  editTodoTitle.value = todo.title;
  showEditTodoDialog.value = true;
}

function openDeleteTodoDialog(todo) {
  selectedTodo.value = todo;
  showDeleteTodoDialog.value = true;
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

async function handleAddTodo() {
  itemsErrorMessage.value = "";

  const { valid } = await addTodoFormRef.value.validate();

  if (!valid || !itemsList.value) {
    return;
  }

  addTodoLoading.value = true;

  try {
    const response = await todoServices.createTodo(itemsList.value.id, {
      title: addTodoTitle.value.trim(),
    });
    todos.value = [...todos.value, response.data];
    showAddTodoDialog.value = false;
    addTodoTitle.value = "";
  } catch (error) {
    itemsErrorMessage.value = error.response?.data?.message || "Failed to add todo.";
  } finally {
    addTodoLoading.value = false;
  }
}

async function handleEditTodo() {
  itemsErrorMessage.value = "";

  const { valid } = await editTodoFormRef.value.validate();

  if (!valid || !selectedTodo.value) {
    return;
  }

  editTodoLoading.value = true;

  try {
    const response = await todoServices.updateTodo(selectedTodo.value.id, {
      title: editTodoTitle.value.trim(),
    });
    todos.value = todos.value.map((todo) =>
      todo.id === selectedTodo.value.id ? response.data : todo
    );
    showEditTodoDialog.value = false;
    selectedTodo.value = null;
  } catch (error) {
    itemsErrorMessage.value = error.response?.data?.message || "Failed to update todo.";
  } finally {
    editTodoLoading.value = false;
  }
}

async function handleDeleteTodo() {
  if (!selectedTodo.value) {
    return;
  }

  itemsErrorMessage.value = "";
  deleteTodoLoading.value = true;

  try {
    await todoServices.deleteTodo(selectedTodo.value.id);
    todos.value = todos.value.filter((todo) => todo.id !== selectedTodo.value.id);
    showDeleteTodoDialog.value = false;
    selectedTodo.value = null;
  } catch (error) {
    itemsErrorMessage.value = error.response?.data?.message || "Failed to delete todo.";
  } finally {
    deleteTodoLoading.value = false;
  }
}

async function toggleTodoCompleted(todo, completed) {
  itemsErrorMessage.value = "";

  try {
    const response = await todoServices.updateTodo(todo.id, { completed });
    todos.value = todos.value.map((item) => (item.id === todo.id ? response.data : item));
  } catch (error) {
    itemsErrorMessage.value = error.response?.data?.message || "Failed to update todo.";
  }
}

function itemsAriaLabel(list) {
  return `View items for ${list.name}`;
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
            icon="mdi-format-list-bulleted"
            size="small"
            variant="text"
            :aria-label="itemsAriaLabel(list)"
            @click="openItemsDialog(list)"
          />
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

    <v-dialog v-model="showItemsDialog" max-width="640">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">
          {{ itemsList?.name }} — Items
        </v-card-title>

        <div class="d-flex justify-end mb-4">
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddTodoDialog"
          >
            + Add Item
          </v-btn>
        </div>

        <v-alert
          v-if="itemsErrorMessage"
          type="error"
          class="mb-4"
          density="compact"
        >
          {{ itemsErrorMessage }}
        </v-alert>

        <div v-if="todosLoading" class="py-6">
          <v-progress-linear indeterminate color="primary" />
        </div>

        <p v-else-if="todos.length === 0" class="text-body-1 mb-4">
          No todos in this list yet.
        </p>

        <v-list v-else lines="one" class="bg-transparent mb-4">
          <v-list-item
            v-for="todo in todos"
            :key="todo.id"
            class="mb-2 rounded-lg bg-surface"
          >
            <template #prepend>
              <v-checkbox
                :model-value="todo.completed"
                density="compact"
                hide-details
                @update:model-value="(value) => toggleTodoCompleted(todo, value)"
              />
            </template>

            <v-list-item-title
              :class="{
                'text-decoration-line-through text-medium-emphasis': todo.completed,
              }"
            >
              {{ todo.title }}
            </v-list-item-title>

            <template #append>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit todo"
                @click="openEditTodoDialog(todo)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                aria-label="Delete todo"
                @click="openDeleteTodoDialog(todo)"
              />
            </template>
          </v-list-item>
        </v-list>

        <div class="d-flex justify-end">
          <v-btn variant="text" @click="closeItemsDialog">
            Close
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddTodoDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">Add Item</v-card-title>

        <v-form ref="addTodoFormRef" @submit.prevent="handleAddTodo">
          <v-text-field
            v-model="addTodoTitle"
            label="Todo title"
            density="comfortable"
            rounded="lg"
            :rules="todoTitleRules"
            class="mb-4"
          />

          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="showAddTodoDialog = false">
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              :loading="addTodoLoading"
            >
              Add
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditTodoDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">Edit Item</v-card-title>

        <v-form ref="editTodoFormRef" @submit.prevent="handleEditTodo">
          <v-text-field
            v-model="editTodoTitle"
            label="Todo title"
            density="comfortable"
            rounded="lg"
            :rules="todoTitleRules"
            class="mb-4"
          />

          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="showEditTodoDialog = false">
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              :loading="editTodoLoading"
            >
              Save
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteTodoDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 text-primary px-0">Delete Item</v-card-title>
        <v-card-text class="px-0">
          Are you sure you want to delete
          <strong>{{ selectedTodo?.title }}</strong>?
        </v-card-text>

        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" @click="showDeleteTodoDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleteTodoLoading"
            @click="handleDeleteTodo"
          >
            Delete
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>
