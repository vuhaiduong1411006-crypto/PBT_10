// ─── State ───────────────────────────────────────────────
let allUsers = [];
let editingId = null;

// ─── UI Layer ────────────────────────────────────────────
const ui = {
  renderUsers(users) {
    const list = document.getElementById("user-list");

    if (users.length === 0) {
      list.innerHTML = `<div class="empty-state">Không tìm thấy user nào.</div>`;
      return;
    }

    list.innerHTML = users
      .map(
        (user) => `
      <div class="user-card" data-id="${user.id}">
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-email">✉️ ${user.email}</div>
          <div class="user-phone">📞 ${user.phone || "—"}</div>
          <div class="user-website">🌐 ${user.website || "—"}</div>
        </div>
        <div class="user-actions">
          <button class="btn-edit"   onclick="handleEdit(${user.id})">Edit</button>
          <button class="btn-delete" onclick="handleDelete(${user.id})">Delete</button>
        </div>
      </div>
    `,
      )
      .join("");
  },

  showLoading() {
    document.getElementById("user-list").innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
  },

  showSuccess(message) {
    this._showToast(message, "success");
  },

  showError(message) {
    this._showToast(message, "error");
  },

  _showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = type;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  },
};

// ─── Khởi động ───────────────────────────────────────────
async function init() {
  ui.showLoading();
  try {
    allUsers = await api.getUsers();
    ui.renderUsers(allUsers);
  } catch (error) {
    ui.showError("Không tải được danh sách user");
  }
}

// ─── Search (client-side) ────────────────────────────────
document.getElementById("search-input").addEventListener("input", function () {
  const keyword = this.value.toLowerCase().trim();
  const filtered = allUsers.filter((u) => u.name.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword));
  ui.renderUsers(filtered);
});

// ─── CREATE / UPDATE ─────────────────────────────────────
document.getElementById("add-btn").addEventListener("click", () => {
  editingId = null;
  document.getElementById("modal-title").textContent = "Thêm User";
  clearForm();
  document.getElementById("modal-overlay").style.display = "flex";
});

document.getElementById("form-cancel").addEventListener("click", closeModal);

document.getElementById("modal-overlay").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

document.getElementById("form-submit").addEventListener("click", handleSubmit);

async function handleSubmit() {
  const data = {
    name: document.getElementById("form-name").value.trim(),
    email: document.getElementById("form-email").value.trim(),
    phone: document.getElementById("form-phone").value.trim(),
    website: document.getElementById("form-website").value.trim(),
  };

  if (!data.name || !data.email) {
    ui.showError("Vui lòng nhập họ tên và email");
    return;
  }

  try {
    if (editingId) {
      // UPDATE
      const updated = await api.updateUser(editingId, data);
      const idx = allUsers.findIndex((u) => u.id === editingId);
      if (idx !== -1) allUsers[idx] = { ...allUsers[idx], ...data };
      ui.showSuccess("Cập nhật user thành công");
    } else {
      // CREATE
      const newUser = await api.createUser(data);
      // JSONPlaceholder trả id = 11, dùng tạm id ngẫu nhiên để tránh trùng
      newUser.id = Date.now();
      allUsers.unshift(newUser);
      ui.showSuccess("Thêm user thành công");
    }

    ui.renderUsers(allUsers);
    closeModal();
  } catch (error) {
    ui.showError("Có lỗi xảy ra, vui lòng thử lại");
  }
}

// ─── EDIT ────────────────────────────────────────────────
function handleEdit(id) {
  const user = allUsers.find((u) => u.id === id);
  if (!user) return;

  editingId = id;
  document.getElementById("modal-title").textContent = "Cập nhật User";
  document.getElementById("form-name").value = user.name;
  document.getElementById("form-email").value = user.email;
  document.getElementById("form-phone").value = user.phone || "";
  document.getElementById("form-website").value = user.website || "";
  document.getElementById("modal-overlay").style.display = "flex";
}

// ─── DELETE ──────────────────────────────────────────────
async function handleDelete(id) {
  const user = allUsers.find((u) => u.id === id);
  if (!user) return;

  const confirmed = confirm(`Xóa user "${user.name}"?`);
  if (!confirmed) return;

  try {
    await api.deleteUser(id);
    allUsers = allUsers.filter((u) => u.id !== id);
    ui.renderUsers(allUsers);
    ui.showSuccess(`Đã xóa user "${user.name}"`);
  } catch (error) {
    ui.showError("Xóa thất bại, vui lòng thử lại");
  }
}

// ─── Helpers ─────────────────────────────────────────────
function clearForm() {
  ["form-name", "form-email", "form-phone", "form-website"].forEach((id) => (document.getElementById(id).value = ""));
}

function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
  editingId = null;
  clearForm();
}

// ─── Start ───────────────────────────────────────────────
init();
