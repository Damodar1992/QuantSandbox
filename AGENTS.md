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

## Быстрые команды

```bash
npm run dev    # http://localhost:3000 (порт в vite.config.js)
npm run build
npm run lint
```
