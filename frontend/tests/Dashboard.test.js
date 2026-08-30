/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

const getListsMock = vi.fn();
const createListMock = vi.fn();
const updateListMock = vi.fn();
const deleteListMock = vi.fn();
const getTodosMock = vi.fn();
const createTodoMock = vi.fn();
const updateTodoMock = vi.fn();
const deleteTodoMock = vi.fn();

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: (...args) => getListsMock(...args),
    createList: (...args) => createListMock(...args),
    updateList: (...args) => updateListMock(...args),
    deleteList: (...args) => deleteListMock(...args),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: (...args) => getTodosMock(...args),
    createTodo: (...args) => createTodoMock(...args),
    updateTodo: (...args) => updateTodoMock(...args),
    deleteTodo: (...args) => deleteTodoMock(...args),
  },
}));

const sampleUser = {
  userId: 1,
  username: "jdoe",
  fName: "Jane",
  lName: "Doe",
  token: "test-token",
  role: "worker",
};

function findButtonByText(wrapper, text) {
  return wrapper.findAll("button").find((button) => button.text().includes(text));
}

async function mountDashboard() {
  const mounted = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
    global: {
      stubs: {
        VDialog: {
          props: ["modelValue"],
          template: '<div v-if="modelValue" class="test-dialog"><slot /></div>',
        },
      },
    },
  });
  await flushPromises();
  return mounted;
}

function openDialogForm(wrapper) {
  return wrapper.find(".test-dialog form");
}

function findDialogContaining(wrapper, text) {
  return wrapper.findAll(".test-dialog").find((dialog) => dialog.text().includes(text));
}

function addTodoDialog(wrapper) {
  return wrapper
    .findAll(".test-dialog")
    .find((dialog) => dialog.text().includes("Todo title"));
}

