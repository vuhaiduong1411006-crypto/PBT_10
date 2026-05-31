const api = {
  baseURL: "https://jsonplaceholder.typicode.com",

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async getUsers() {
    return this.request("/users");
  },

  async getUser(id) {
    return this.request(`/users/${id}`);
  },

  async createUser(data) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id) {
    return this.request(`/users/${id}`, { method: "DELETE" });
  },
};
