const root = document.documentElement;
const themeToggle = document.querySelector("#theme-toggle");
const dialog = document.querySelector("#auth-dialog");
const keyDialog = document.querySelector("#key-dialog");
const authForm = document.querySelector("#auth-form");
const authTitle = document.querySelector("#dialog-title");
const authDescription = document.querySelector("#dialog-description");
const authPassword = document.querySelector("#password");
const authSubmit = document.querySelector("#auth-submit");
const authNotice = document.querySelector("#form-notice");
const accountGate = document.querySelector("#account-gate");
const dashboard = document.querySelector("#dashboard");
const channelForm = document.querySelector("#channel-form");
const channelNotice = document.querySelector("#channel-notice");
const channelSubmit = document.querySelector("#channel-submit");
const channelList = document.querySelector("#channel-list");
const channelCount = document.querySelector("#channel-count");
const keyDialogValue = document.querySelector("#key-dialog-value");
const keyNotice = document.querySelector("#key-notice");
const keyCopy = document.querySelector("#key-copy");

let authMode = "register";
let currentUser = null;
let channels = [];
let activeKey = "";
let activeKeyChannel = "";

const setNotice = (element, message = "", type = "") => {
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.toggle("is-success", type === "success");
};

root.dataset.theme = localStorage.getItem("streamix-theme") ||
  (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

function paintTheme() {
  const light = root.dataset.theme === "light";
  themeToggle.textContent = light ? "☾" : "☼";
  themeToggle.setAttribute("aria-label", light ? "Включить тёмную тему" : "Включить светлую тему");
}

paintTheme();
themeToggle.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("streamix-theme", root.dataset.theme);
  paintTheme();
});

function openAuth(mode) {
  authMode = mode;
  const register = mode === "register";
  authTitle.textContent = register ? "Создать аккаунт" : "Войти в STREAMIX";
  authDescription.textContent = register
    ? "Регистрация позволит управлять собственными телеканалами. Создавать канал сразу необязательно."
    : "Войди в аккаунт, чтобы управлять своими телеканалами.";
  authPassword.autocomplete = register ? "new-password" : "current-password";
  authPassword.value = "";
  authSubmit.textContent = register ? "Зарегистрироваться" : "Войти";
  setNotice(authNotice);
  dialog.showModal();
}

function renderAccount(user) {
  currentUser = user || null;
  const actions = document.querySelector(".top-actions");
  actions.querySelector("#login-open")?.remove();
  actions.querySelector("#register-open")?.remove();
  actions.querySelector("#account-email")?.remove();
  actions.querySelector("#logout-button")?.remove();

  if (currentUser) {
    const email = document.createElement("span");
    email.id = "account-email";
    email.className = "account-email";
    email.textContent = currentUser.email;
    const logoutButton = document.createElement("button");
    logoutButton.id = "logout-button";
    logoutButton.className = "button button-quiet";
    logoutButton.type = "button";
    logoutButton.textContent = "Выйти";
    logoutButton.addEventListener("click", logout);
    actions.append(email, logoutButton);
  } else {
    const login = document.createElement("button");
    login.id = "login-open";
    login.className = "button button-quiet";
    login.type = "button";
    login.textContent = "Войти";
    login.addEventListener("click", () => openAuth("login"));
    const register = document.createElement("button");
    register.id = "register-open";
    register.className = "button button-primary";
    register.type = "button";
    register.textContent = "Регистрация";
    register.addEventListener("click", () => openAuth("register"));
    actions.append(login, register);
  }

  accountGate.hidden = !!currentUser;
  dashboard.hidden = !currentUser;
  const heroRegister = document.querySelector("#hero-register");
  heroRegister.textContent = currentUser ? "Аккаунт активен" : "Создать аккаунт";
  heroRegister.disabled = !!currentUser;
  channelCount.textContent = currentUser ? "Управление твоими телеканалами" : "Войди, чтобы управлять телеканалами";
  if (!currentUser) {
    channels = [];
    channelList.replaceChildren();
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.headers || {}) }
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error("Сервер вернул некорректный ответ."); }
  if (!response.ok) throw new Error(data.error || `Ошибка запроса (${response.status}).`);
  return data;
}

async function refreshChannels() {
  if (!currentUser) return;
  channelList.replaceChildren(makeMessageCard("Загружаем твои каналы…"));
  try {
    const data = await api("/api/channels");
    channels = Array.isArray(data.channels) ? data.channels : [];
    renderChannels();
  } catch (error) {
    channelList.replaceChildren(makeMessageCard(error.message, true));
  }
}

function makeMessageCard(message, error = false) {
  const box = document.createElement("div");
  box.className = "empty-channels";
  if (error) box.style.color = "var(--danger)";
  box.textContent = message;
  return box;
}

