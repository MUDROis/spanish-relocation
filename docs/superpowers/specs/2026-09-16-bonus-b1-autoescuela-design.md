# Дизайн: Бонусный урок B1 (родители) — «Misión Autoescuela: Autoescuela и Psicotécnico»

Дата: 2026-09-16 · Статус: утверждено пользователем

## Цель

Создать `lessons/parents/bonus-auto-b1.html` — первый урок бонусного модуля «Misión Autoescuela» (B1–B5) для родительского курса (уровень A2 Survival, 50 мин), на основе шаблона Qwen `C:\Users\Lenovo\Downloads\Qwen_html_20260916_9pn2ihoy8.html`, с полной адаптацией к платформенным конвенциям курса. Расширить `parseLessonId` для бонусных уроков, зарегистрировать модуль в конце карты курса `index.html`, добавить тест.

## Контекст

- Платформа «¡Rumbo a España!» (Интерактивная школа МУДРО), родительский курс: 4 фазы × 20 недель (`index.html`). Бонусный модуль «Misión Autoescape» — 5 уроков **B1–B5** после Блока 1 (после недели 5).
- Шаблон Qwen — «Разговорный формат»: 9 шагов (Hook → Speaking Warm-up → Lexis Discovery → Grammar in Action → Speaking Drill → Role-play Challenge → Speed Dating → Card Game → Reflection) + блок внешних ресурсов. Не содержит платформенного функционала (гейт, авторизация, светофор, домашка, quizlet-блок, навигация, карта курса).
- Методическая карта пользователя для B1: 50 мин, A2, 35 слов в 5 категориях, грамматика (es necesario / hace falta / hay que + инфинитив; ¿Podría…? / Quisiera…), 2 ролевые игры, продукт (заявка на экзамен + чек-лист документов), домашка 6 заданий (вкл. семейную миссию — дети рисуют «машину мечты», мост к детскому B2), светофор 6 строк, ресурсы (dgt.es, youtube, wordwall, quizlet, revista.dgt.es).
- Решения пользователя (итоги вопросов):
  1. **Интеграция** — расширить `parseLessonId` в `app-logic.js`: распознавать `lessons/(parents|kids)/bonus-auto-bN.html` → id `parents-bonus-auto-bN` (гейт, светофор, прогресс, кнопка «Завершить урок» работают на бонусных уроках).
  2. **Навигация** — у бонусных уроков своя цепочка (B1 → B2 → … → B5); модуль регистрируется в конце карты курса на главной (`index.html`).
  3. **Структура** — использовать шаблон Qwen **как есть**, только адаптировать визуал.
  4. **Объём адаптации** — полный MUDRO-обвес + контент Qwen: lesson-topbar с auth-area, скрипт-стек (firebase + app-logic + app + lesson-gate + personalize), светофор, quizlet-блок (ссылка пользователя), домашнее задание из методички (6 заданий, вкл. рабочий лист — файл пользователь добавит позже, ссылку оставить), навигация B1→B2, регистрация на главной. Контент шагов 1–9 — как в Qwen.

## Решения

### 1. Инфраструктура (правки вне урока)

1. `assets/js/app-logic.js` — расширить `parseLessonId`:

```js
function parseLessonId(path) {
  const m = String(path).match(/\/lessons\/(parents|kids)\/(w(\d{2})-l(\d+)|bonus-auto-b(\d+))\.html/);
  if (!m) return null;
  if (m[2].indexOf('bonus') === 0) return m[1] + '-bonus-auto-b' + m[5];
  return m[1] + '-w' + m[3] + '-l' + m[4];
}
```

2. `tests/app-logic.test.js` — добавить кейсы:
   - `parseLessonId('/lessons/parents/bonus-auto-b1.html')` → `'parents-bonus-auto-b1'`
   - `parseLessonId('/lessons/kids/bonus-auto-b2.html')` → `'kids-bonus-auto-b2'`
   - существующие кейсы `wNN-lN` без регресса.

