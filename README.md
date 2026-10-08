# ¡Rumbo a España! — испанский для переезда семьи

Интерактивный курс школы **МУДРО**: 20 недель, два трека — для родителей
(A1 → A2 Survival) и для детей (7 станций, 60 уроков). Статические HTML-уроки
с Firebase Auth/Firestore для входа и прогресса, хостинг — GitHub Pages
(интерактивнаяшкола.рф/spanish-relocation/).

## Структура

```
index.html          — карта курса для родителей (60 уроков, READY-множество)
kids.html           — карта курса для детей (7 станций, attachLessonLink)
login.html          — вход (Firebase Auth, редирект по профилю/аудитории)
admin.html          — панель администратора (ученики, прогресс, приостановка)
lessons/parents/    — уроки родителей: wNN-lN.html + bonus-auto-bN.html
lessons/kids/       — уроки детей: wNN-lN.html
worksheets/         — рабочие листы A4 (wNN-lN-kids.html / -parents.html)
assets/js/          — общий JS (см. «Скрипт-стек»)
docs/superpowers/   — скилл курса, спецификации и планы
tests/              — юнит-тесты логики (node:test)
```

Имя файла урока **критично**: `lesson-gate.js` извлекает id урока из URL
регуляркой `/lessons/(parents|kids)/w(\d{2})-l(\d+)\.html`. Другое имя —
гейт и прогресс не работают.

## Локальный запуск

Статический сайт — любой сервер из корня проекта:

```bash
npx serve .            # или python -m http.server
```

Firebase-конфиг: `assets/js/firebase-config.js` (API-ключи публичны по
назначению, доступ в Firestore защищён `firestore.rules`). Для входа нужен
аккаунт, созданный администратором (admin.html), и домен в Authorized
domains Firebase.

## Скрипт-стек урока (перед `</body>`, строго в этом порядке)

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="../../assets/js/firebase-config.js"></script>
<script src="../../assets/js/app-logic.js"></script>
<script src="../../assets/js/app.js"></script>
<script src="../../assets/js/lesson-gate.js"></script>
```

Без стека урок не откроется (оверлей «Проверяем доступ…»).

## Как добавить урок (чек-лист)

1. Создать `lessons/<track>/wNN-lN.html` по канону скилла
   `docs/superpowers/skills/mudro-course-builder.md` (трёхфазная модель,
   5 навыков, светофор, подсказки `.grammar-hint`).
2. Вставить скрипт-стек выше (собственный inline-JS — перед стеком).
3. Зарегистрировать на карте:
   - дети: `attachLessonLink('sN', n, './lessons/kids/wNN-lN.html')` в kids.html;
   - родители: id `'N-L'` в `READY` в index.html.
4. Обновить навигацию **двусторонне**: next у предыдущего урока,
   prev у нового (не создавать ссылку на несуществующий файл —
   использовать `<span class="nav-soon">`).
5. Рабочий лист: `worksheets/wNN-lN-<track>.html`, ссылка — последним
   пунктом домашки. Без ключей ответов.
6. Бейджи: уникальный ключ localStorage `mudro_kids_wXXlY_badge_<название>`.
7. Проверить: `node --check` инлайн-JS, все интерактивы до победных
   экранов, светофор, счётчики динамические.

Не дублировать кнопку «Завершить урок» — её добавляет `lesson-gate.js`.

## Тесты

```bash
npm test        # node --test tests/*.test.js (16 тестов)
```

Тестируются `app-logic.js` (parseLessonId, summarizeLessons, стикеры…) и
инициализация `app.js` на моке Firebase.

## Ключевые конвенции

- **Светофор** — единая самопроверка: `.tl-table` / `.tl-cell[data-row][data-color]`,
  цвета мапятся аудиторией (parents: green/yellow/red, kids: great/ok/hard).
- **Подсказки** `.grammar-hint` — грамматика/уличная лексика на месте,
  ≤200 символов, на синем/тёмном фоне текст белый.
- **Прогресс** — зеркалируется в localStorage: `mudro_done_kids` /
  `mudro_done_parents`; облако — Firestore `progress/{uid}/lessons`.
- **Наклейки детей** — `spain_stickers` + облачный мерж через
  `personalize-kids.js`.
- **Озвучка** — `speak(text)`, es-ES, встроена в каждый урок.
- Скилл курса (методика, шаблоны, чек-листы): `docs/superpowers/skills/mudro-course-builder.md`.
