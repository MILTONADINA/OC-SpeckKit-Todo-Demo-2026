import apiClient from "./services.js";

const userServices = {
  getUser(userId) {
    return apiClient.get(`users/${userId}`);
  },

  updateUser(userId, data) {
    return apiClient.put(`users/${userId}`, data);
  },
};

export default userServices;
