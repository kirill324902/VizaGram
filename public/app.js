const socket = io();
const $ = (id) => document.getElementById(id);

const LS_SAVED = "vizagram_saved_one";
const LS_THEME = "vizagram_theme";
const LS_TOKEN = "vizagram_token";

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const authScreen = $("authScreen");
const appScreen = $("appScreen");

const themeBtnAuth = $("themeBtnAuth");

const welcomePanel = $("welcomePanel");
const btnGoLogin = $("btnGoLogin");
const btnGoRegister = $("btnGoRegister");
const btnBackFromLogin = $("btnBackFromLogin");
const btnBackFromRegister = $("btnBackFromRegister");

const loginPanel = $("loginPanel");
const registerPanel = $("registerPanel");

const savedEmpty = $("savedEmpty");
const savedOne = $("savedOne");
const savedName = $("savedName");
const savedUser = $("savedUser");
const savedAvatar = $("savedAvatar");
const btnUseSaved = $("btnUseSaved");
const btnDeleteSaved = $("btnDeleteSaved");

const loginUser = $("loginUser");
const loginPass = $("loginPass");
const adminPassWrap = $("adminPassWrap");
const loginAdminPass = $("loginAdminPass");
const btnLogin = $("btnLogin");

const regName = $("regName");
const regSurname = $("regSurname");
const regUser = $("regUser");
const regAdminPassWrap = $("regAdminPassWrap");
const regAdminPass = $("regAdminPass");
const regPass = $("regPass");
const regPass2 = $("regPass2");
const regAbout = $("regAbout");
const btnRegister = $("btnRegister");

const meName = $("meName");
const meUser = $("meUser");
const meAvatar = $("meAvatar");

const btnProfile = $("btnProfile");
const btnAdmin = $("btnAdmin");

const searchInput = $("searchInput");
const btnSearch = $("btnSearch");
const searchResults = $("searchResults");

const chats = $("chats");
const chatTitle = $("chatTitle");
const chatAvatar = $("chatAvatar");
const chatStatus = $("chatStatus");
const messages = $("messages");

const msgForm = $("msgForm");
const msgInput = $("msgInput");
const btnSend = $("btnSend");

const profileModal = $("profileModal");
const btnCloseProfile = $("btnCloseProfile");
const proName = $("proName");
const proSurname = $("proSurname");
const proUser = $("proUser");
const proAbout = $("proAbout");
const btnSaveProfile = $("btnSaveProfile");
const btnLogout = $("btnLogout");
const btnChangePass = $("btnChangePass");
const themeDarkBtn = $("themeDarkBtn");
const themeLightBtn = $("themeLightBtn");

const adminModal = $("adminModal");
const btnCloseAdmin = $("btnCloseAdmin");
const adminUsers = $("adminUsers");

/* MOBILE */
const btnMobileBack = $("btnMobileBack");
function isMobile() { return window.matchMedia("(max-width: 900px)").matches; }
function openMobileChat() { if (isMobile()) document.body.classList.add("mobile-chat-open"); }
function closeMobileChat() { document.body.classList.remove("mobile-chat-open"); }
btnMobileBack?.addEventListener("click", closeMobileChat);
window.addEventListener("resize", () => { if (!isMobile()) closeMobileChat(); });

let state = {
  me: null,
  isAdmin: false,
  theme: "dark",
  chats: [],
  activeChatId: ""
};

/* ===== THEME ===== */
function setTheme(next) {
  state.theme = next === "light" ? "light" : "dark";
  document.body.classList.toggle("theme-light", state.theme === "light");
  document.body.classList.toggle("theme-dark", state.theme !== "light");
  localStorage.setItem(LS_THEME, state.theme);
}
function toggleTheme() { setTheme(state.theme === "dark" ? "light" : "dark"); }

