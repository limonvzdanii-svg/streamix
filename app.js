const root = document.documentElement;
const themeToggle = document.querySelector("#theme-toggle");
const savedTheme = localStorage.getItem("streamix-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
root.dataset.theme = savedTheme || preferredTheme;

themeToggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("streamix-theme", next);
  themeToggle.textContent = next === "dark" ? "☼" : "☾";
  themeToggle.setAttribute("aria-label", next === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
});
themeToggle.textContent = root.dataset.theme === "dark" ? "☼" : "☾";

const dialog = document.querySelector("#auth-dialog");
const title = document.querySelector("#dialog-title");
const description = document.querySelector("#dialog-description");
const password = document.querySelector("#password");
const submit = document.querySelector("#auth-submit");
const notice = document.querySelector("#form-notice");

function openAuth(mode) {
  const registering = mode === "register";
  title.textContent = registering ? "Создать аккаунт" : "Войти в STREAMIX";
  description.textContent = registering
    ? "Регистрация позволит смотреть эфиры и при желании создать собственный канал."
    : "Войди в аккаунт, чтобы управлять своими каналами.";
  password.autocomplete = registering ? "new-password" : "current-password";
  submit.textContent = registering ? "Зарегистрироваться" : "Войти";
  notice.textContent = "Это интерфейсный прототип. Регистрация и вход пока не подключены.";
  dialog.showModal();
}

document.querySelectorAll("#register-open,#hero-register,#empty-register").forEach(button =>
  button.addEventListener("click", () => openAuth("register"))
);
document.querySelector("#login-open").addEventListener("click", () => openAuth("login"));
document.querySelector("#auth-form").addEventListener("submit", event => {
  event.preventDefault();
  notice.textContent = "Форма готова, но серверная авторизация ещё не подключена. Данные никуда не отправляются.";
});