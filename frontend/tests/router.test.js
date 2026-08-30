/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import Utils from "../src/config/utils.js";
import Home from "../src/views/Home.vue";
import Login from "../src/views/Login.vue";
import Register from "../src/views/Register.vue";

function createAppRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        name: "home",
        component: Home,
        meta: { requiresAuth: true },
      },
      {
        path: "/login",
        name: "login",
        component: Login,
        meta: { guestOnly: true },
      },
      {
        path: "/register",
        name: "register",
        component: Register,
        meta: { guestOnly: true },
      },
    ],
  });
}

function applyAuthGuard(router) {
  router.beforeEach((to) => {
    const user = Utils.getStore("user");

    if (to.meta.requiresAuth && !user) {
      return { name: "login" };
    }

    if (to.meta.guestOnly && user) {
      return { name: "home" };
    }

    return true;
  });
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        username: "jdoe",
        token: "test-token",
        fName: "Jane",
        role: "worker",
      });

      const router = createAppRouter();
      applyAuthGuard(router);

      await router.push("/login");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const router = createAppRouter();
      applyAuthGuard(router);

      await router.push("/");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