(function loadTheme() {
  const t = localStorage.getItem(LS_THEME);
  if (t) setTheme(t);
})();
themeBtnAuth?.addEventListener("click", toggleTheme);
themeDarkBtn?.addEventListener("click", () => setTheme("dark"));
themeLightBtn?.addEventListener("click", () => setTheme("light"));

/* ===== AUTH UI ===== */
function showWelcome() {
  welcomePanel?.classList.remove("hidden");
  loginPanel?.classList.add("hidden");
  registerPanel?.classList.add("hidden");
}
function showLogin() {
  welcomePanel?.classList.add("hidden");
  loginPanel?.classList.remove("hidden");
  registerPanel?.classList.add("hidden");
  renderSaved();
  refreshAdminField();
}
function showRegister() {
  welcomePanel?.classList.add("hidden");
  loginPanel?.classList.add("hidden");
  registerPanel?.classList.remove("hidden");
  refreshRegAdminField();
}

btnGoLogin?.addEventListener("click", showLogin);
btnGoRegister?.addEventListener("click", showRegister);
btnBackFromLogin?.addEventListener("click", showWelcome);
btnBackFromRegister?.addEventListener("click", showWelcome);

/* ===== SAVED ACCOUNT ===== */
function getSaved() {
  try { return JSON.parse(localStorage.getItem(LS_SAVED) || "null"); } catch { return null; }
}
function setSaved(profile) {
  localStorage.setItem(LS_SAVED, JSON.stringify({
    username: profile.username,
    name: profile.name,
    surname: profile.surname || ""
  }));
  renderSaved();
}
function clearSaved() {
  localStorage.removeItem(LS_SAVED);
  renderSaved();
}
function renderSaved() {
  const s = getSaved();
  if (!savedEmpty || !savedOne) return;

  if (!s) {
    savedOne.classList.add("hidden");
    savedEmpty.classList.remove("hidden");
    return;
  }
  savedEmpty.classList.add("hidden");
  savedOne.classList.remove("hidden");
  savedName.textContent = `${s.name} ${s.surname}`.trim() || `@${s.username}`;
  savedUser.textContent = `@${s.username}`;
  savedAvatar.textContent = (s.name || "A").slice(0, 1).toUpperCase();
}
renderSaved();

btnDeleteSaved?.addEventListener("click", () => {
  if (confirm("Удалить сохранённый аккаунт?")) clearSaved();
});

btnUseSaved?.addEventListener("click", () => {
  const s = getSaved();
  if (!s?.username) return;
  loginUser.value = "@" + s.username;
  refreshAdminField();
  loginPass.focus();
});

/* ===== admin field show/hide ===== */
function refreshAdminField() {
  const u = (loginUser.value || "").trim().replace(/^@/, "").toLowerCase();
  if (u === "admin") adminPassWrap.classList.remove("hidden");
  else {
    adminPassWrap.classList.add("hidden");
    loginAdminPass.value = "";
  }
}
loginUser?.addEventListener("input", refreshAdminField);

function refreshRegAdminField() {
  const u = (regUser.value || "").trim().replace(/^@/, "").toLowerCase();
  if (u === "admin") regAdminPassWrap.classList.remove("hidden");
  else {
    regAdminPassWrap.classList.add("hidden");
    regAdminPass.value = "";
  }
}
regUser?.addEventListener("input", refreshRegAdminField);

/* ===== LOGIN ===== */
btnLogin?.addEventListener("click", () => {
  const username = (loginUser.value || "").trim();
  const password = (loginPass.value || "").trim();
  const adminPass = (loginAdminPass.value || "").trim();

  socket.emit("auth:login", { username, password, adminPass }, async (res) => {
    if (!res?.ok) return alert(res?.error || "Не удалось войти");
    if (res.token) localStorage.setItem(LS_TOKEN, res.token);
    await afterLogin(res.profile, res.isAdmin);
    loginPass.value = "";
    loginAdminPass.value = "";
  });
});