async function openItemsDialog(wrapper, listName) {
  await wrapper.find(`[aria-label="View items for ${listName}"]`).trigger("click");
  await flushPromises();
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    getListsMock.mockReset();
    createListMock.mockReset();
    updateListMock.mockReset();
    deleteListMock.mockReset();
    getTodosMock.mockReset();
    createTodoMock.mockReset();
    updateTodoMock.mockReset();
    deleteTodoMock.mockReset();
    localStorage.clear();
    Utils.setStore("user", sampleUser);
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      getListsMock.mockResolvedValue({ data: [] });
      createListMock.mockResolvedValue({
        data: { id: 1, name: "Groceries", userId: 1 },
      });

      const { wrapper } = await mountDashboard();

      await findButtonByText(wrapper, "New List").trigger("click");
      await flushPromises();

      const dialogInput = openDialogForm(wrapper).find("input");
      await dialogInput.setValue("Groceries");
      await openDialogForm(wrapper).trigger("submit.prevent");
      await flushPromises();

      expect(createListMock).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      getListsMock.mockResolvedValue({ data: [] });

      const { wrapper } = await mountDashboard();

      await findButtonByText(wrapper, "New List").trigger("click");
      await flushPromises();

      await openDialogForm(wrapper).trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("List name is required.");
      expect(createListMock).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      getListsMock.mockResolvedValue({
        data: [
          { id: 1, name: "Personal", userId: 1 },
          { id: 2, name: "Work", userId: 1 },
        ],
      });

      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      getListsMock.mockResolvedValue({ data: [] });

      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      updateListMock.mockResolvedValue({
        data: { id: 1, name: "Shopping", userId: 1 },
      });

      const { wrapper } = await mountDashboard();

      await wrapper.find('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const dialogInput = openDialogForm(wrapper).find("input");
      await dialogInput.setValue("Shopping");
      await openDialogForm(wrapper).trigger("submit.prevent");
      await flushPromises();

      expect(updateListMock).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      deleteListMock.mockResolvedValue({});

      const { wrapper } = await mountDashboard();

      await wrapper.find('[aria-label="Delete list"]').trigger("click");
      await flushPromises();

      await findButtonByText(wrapper.find(".test-dialog"), "Delete").trigger("click");
      await flushPromises();

      expect(deleteListMock).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
    });
  });
});

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    getListsMock.mockReset();
    createListMock.mockReset();
    updateListMock.mockReset();
    deleteListMock.mockReset();
    getTodosMock.mockReset();
    createTodoMock.mockReset();
    updateTodoMock.mockReset();
    deleteTodoMock.mockReset();
    localStorage.clear();
    Utils.setStore("user", sampleUser);
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({ data: [] });
      createTodoMock.mockResolvedValue({
        data: {
          id: 10,
          title: "Buy milk",
          listId: 1,
          userId: 1,
          completed: false,
        },
      });

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Groceries");

      await findButtonByText(findDialogContaining(wrapper, "— Items"), "+ Add Item").trigger("click");
      await flushPromises();

      const addDialog = addTodoDialog(wrapper);
      await addDialog.find("input").setValue("Buy milk");
      await addDialog.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(createTodoMock).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(wrapper.text()).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({ data: [] });

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Groceries");

      await findButtonByText(findDialogContaining(wrapper, "— Items"), "+ Add Item").trigger("click");
      await flushPromises();

      const addDialog = addTodoDialog(wrapper);
      await addDialog.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Todo title is required.");
      expect(createTodoMock).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).not.toContain("+ Add Item");
      expect(getTodosMock).not.toHaveBeenCalled();
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 2, name: "Personal", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({ data: [] });

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Personal");

      expect(wrapper.text()).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      getListsMock.mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });
      getTodosMock
        .mockResolvedValueOnce({
          data: [{ id: 11, title: "Call mom", listId: 2, userId: 1, completed: false }],
        })
        .mockResolvedValueOnce({
          data: [
            { id: 12, title: "Email client", listId: 1, userId: 1, completed: false },
            { id: 13, title: "Write report", listId: 1, userId: 1, completed: false },
          ],
        });

      const { wrapper } = await mountDashboard();

      await openItemsDialog(wrapper, "Personal");
      expect(wrapper.text()).toContain("Call mom");
      expect(wrapper.text()).not.toContain("Email client");

      await findButtonByText(findDialogContaining(wrapper, "— Items"), "Close").trigger("click");
      await flushPromises();

      await openItemsDialog(wrapper, "Work");
      expect(wrapper.text()).toContain("Email client");
      expect(wrapper.text()).toContain("Write report");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", listId: 1, userId: 1, completed: false }],
      });
      updateTodoMock.mockResolvedValue({
        data: { id: 10, title: "Buy milk", listId: 1, userId: 1, completed: true },
      });

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Groceries");

      await wrapper.find('input[type="checkbox"]').setValue(true);
      await flushPromises();

      expect(updateTodoMock).toHaveBeenCalledWith(10, { completed: true });
      expect(wrapper.find(".text-decoration-line-through").exists()).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", listId: 1, userId: 1, completed: true }],
      });
      updateTodoMock.mockResolvedValue({
        data: { id: 10, title: "Buy milk", listId: 1, userId: 1, completed: false },
      });

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Groceries");

      await wrapper.find('input[type="checkbox"]').setValue(false);
      await flushPromises();

      expect(updateTodoMock).toHaveBeenCalledWith(10, { completed: false });
      expect(wrapper.find(".text-decoration-line-through").exists()).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", listId: 1, userId: 1, completed: false }],
      });
      updateTodoMock.mockResolvedValue({
        data: { id: 10, title: "Buy oat milk", listId: 1, userId: 1, completed: false },
      });

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Groceries");

      await wrapper.find('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();

      const editDialog = findDialogContaining(wrapper, "Edit Item");
      await editDialog.find("input").setValue("Buy oat milk");
      await editDialog.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(updateTodoMock).toHaveBeenCalledWith(10, { title: "Buy oat milk" });
      expect(wrapper.text()).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      getListsMock.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodosMock.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", listId: 1, userId: 1, completed: false }],
      });
      deleteTodoMock.mockResolvedValue({});

      const { wrapper } = await mountDashboard();
      await openItemsDialog(wrapper, "Groceries");

      await wrapper.find('[aria-label="Delete todo"]').trigger("click");
      await flushPromises();

      const deleteDialog = findDialogContaining(wrapper, "Delete Item");
      await findButtonByText(deleteDialog, "Delete").trigger("click");
      await flushPromises();

      expect(deleteTodoMock).toHaveBeenCalledWith(10);
      expect(wrapper.text()).not.toContain("Buy milk");
    });
  });
});
