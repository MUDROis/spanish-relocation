# spanish-relocation

## Настройка Firebase

1. В консоли Firebase → проект `spanish-relocation`: Authentication → Sign-in method → Email/Password включён.
2. Cloud Firestore → создать базу (production mode).
3. Authentication → Settings → Authorized domains → добавить `MUDROis.github.io`.
4. В `assets/js/firebase-config.js` вписать ключи веб-приложения (Project settings → Your apps → SDK setup) и свой email в `window.ADMIN_EMAILS`.
5. В `firestore.rules` вписать тот же email админа в `isAdminEmail()`.
6. Загрузить правила:
   firebase login
   firebase use spanish-relocation
   firebase deploy --only firestore:rules
7. Authentication → Users → Add user — создать аккаунт администратора (ваш email + пароль).
8. Открыть `admin.html` → войти администратором → появится админ-панель (документ админа создастся автоматически).
9. В админ-панели «Добавить ученика» — имя, email, пароль, программа. Пароль выдаётся ученику лично.
10. Ученик входит через `login.html`, открывает уроки — прогресс и самопроверка сохраняются в Firestore.

Ограничения: смена пароля — через письмо-сброс на email ученика; «удаление» ученика не удаляет Auth-аккаунт, но полностью закрывает доступ и удаляет прогресс.