/* ===== REGISTER ===== */
btnRegister?.addEventListener("click", () => {
  const payload = {
    name: regName.value.trim(),
    surname: regSurname.value.trim(),
    username: regUser.value.trim(),
    password: regPass.value,
    password2: regPass2.value,
    about: regAbout.value.trim(),
    adminPass: regAdminPass.value.trim()
  };

  socket.emit("auth:register", payload, (res) => {
    if (!res?.ok) return alert(res?.error || "Не удалось зарегистрироваться");

    socket.emit("auth:login", { username: payload.username, password: payload.password, adminPass: payload.adminPass }, async (r) => {
      if (!r?.ok) return alert(r?.error || "Не удалось войти");
      if (r.token) localStorage.setItem(LS_TOKEN, r.token);
      await afterLogin(r.profile, r.isAdmin);

      regPass.value = "";
      regPass2.value = "";
      regAdminPass.value = "";
    });
  });
});

function fillProfileModal(profile) {
  if (!profile) return;
  proName.value = profile.name || "";
  proSurname.value = profile.surname || "";
  proUser.value = profile.username || "";
  proAbout.value = profile.about || "";
}

async function afterLogin(profile, isAdmin) {
  closeMobileChat();

  state.me = profile;
  state.isAdmin = !!isAdmin;

  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  meName.textContent = `${profile.name} ${profile.surname || ""}`.trim();
  meUser.textContent = `@${profile.username}`;
  meAvatar.textContent = (profile.name || "A").slice(0, 1).toUpperCase();

  if (profile.theme) setTheme(profile.theme);
  fillProfileModal(profile);
  setSaved(profile);

  btnAdmin?.classList.toggle("hidden", !isAdmin);
}

/* ===== PROFILE ===== */
btnProfile?.addEventListener("click", () => {
  profileModal.classList.remove("hidden");
});
btnCloseProfile?.addEventListener("click", () => profileModal.classList.add("hidden"));

btnSaveProfile?.addEventListener("click", () => {
  socket.emit("profile:update", {
    name: proName.value.trim(),
    surname: proSurname.value.trim(),
    about: proAbout.value.trim(),
    theme: state.theme
  }, (res) => {
    if (!res?.ok) return alert(res?.error || "Не сохранилось");

    state.me = res.profile;
    meName.textContent = `${state.me.name} ${state.me.surname || ""}`.trim();
    meUser.textContent = `@${state.me.username}`;
    meAvatar.textContent = (state.me.name || "A").slice(0, 1).toUpperCase();

    fillProfileModal(state.me);
    setSaved(state.me);
    alert("Сохранено!");
  });
});

btnChangePass?.addEventListener("click", () => {
  const oldPass = prompt("Старый пароль:");
  if (!oldPass) return;

  const newPass = prompt("Новый пароль:");
  if (!newPass) return;

  const newPass2 = prompt("Повторите новый пароль:");
  if (!newPass2) return;

  let adminPass = "";
  if (state.me?.username === "admin") {
    adminPass = prompt("Админ пароль:") || "";
    if (!adminPass) return;
  }

  socket.emit("auth:changePassword", { oldPass, newPass, newPass2, adminPass }, (res) => {
    if (!res?.ok) return alert(res?.error || "Не удалось сменить пароль");
    alert("Пароль изменён!");
  });
});

btnLogout?.addEventListener("click", () => {
  const token = localStorage.getItem(LS_TOKEN) || "";
  socket.emit("auth:logout", { token }, () => {
    localStorage.removeItem(LS_TOKEN);

    closeMobileChat();
    profileModal.classList.add("hidden");
    adminModal.classList.add("hidden");

    state.me = null;
    state.isAdmin = false;
    state.chats = [];
    state.activeChatId = "";

    chats.innerHTML = "";
    messages.innerHTML = "";
    chatTitle.textContent = "Выбери чат";
    chatStatus.textContent = "—";
    msgInput.value = "";

    btnAdmin?.classList.add("hidden");

    appScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");
    showWelcome();
    refreshAdminField();
  });
});

