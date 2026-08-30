/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import { mountWithPlugins } from "./testUtils.js";

const registerUserMock = vi.fn();

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: (...args) => registerUserMock(...args),
  },
  persistUserSession: vi.fn(),
}));

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    registerUserMock.mockReset();
    localStorage.clear();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[type="email"]').setValue("notanemail");
      await wrapper.find('input[autocomplete="username"]').setValue("jdoe");
      await wrapper.find('input[autocomplete="new-password"]').setValue("password123");
      await wrapper.findAll('input[autocomplete="new-password"]')[1].setValue("password123");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(registerUserMock).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[autocomplete="given-name"]').setValue("Jane");
      await wrapper.find('input[autocomplete="family-name"]').setValue("Doe");
      await wrapper.find('input[type="email"]').setValue("jane@example.com");
      await wrapper.find('input[autocomplete="new-password"]').setValue("password123");
      await wrapper.findAll('input[autocomplete="new-password"]')[1].setValue("password123");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is required.");
      expect(registerUserMock).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[autocomplete="given-name"]').setValue("Jane");
      await wrapper.find('input[autocomplete="family-name"]').setValue("Doe");
      await wrapper.find('input[type="email"]').setValue("jane@example.com");
      await wrapper.find('input[autocomplete="username"]').setValue("jdoe");
      await wrapper.find('input[autocomplete="new-password"]').setValue("short");
      await wrapper.findAll('input[autocomplete="new-password"]')[1].setValue("short");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(registerUserMock).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[autocomplete="given-name"]').setValue("Jane");
      await wrapper.find('input[autocomplete="family-name"]').setValue("Doe");
      await wrapper.find('input[type="email"]').setValue("jane@example.com");
      await wrapper.find('input[autocomplete="username"]').setValue("jdoe");
      await wrapper.find('input[autocomplete="new-password"]').setValue("password123");
      await wrapper.findAll('input[autocomplete="new-password"]')[1].setValue("different123");
      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(registerUserMock).not.toHaveBeenCalled();
    });
  });
});
