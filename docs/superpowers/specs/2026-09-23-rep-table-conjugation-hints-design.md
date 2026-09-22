# Дизайн: всплывающие подсказки со спряжением в таблице повторения (ШАГ 6, урок 5.3 родители)

Дата: 2026-09-23 · Урок: `lessons/parents/w05-l3.html`

## Цель

В блоке «Повторение недель 1–5: конструкции и перевод» (ШАГ 6) добавить всплывающие подсказки со спряжением
для всех 10 конструкций таблицы `.rep-table`, чтобы при наведении (и на тапе — мобильные) показывался список
форм глагола.

## Подход

Повторно использовать существующий механизм `.grammar-hint` (чистый CSS-тултип через `content:attr(data-hint)`,
ховер + `.active`-тап, делегированный click-listener уже присутствует в файле). Прецедент с подсказкой-спряжением
в таблице: `lessons/parents/w03-l4.html:388`.

Никакого нового JS. Правки только в `w05-l3.html`:
1. атрибуты `data-hint` в ячейках колонки «Конструкция»;
2. scoped-правила CSS для позиции тултипа (вниз от элемента).

## CSS (добавить в блок спряжений, рядом с `.rep-table`)

```css
.rep-table .grammar-hint::after{bottom:auto;top:132%}
.rep-table .grammar-hint::before{bottom:auto;top:122%;border-top-color:transparent;border-bottom-color:var(--ink)}
```

Причина: обёртка таблицы имеет `overflow-x:auto`. При `overflow-x:auto` свойство `overflow-y` вычисляется как
`auto`, поэтому тултип по умолчанию (над строкой) обрезался бы над первой строкой. Положение «вниз» решает и
вертикальное обрезание без потери читаемости на последней строке (под таблицей уже есть отступ до мини-дрилла).

## Контент подсказок (10 данных-hint)

Обёртка: `<span class="grammar-hint" data-hint="…">КОНСТРУКЦИЯ</span>` внутри `<td class="formula">`.

1. `ser`
   → `ser: soy, eres, es, somos, sois, son — быть`
2. `tener`
   → `tener: tengo, tienes, tiene, tenemos, tenéis, tienen — иметь`
3. `estar`
   → `estar: estoy, estás, está, estamos, estáis, están — находиться (está/están с ударением)`
4. `hay`
   → `hay — есть/имеется, безличная форма, не спрягается`
5. `tengo que`
   → `tener que: tengo que / tienes que / tiene que / tenemos que / tenéis que / tienen que + инфинитив — должен`
6. `hay que`
   → `hay que + инфинитив — нужно (безличное, не спрягается)`
7. `voy a`
   → `ir a: voy a / vas a / va a / vamos a / vais a / van a + инфинитив — собираюсь`
8. `quisiera`
   → `quisiera — я хотел бы. Формы: quisiera, quisieras, quisiéramos, quisierais, quisieran`
9. `¿podría...?`
   → `poder: podría / podrías / podría / podríamos / podríais / podrían — не могли бы вы…?`
10. `me / le`
    → `дополнения: me — мне, le — Вам (вежл.). Пример: ¿Me puede…?`

## Проверка

- Кнопки 🔊 в соседней колонке остаются рабочими: делегированный speak-listener исключает клики внутри
  `.grammar-hint`, а сами кнопки вне подсказок.
- Тултип не обрезается контейнером `overflow-x:auto` (позиция вниз + отступ под таблицей).
- Layout таблицы не ломается; текст в ячейках переносится как раньше.
- `node --check` по inline-JS файла — без изменений (правка только HTML/CSS), прогон для контроля.

## Не входит в задачу

- Богатые поп-апы с кнопками 🔊 и местоимениями (отклонено — слишком инвазивно для таблицы-повторения).
- Изменение поведения других `.grammar-hint` в уроке.