function renderChannels() {
  channelList.replaceChildren();
  channelCount.textContent = `${channels.length} ${channels.length === 1 ? "канал" : channels.length > 1 && channels.length < 5 ? "канала" : "каналов"}`;
  if (!channels.length) {
    channelList.append(makeMessageCard("Пока нет каналов. Создай первый с помощью формы выше."));
    return;
  }

  for (const channel of channels) {
    const card = document.createElement("article");
    card.className = "channel-card";
    card.dataset.channelId = channel.id;

    const top = document.createElement("div");
    top.className = "channel-card-top";
    const avatar = document.createElement("div");
    avatar.className = "channel-avatar";
    avatar.textContent = String(channel.name || "S").trim().charAt(0).toUpperCase() || "S";
    const meta = document.createElement("div");
    meta.className = "channel-meta";
    const name = document.createElement("h4");
    name.textContent = channel.name;
    const slug = document.createElement("div");
    slug.className = "channel-slug";
    slug.textContent = `Адрес: ${channel.slug}`;
    meta.append(name, slug);
    top.append(avatar, meta);

    const description = document.createElement("p");
    description.className = "channel-description";
    description.textContent = channel.description || "Описание канала пока не добавлено.";

    const actions = document.createElement("div");
    actions.className = "channel-actions";
    actions.append(
      makeAction("key-view", "Показать RTMP-ключ", channel.id, "button button-outline"),
      makeAction("key-reset", "Сбросить ключ", channel.id, "button button-danger")
    );

    const keyArea = document.createElement("div");
    keyArea.className = "key-inline";
    keyArea.hidden = true;
    const label = document.createElement("div");
    label.className = "key-inline-label";
    label.textContent = "RTMP-КЛЮЧ";
    const value = document.createElement("code");
    value.className = "key-inline-value";
    const copy = makeAction("key-copy", "Копировать", channel.id, "button button-outline");
    keyArea.append(label, value, copy);

    card.append(top, description, actions, keyArea);
    channelList.append(card);
  }
}

function makeAction(action, text, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = text;
  return button;
}

function showCardKey(channelId, key) {
  const card = channelList.querySelector(`[data-channel-id="${CSS.escape(channelId)}"]`);
  if (!card) return;
  const keyArea = card.querySelector(".key-inline");
  keyArea.querySelector(".key-inline-value").textContent = key;
  keyArea.hidden = false;
  keyArea.querySelector('[data-action="key-copy"]').dataset.key = key;
}

channelList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  button.disabled = true;
  try {
    if (action === "key-view") {
      const data = await api(`/api/channels/${encodeURIComponent(id)}/key`);
      showCardKey(id, data.streamKey);
    } else if (action === "key-reset") {
      if (!confirm("Сбросить RTMP-ключ? Старый ключ будет заменён.")) return;
      const data = await api(`/api/channels/${encodeURIComponent(id)}/key/reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      showCardKey(id, data.streamKey);
      button.textContent = "Ключ обновлён";
      setTimeout(() => { if (button.isConnected) button.textContent = "Сбросить ключ"; }, 1800);
    } else if (action === "key-copy") {
      const key = button.dataset.key || button.closest(".key-inline")?.querySelector(".key-inline-value")?.textContent;
      if (!key) throw new Error("Сначала открой RTMP-ключ.");
      await navigator.clipboard.writeText(key);
      button.textContent = "Скопировано";
      setTimeout(() => { if (button.isConnected) button.textContent = "Копировать"; }, 1500);
    }
  } catch (error) {
    alert(error.message || "Не удалось выполнить действие.");
  } finally {
    button.disabled = false;
  }
});

channelForm.addEventListener("submit", async event => {
  event.preventDefault();
  channelSubmit.disabled = true;
  setNotice(channelNotice, "Создаём канал…");
  const payload = {
    name: document.querySelector("#channel-name").value.trim(),
    slug: document.querySelector("#channel-slug").value.trim().toLowerCase(),
    description: document.querySelector("#channel-description").value.trim()
  };
  try {
    const data = await api("/api/channels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    channelForm.reset();
    setNotice(channelNotice, "Канал создан. Сохрани RTMP-ключ в надёжном месте.", "success");
    await refreshChannels();
    activeKey = data.streamKey;
    activeKeyChannel = data.channel.id;
    openKeyDialog(data.streamKey, data.channel.name, true);
  } catch (error) {
    setNotice(channelNotice, error.message, "error");
  } finally {
    channelSubmit.disabled = false;
  }
});

function openKeyDialog(key, channelName, firstView = false) {
  activeKey = key;
  keyDialogValue.textContent = key;
  document.querySelector("#key-dialog-title").textContent = `RTMP-ключ: ${channelName || "канал"}`;
  setNotice(keyNotice, firstView ? "Скопируй ключ сейчас. Повторно посмотреть его можно в карточке канала." : "Ключ загружен.", "success");
  keyDialog.showModal();
}

keyCopy.addEventListener("click", async () => {
  if (!activeKey) return;
  try {
    await navigator.clipboard.writeText(activeKey);
    setNotice(keyNotice, "Ключ скопирован.", "success");
  } catch {
    setNotice(keyNotice, "Браузер не разрешил копирование. Выдели ключ и скопируй вручную.", "error");
  }
});

function bindOpenButtons() {
  document.querySelector("#login-open")?.addEventListener("click", () => openAuth("login"));
  document.querySelector("#register-open")?.addEventListener("click", () => openAuth("register"));
}

for (const id of ["hero-register", "gate-register"]) {
  document.querySelector(`#${id}`).addEventListener("click", () => openAuth("register"));
}
document.querySelector("#gate-login").addEventListener("click", () => openAuth("login"));

// The header buttons are present at first render; renderAccount recreates them after auth changes.
bindOpenButtons();

async function logout() {
  try {
    await api("/api/logout", { method: "POST" });
  } finally {
    renderAccount(null);
  }
}

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  authSubmit.disabled = true;
  setNotice(authNotice, "Выполняем вход…");
  try {
    const data = await api(authMode === "register" ? "/api/register" : "/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: document.querySelector("#email").value.trim(),
        password: authPassword.value
      })
    });
    renderAccount(data.user);
    authForm.reset();
    dialog.close();
    await refreshChannels();
  } catch (error) {
    setNotice(authNotice, error.message || "Ошибка соединения.", "error");
  } finally {
    authSubmit.disabled = false;
  }
});

async function refreshSession() {
  try {
    const data = await api("/api/me");
    renderAccount(data.authenticated ? data.user : null);
    if (data.authenticated) await refreshChannels();
  } catch {
    renderAccount(null);
  }
}

refreshSession();