3. `index.html` — после блока `PHASES`-рендера добавить секцию бонусного модуля в конце курса: карточка модуля с 5 слотами уроков (B1 доступен → ссылка `./lessons/parents/bonus-auto-b1.html`; B2–B5 → клик ведёт в Max через существующий механизм «файл не найден → Max»). Имя бонуса в READY-логику НЕ добавляется (бонусные уроки в прогрессе недель не считаются); кнопка «Завершить урок» работает через id `parents-bonus-auto-b1` (Firestore + localStorage `mudro_done_parents → bonus-auto-b1`).

### 2. Файл урока `lessons/parents/bonus-auto-b1.html`

За основу берётся шаблон Qwen целиком (структура, контент, JS: TTS, flip-карточки, таймеры, drill, card game). Адаптация — платформенный обвес:

| Блок шаблона | Действие |
|---|---|
| Шаги 1–9 | Без изменений контента (Hook, Warm-up 5 вопросов, Lexis 35 слов, Grammar, Drill 5 ситуаций, Role-play 4 сценария, Speed Dating 6 диалогов, Card Game 12 карточек, Reflection) |
| Внешние ресурсы | Оставить 4 карточки Qwen; добавить карточки: dgt.es, quizlet |
| `<head>` | Перенести стили в конвенции урока (общие токены + компоненты квартала, как в `w05-l1.html`) |
| Topbar | Заменить на `lesson-topbar` MUDRO: `← К карте курса`, badge «🎁 Бонусный модуль · Урок B1 из B5», `#auth-area` |
| Hero | Заменить на `lesson-hero` MUDRO: phase-tag, h1 «Урок B1 · Autoescuela и Psicotécnico», meta-чипы (цель, 35 слов/5 категорий, грамматика, продукт, ⏱ 50 мин · A2) |
| Скрипт-стек | Добавить перед `</body>`: firebaseapp/firestore/auth-compat + `../../assets/js/firebase-config.js`, `app-logic.js`, `app.js`, `lesson-gate.js`, `personalize.js`; JS шаблона (speak, renderWarmup, showVocab, drill, cards) — после стека, сохранив id переменных |
| Домашнее задание | Добавить блок из методички: ① заявка на экзамен (PBL-шаблон), ② голосовое 2–3 мин преподавателю, ③ чек-лист документов, ④ тренажёр (quizlet), ⑤ рабочий лист `../../worksheets/bonus-auto-b1-parents.html` (ссылка-плейсхолдер — файл пользователь добавит позже), ⑥ семейная миссия «машина мечты» (мост к детскому B2) |
| Светофор | Добавить блок самопроверки `.tl-cell` — 6 строк (зелёный/жёлтый/красный для родителей) |
| Quizlet | Добавить `quizlet-box` со ссылкой пользователя `https://quizlet.com/fi/1209173757/mision-autoescuela...` |
| Навигация | `lesson-nav`: ← Бонус B2 отсутствует → prev не нужен (первый урок модуля); карта курса; next `./bonus-auto-b2.html` |

### 3. Озвучка и прогресс

- Озвучка: Web Speech API es-ES из шаблона (rate 0.88), без изменений.
- Самопроверка: `.tl-cell` parents (green/yellow/red) через `lesson-gate.js` (как в `w05-l1.html`).
- Бейдж не предусмотрен (родительские бонусные уроки без бейджей — соответствует конвенциям родительских уроков).

## Платформенные ограничения

- Сохранить интеграцию: firebase-скрипты в конце, auth-area, `lesson-gate.js`, `.tl-cell` самопроверка (green/yellow/red), ссылка `../../index.html`, навигация.
- Урок-id `parents-bonus-auto-b1` (parseLessonId из пути).
- Тесты: `node tests/app-logic.test.js` должны остаться зелёными (включая новые кейсы бонусов).
- Контент шагов 1–9 и JS шаблона Qwen не менять (кроме подключения к платформе).

## Объём работ

1. `assets/js/app-logic.js` — расширить `parseLessonId`.
2. `tests/app-logic.test.js` — новые кейсы, прогнать тесты.
3. `index.html` — секция бонусного модуля в конце курса.
4. `lessons/parents/bonus-auto-b1.html` — новый урок из шаблона Qwen с полным MUDRO-обвесом.
5. Проверка: JS-синтаксис, баланс тегов, ссылки, тесты, коммит.