/* ===== ADMIN PANEL ===== */
btnAdmin?.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
  loadAdminUsers();
});
btnCloseAdmin?.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

function loadAdminUsers() {
  socket.emit("admin:listUsers", {}, (res) => {
    if (!res?.ok) return alert(res?.error || "Не удалось загрузить пользователей");
    renderAdminUsers(res.users || []);
  });
}

function renderAdminUsers(list) {
  adminUsers.innerHTML = "";

  if (!list.length) {
    adminUsers.innerHTML = `<div class="muted" style="padding:10px;">Нет пользователей</div>`;
    return;
  }

  for (const u of list) {
    const row = document.createElement("div");
    row.className = "adminUserRow";

    const meta = document.createElement("div");
    meta.className = "adminUserMeta";
    const name = `${u.name} ${u.surname || ""}`.trim() || `@${u.username}`;
    meta.innerHTML = `<b>${name}</b><span class="muted">@${u.username}</span>`;

    const select = document.createElement("select");
    [
      { v: 10, t: "10 мин" },
      { v: 15, t: "15 мин" },
      { v: 30, t: "30 мин" },
      { v: 60, t: "1 час" }
    ].forEach(o => {
      const opt = document.createElement("option");
      opt.value = String(o.v);
      opt.textContent = o.t;
      select.appendChild(opt);
    });

    const actions = document.createElement("div");
    actions.className = "adminUserActions";

    const btnMute = document.createElement("button");
    btnMute.className = "btn danger soft";
    btnMute.type = "button";
    btnMute.textContent = "Мут";

    const btnUnmute = document.createElement("button");
    btnUnmute.className = "btn";
    btnUnmute.type = "button";
    btnUnmute.textContent = "Снять";

    const mutedText = document.createElement("div");
    mutedText.className = "muted";
    mutedText.style.marginLeft = "10px";
    mutedText.textContent = u.mutedUntil
      ? `мут до ${new Date(u.mutedUntil).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`
      : "";

    btnMute.onclick = () => {
      const minutes = Number(select.value);
      socket.emit("admin:muteUser", { username: u.username, minutes }, (res) => {
        if (!res?.ok) return alert(res?.error || "Не удалось замутить");
        loadAdminUsers();
      });
    };

    btnUnmute.onclick = () => {
      socket.emit("admin:unmuteUser", { username: u.username }, (res) => {
        if (!res?.ok) return alert(res?.error || "Не удалось снять мут");
        loadAdminUsers();
      });
    };

    actions.appendChild(select);
    actions.appendChild(btnMute);
    actions.appendChild(btnUnmute);

    row.appendChild(meta);
    row.appendChild(actions);
    row.appendChild(mutedText);

    adminUsers.appendChild(row);
  }
}

socket.on("admin:usersChanged", () => {
  if (!adminModal.classList.contains("hidden")) loadAdminUsers();
});

/* ===== CHATS ===== */
function renderChats(list) {
  state.chats = list || [];
  chats.innerHTML = "";

  (list || []).forEach((c) => {
    const row = document.createElement("div");
    row.className = "chatRow" + (c.id === state.activeChatId ? " active" : "");

    const avatar = document.createElement("div");
    avatar.className = "chatAvatar avatar";
    avatar.textContent = (c.title || "?").slice(0, 1).toUpperCase();

    const meta = document.createElement("div");
    meta.className = "chatMeta";

    const titleRow = document.createElement("div");
    titleRow.className = "chatTitleRow";

    const title = document.createElement("div");
    title.className = "chatTitle";
    title.textContent = c.title;
    titleRow.appendChild(title);

    if (c.unread > 0) {
      const b = document.createElement("div");
      b.className = "badge";
      b.textContent = String(c.unread);
      titleRow.appendChild(b);
    }

    const last = document.createElement("div");
    last.className = "chatLast";
    last.textContent = c.last || "";

    meta.appendChild(titleRow);
    meta.appendChild(last);

    row.appendChild(avatar);
    row.appendChild(meta);
    row.onclick = () => openChat(c.id);

    chats.appendChild(row);
  });
}

