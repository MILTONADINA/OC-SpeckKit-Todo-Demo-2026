import apiClient from "./services.js";
import Utils from "../config/utils.js";

const authServices = {
  registerUser(data) {
    return apiClient.post("register", data);
  },

  loginUser(data) {
    return apiClient.post("login", data);
  },

  logoutUser() {
    return apiClient.post("logout");
  },
};

export function persistUserSession(data) {
  Utils.setStore("user", data);
  window.dispatchEvent(new CustomEvent("user-logged-in"));
}

export function clearUserSession() {
  Utils.removeItem("user");
}

export default authServices;
