/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

const getUserMock = vi.fn();
const updateUserMock = vi.fn();
const logoutUserMock = vi.fn();
const persistUserSessionMock = vi.fn();
const clearUserSessionMock = vi.fn();

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: (...args) => getUserMock(...args),
    updateUser: (...args) => updateUserMock(...args),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: (...args) => logoutUserMock(...args),
  },
  persistUserSession: (...args) => persistUserSessionMock(...args),
  clearUserSession: (...args) => clearUserSessionMock(...args),
}));

const sampleUser = {
  userId: 1,
  username: "jdoe",
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  token: "test-token",
  role: "worker",
};

const sampleProfile = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  role: "worker",
};

function findButtonByText(wrapper, text) {
  return wrapper.findAll("button").find((button) => button.text().includes(text));
}

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      { path: "/login", name: "login", component: { template: "<div />" } },
    ],
  });

  await router.push("/");
  await router.isReady();

  return router;
}

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

async function mountMenuBar() {
  const router = await createTestRouter();
  const mounted = await mountWithPlugins(MenuBarHost, {
    attachTo: document.body,
    router,
    global: {
      stubs: {
        VMenu: {
          props: ["modelValue"],
          template: `
            <div>
              <slot name="activator" :props="{}" />
              <div class="test-menu"><slot /></div>
            </div>
          `,
        },
        VDialog: {
          props: ["modelValue"],
          template: '<div v-if="modelValue" class="test-dialog"><slot /></div>',
        },
      },
    },
  });

  await flushPromises();
  return { ...mounted, router };
}

async function openProfileMenu(wrapper) {
  await wrapper.find('[aria-label="Open profile menu"]').trigger("click");
  await flushPromises();
}

function profileMenu(wrapper) {
  return wrapper.find(".test-menu");
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    updateUserMock.mockReset();
    logoutUserMock.mockReset();
    persistUserSessionMock.mockReset();
    clearUserSessionMock.mockReset();
    localStorage.clear();
    Utils.setStore("user", sampleUser);
    getUserMock.mockResolvedValue({ data: sampleProfile });
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);

      expect(profileMenu(wrapper).text()).toContain("Jane Doe");
      expect(profileMenu(wrapper).text()).toContain("jdoe");
      expect(profileMenu(wrapper).text()).toContain("jane@example.com");
      expect(profileMenu(wrapper).text()).toContain("Edit Profile");
      expect(profileMenu(wrapper).text()).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      expect(getUserMock).toHaveBeenCalledWith(1);
      expect(wrapper.text()).toContain("Edit Profile");
      expect(wrapper.find('input[autocomplete="given-name"]').element.value).toBe("Jane");
      expect(wrapper.find('input[autocomplete="email"]').element.value).toBe("jane@example.com");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      await wrapper.find('input[autocomplete="given-name"]').setValue("Changed");
      await findButtonByText(wrapper.find(".test-dialog"), "Cancel").trigger("click");
      await flushPromises();

      expect(updateUserMock).not.toHaveBeenCalled();
      expect(wrapper.find(".test-dialog").exists()).toBe(false);
    });

    it("User saves profile changes", async () => {
      updateUserMock.mockResolvedValue({
        data: {
          id: 1,
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
          role: "worker",
        },
      });

      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      await wrapper.find('input[autocomplete="given-name"]').setValue("Janet");
      await wrapper.find('input[autocomplete="family-name"]').setValue("Smith");
      await wrapper.find('input[autocomplete="email"]').setValue("janet@example.com");
      await wrapper.find('input[autocomplete="username"]').setValue("jsmith");
      await wrapper.find(".test-dialog form").trigger("submit.prevent");
      await flushPromises();

      expect(updateUserMock).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(persistUserSessionMock).toHaveBeenCalled();
      expect(wrapper.find(".test-dialog").exists()).toBe(false);
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      await wrapper.find('input[autocomplete="email"]').setValue("notanemail");
      await wrapper.find(".test-dialog form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(updateUserMock).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      const passwordInputs = wrapper.findAll('input[autocomplete="new-password"]');
      await passwordInputs[0].setValue("password123");
      await passwordInputs[1].setValue("different123");
      await wrapper.find(".test-dialog form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(updateUserMock).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      const passwordInputs = wrapper.findAll('input[autocomplete="new-password"]');
      await passwordInputs[0].setValue("short");
      await passwordInputs[1].setValue("short");
      await wrapper.find(".test-dialog form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(updateUserMock).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      updateUserMock.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountMenuBar();

      await openProfileMenu(wrapper);
      await findButtonByText(profileMenu(wrapper), "Edit Profile").trigger("click");
      await flushPromises();

      await wrapper.find(".test-dialog form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is already taken.");
      expect(wrapper.find(".test-dialog").exists()).toBe(true);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      logoutUserMock.mockResolvedValue({});

      const { wrapper, router } = await mountMenuBar();

      await openProfileMenu(wrapper);

      const logoutItem = wrapper
        .findAll(".test-menu .v-list-item")
        .find((item) => item.text().includes("Log out"));
      await logoutItem.trigger("click");
      await flushPromises();

      expect(logoutUserMock).toHaveBeenCalled();
      expect(clearUserSessionMock).toHaveBeenCalled();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenuBar();

      expect(wrapper.text()).not.toContain("Sign out");
    });
  });
});
