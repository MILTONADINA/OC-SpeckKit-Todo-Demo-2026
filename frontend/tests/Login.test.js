/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import { mountWithPlugins } from "./testUtils.js";

const loginUserMock = vi.fn();

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: (...args) => loginUserMock(...args),
  },
  persistUserSession: vi.fn(),
}));

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    loginUserMock.mockReset();
    localStorage.clear();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      loginUserMock.mockRejectedValue({
        response: { data: { message: "Invalid username or password." } },
      });

      const { wrapper } = await mountWithPlugins(Login);

      await wrapper.find('input[autocomplete="username"]').setValue("jdoe");
      await wrapper.find('input[autocomplete="current-password"]').setValue("wrongpassword");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(loginUserMock).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);

      await wrapper.find('input[autocomplete="current-password"]').setValue("password123");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is required.");
      expect(loginUserMock).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);

      await wrapper.find('input[autocomplete="username"]').setValue("jdoe");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password is required.");
      expect(loginUserMock).not.toHaveBeenCalled();
    });
  });
});
