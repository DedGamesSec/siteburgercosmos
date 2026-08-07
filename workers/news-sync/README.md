# TrustNode News Sync Worker

Cloudflare Worker, который по cron (каждые 15 минут) парсит Telegram-канал
TrustNode, переводит новые посты RU→EN и пушит обновлённый `src/data/news.json`
обратно в GitHub-репозиторий через GitHub Contents API.

## Зачем

Перевод новостей больше не выполняется на клиенте (`NewsSection` читает готовое
поле `en`). Это избавляет сайт от лишних API-запросов при каждой смене языка и
переводит текст ровно один раз при добавлении поста.

- `en` — готовый английский перевод, который отдаётся при выборе языка EN.
- Для языков, отличных от RU/EN, показывается оригинал (RU).

## Как это работает

1. `scheduled` (cron `*/15 * * * *`) или ручной `fetch` запускают `runSync`.
2. Worker парсит https://t.me/s/TrustNode_team (regex, без внешних зависимостей).
3. Опционально парсит VK (если задан `VK_ACCESS_TOKEN`).
4. Читает текущий `src/data/news.json` из репозитория (GitHub Contents API GET).
5. Мерджит новые посты, сортирует по дате.
6. Переводит посты без `en` (только русские, free Google endpoint, без ключа).
7. Если появились новые посты/переводы — пушит файл обратно (PUT + sha).

## Ограничение расходов

Переводится только то, что ещё не переведено (поле `en` отсутствует). Если пост
меняли вручную — он не будет переведён заново, пока не удалить поле `en`.

## Деплой

```bash
cd workers/news-sync
npm install

# Секреты (не в коде!)
npx wrangler secret put GITHUB_TOKEN
# → Personal Access Token (repo), минимум contents:read + contents:write
npx wrangler secret put VK_ACCESS_TOKEN   # необязательно, для VK-источника

# Переменные заданы в wrangler.toml (vars). Их можно переопределить:
npx wrangler deploy
# npx wrangler dev   # локальный запуск
```

Проверка настройки переменных:

- `GITHUB_REPO` — `owner/repo`, куда пушить (по умолчанию `DedGamesSec/sitedisgincheck`).
- `GITHUB_BRANCH` — ветка (по умолчанию `master`).
- `NEWS_PATH` — путь к news.json в репо (по умолчанию `src/data/news.json`).
- `TELEGRAM_WEB_URL` / `TELEGRAM_CHANNEL` — источник Telegram.
- `VK_DOMAIN` — источник VK (вместе с `VK_ACCESS_TOKEN`).

Ручной триггер для проверки:

```bash
curl "https://trustnode-news-sync.<account>.workers.dev/"
```

## Локальный разовый прогон перевода (если репозиторий не на GitHub)

```bash
npm run tsx scripts/translate-news.ts   # из корня проекта
```

Добавляет `en` для всех пунктов `src/data/news.json`, у которых его нет.

## Тест парсера локально

```bash
# из корня репозитория
npx tsx scripts/../workers/news-sync/src/index.ts   # (или запустить ручной fetch-триггер)
```

Проверки типа:

```bash
cd workers/news-sync && npm run typecheck
```