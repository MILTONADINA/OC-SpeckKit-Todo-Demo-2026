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

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: (...args) => getListsMock(...args),
    createList: (...args) => createListMock(...args),
    updateList: (...args) => updateListMock(...args),
    deleteList: (...args) => deleteListMock(...args),
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

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    getListsMock.mockReset();
    createListMock.mockReset();
    updateListMock.mockReset();
    deleteListMock.mockReset();
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
