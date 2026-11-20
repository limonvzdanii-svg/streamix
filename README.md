# STREAMIX 2.0

Платформа интернет-телевидения: просмотр прямых эфиров и возможность создавать собственные каналы.

## Реализовано
- Адаптивная главная и светлая/тёмная темы.
- Серверная регистрация, вход, проверка сессии и выход на Cloudflare Workers + D1.
- Пароли хешируются PBKDF2-HMAC-SHA-256 (310 000 итераций, индивидуальная случайная соль).
- Сессионные токены хранятся в D1 только в виде SHA-256-хеша; браузер получает HttpOnly, Secure, SameSite=Lax cookie на 30 дней.
- Регистрация не создаёт канал автоматически.

## Настройка Cloudflare
1. Установить Wrangler: `npm install -D wrangler`.
2. Создать базу: `npx wrangler d1 create streamix-db`.
3. Подставить выданный `database_id` в `wrangler.jsonc`.
4. Применить миграцию локально: `npx wrangler d1 migrations apply streamix-db --local`.
5. Применить к production D1: `npx wrangler d1 migrations apply streamix-db --remote`.
6. Запуск: `npx wrangler dev`. Публикация: `npx wrangler deploy`.

## API
- `GET /api/health`
- `GET /api/me`
- `POST /api/register` — JSON: email, password
- `POST /api/login` — JSON: email, password
- `POST /api/logout`

## Дальше
- [ ] Создание и редактирование каналов (по желанию).
- [ ] Постоянные отдельные ключи каналов с серверным хранением и сбросом.
- [ ] Каталог и страницы каналов.
- [ ] RTMP ingest для трансляций из OBS.
- [ ] Архив и программа передач.

**Важно:** ключи трансляций ещё не реализованы. Их нельзя хранить в cookie или localStorage. Для них будет отдельная серверная модель.