function openChat(chatId) {
  socket.emit("chat:open", { chatId }, (res) => {
    if (!res?.ok) alert(res?.error || "Не открылось");
  });
}

function renderMessages(chat) {
  state.activeChatId = chat.id;
  chatTitle.textContent = chat.title || "Чат";
  chatAvatar.textContent = (chat.title || "?").slice(0, 1).toUpperCase();

  messages.innerHTML = "";
  for (const m of chat.messages) {
    const bubble = document.createElement("div");
    bubble.className = "msg" + (m.sender === state.me.username ? " me" : "");
    bubble.textContent = m.text || "";
    messages.appendChild(bubble);
  }

  messages.scrollTop = messages.scrollHeight;
  openMobileChat();
}

msgForm?.addEventListener("submit", (e) => { e.preventDefault(); sendMessage(); });
btnSend?.addEventListener("click", sendMessage);

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  if (!state.activeChatId) return alert("Выбери чат.");

  socket.emit("msg:send", { chatId: state.activeChatId, text }, (res) => {
    if (!res?.ok) return alert(res?.error || "Не отправилось");
    msgInput.value = "";
  });
}

/* ===== SEARCH (live) ===== */
btnSearch?.addEventListener("click", doSearch);
const doSearchDebounced = debounce(doSearch, 250);

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.trim();
  if (!q) {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    return;
  }
  doSearchDebounced();
});
searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  socket.emit("search:user", { q }, (res) => {
    if (!res?.ok) return alert(res?.error || "Ошибка поиска");
    renderSearch(res.results || []);
  });
}

function renderSearch(list) {
  searchResults.innerHTML = "";
  searchResults.classList.remove("hidden");

  if (!list.length) {
    const div = document.createElement("div");
    div.className = "muted";
    div.style.padding = "8px";
    div.textContent = "Ничего не найдено.";
    searchResults.appendChild(div);
    return;
  }

  list.forEach((u) => {
    const row = document.createElement("div");
    row.className = "searchItem";
    row.textContent = `${u.name} ${u.surname || ""}`.trim() + `  @${u.username}`;

    row.onclick = () => {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
      searchInput.value = "";

      socket.emit("dm:open", { username: u.username }, (res) => {
        if (!res?.ok) return alert(res?.error || "Не удалось открыть чат");
        openChat(res.chatId);
      });
    };
    searchResults.appendChild(row);
  });
}

/* ===== SOCKET ===== */
socket.on("chats:list", (list) => {
  renderChats(list);
  if (!state.activeChatId && list?.length && state.me) {
    const pinned = list.find((c) => c.title === "Тех. Поддержка") || list[0];
    if (pinned) openChat(pinned.id);
  }
});
socket.on("chat:open", (chat) => {
  if (!state.me) return;
  renderMessages(chat);
});
socket.on("notify:newMessage", ({ chatId }) => {
  if (chatId && chatId === state.activeChatId) openChat(chatId);
});

/* ===== AUTLOGIN FIX: call session ONLY after socket connected ===== */
function tryRestoreSession() {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) return;

  socket.emit("auth:session", { token }, async (res) => {
    if (!res?.ok) {
      localStorage.removeItem(LS_TOKEN);
      return;
    }
    await afterLogin(res.profile, res.isAdmin);
  });
}

socket.on("connect", () => {
  // ✅ вот это лечит "после перезагрузки кидает на вход"
  tryRestoreSession();
});

/* INIT */
(function initUI() {
  showWelcome();
  refreshAdminField();
  refreshRegAdminField();
})();
