# Инструкции для агентов (Cursor / ИИ)

Перед крупными изменениями или рефакторингом **прочитайте**:

1. [README.md](README.md) — стек, команды, структура `src/`, где лежат моки.
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — куда класть новый код, состояние Hyperopt/Post-processing, соглашения.

## Правила по умолчанию

- **Не вводить** Redux/Zustand и т.п., если пользователь явно не попросил.
- **Сохранять поведение** при рефакторинге; маленькие шаги, проект должен собираться после правок (`npm run build`).
- **Builder UI**: новые компоненты конструктора — в `src/features/builder/`; общие — в `src/components/<домен>/`.
- **Константы и формулы** — `src/constants/` (часто `formulas.js`, `app.js`).
- **Таблицы Hyperopt**: при правках разметки проверять `colSpan` у раскрывающихся строк и ключи `Set` для expand/collapse (см. ARCHITECTURE).
- **UI kit (Radix + shadcn)** — обязателен для нового UI (см. `.cursor/rules/ui-kit-radix.mdc`):
  - примитивы только из `src/components/ui/` (shadcn поверх Radix);
  - нет примитива → `npm run ui:add -- <name>` (не клеить свой Dialog/Select/Menu на `div`);
  - в фичах предпочитать bridge `AppButton` / `AppInput` / `AppSelect` / `AppDialog` / `AppBadge` из `src/components/common/`;
  - не подключать MUI, Ant, Chakra и т.п. без явного запроса.
- **Dual-theme (legacy / prod)**: `ui.legacy.js` не редактировать; prod-токены в `ui.prod.js`; переключатель в header (`UI: Legacy / Prod`) или `VITE_UI_THEME=prod`. Откат: `localStorage.uiVariant='legacy'` + reload. Prod layout: sidebar шагов, `HeaderProd`, компоненты в `src/components/prod/`.

## Graphify (граф зависимостей)

`graphify-out/` генерируется **локально** и не коммитится (добавлено в `.gitignore`).  
Для просмотра: `npm run graphify:view`.  
Для обновления после изменений кода: `npx graphify update .`

## Язык / TypeScript

Проект написан на **чистом JavaScript (`.js` / `.jsx`)**. TypeScript не используется. Пакеты `@types/*` были удалены как неиспользуемые.

## Быстрые команды

```bash
npm run dev    # http://localhost:3000 (порт в vite.config.js)
npm run build
npm run lint
```
