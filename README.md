# QuantSandbox CRM

Веб-приложение для управления квантовыми торговыми стратегиями (Quant Trading Sandbox): список стратегий, конструктор сигналов (Strategy Builder), оптимизация и HeatMap, мок-данные без бэкенда.

**Доп. ориентация для разработки:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · для агентов Cursor: [AGENTS.md](AGENTS.md)

## Возможности

- **Аутентификация**: вход и восстановление пароля (mock)
- **Стратегии**: список с версиями, фильтры, детальный просмотр, вкладки Builder / Code
- **Strategy Builder**: поэтапный конструктор (активен в основном этап Signal; остальные этапы могут быть заблокированы в UI)
- **Оптимизация / Hyperopt**: параметры запуска, таблица результатов, HeatMap, post-processing (нормализация / формулы)
- **Редактор кода**: Monaco-подобное отображение Python-кода стратегий
- **Пользователи и настройки**: секции в навигации (mock UI)
- **Тёмная тема**: Tailwind CSS

## Технологии

- **React 18** — UI
- **Vite 5** — сборка и dev-сервер
- **Tailwind CSS 3** — стили
- **@monaco-editor/react** — редактор кода в Builder
- **JavaScript (ES modules)** — без TypeScript

## Требования

- **Node.js** 18+ рекомендуется (как для Vite 5)

## Команды

```bash
npm install          # зависимости
npm run dev          # dev-сервер (порт см. ниже)
npm run build        # production-сборка → dist/
npm run preview      # предпросмотр dist/
npm run lint         # ESLint (js, jsx)
```

## Dev-сервер и URL

Порт **3000** и автооткрытие браузера задаются в [`vite.config.js`](vite.config.js) (`server.port`, `server.open`).

Приложение: **http://localhost:3000**

## Структура репозитория

```
QuantSandbox/
├── src/
│   ├── main.jsx                 # Точка входа React
│   ├── App.jsx                  # Корневой компонент: маршрутизация экранов, большой объём Builder/Hyperopt UI и состояния
│   ├── index.css                # Глобальные стили + Tailwind
│   ├── constants/               # Константы приложения, формул, индикаторов, heatmap, UI
│   ├── utils/                   # Чистые хелперы (weights, builder, mock heatmap, pythonCode, …)
│   ├── hooks/                   # Общие хуки (например useOutsideClose)
│   ├── features/builder/        # Фича Builder: components/, utils/
│   └── components/              # Переиспользуемые блоки по домену
│       ├── auth/
│       ├── common/
│       ├── formulas/
│       ├── heatmap/
│       ├── indicators/
│       ├── report/
│       ├── shared/
│       ├── strategies/
│       └── users/
├── docs/
│   └── ARCHITECTURE.md          # Карта модулей и соглашения
├── AGENTS.md                    # Краткие инструкции для ИИ/агентов
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

ESLint: скрипт `npm run lint` в [`package.json`](package.json); при необходимости добавьте явный конфиг (`.eslintrc.cjs` / `eslint.config.js`) в корень.

Новые компоненты **конкретно конструктора сигналов** предпочтительно размещать в `src/features/builder/`; общие и кросс-экранные — в `src/components/<домен>/`.

## Где что искать

| Область | Где смотреть |
|--------|----------------|
| Точка входа | `src/main.jsx` → `App.jsx` |
| Константы стратегий, пар, таймфреймов heatmap | `src/constants/app.js` |
| Формулы и шаблоны для редакторов | `src/constants/formulas.js` |
| Каталог индикаторов (TA-Lib-стиль) | `src/constants/indicators.js` |
| Компоненты FormulaEditor, IndicatorLibrary, … | `src/features/builder/components/` |
| Генерация мок-результатов HeatMap | `src/utils/mockResults.js` |
| Подробности состояния и таблиц Hyperopt | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

## Mock-данные

- Стратегии и пользователь по умолчанию: **`src/constants/app.js`** (`INITIAL_STRATEGIES`, мок-логин)
- Запуски оптимизации (список runs): **`MOCK_OPTIMIZATION_RUNS`** в том же файле
- Таблица **Hyperopt / Post-processing results**: начальные строки задаются в **`src/App.jsx`** (`hyperoptResultsRows` и связанные `useState`)
- Сетка HeatMap: **`generateMockResults`** в `src/utils/mockResults.js`

Бэкенда нет: данные живут в локальном состоянии React (`useState` / производные).

## UI: основные экраны и модули

- **LoginScreen** — вход (mock)
- **Header** — навигация (Strategies, Users, Settings и т.д. по константам)
- **Список стратегий / деталь** — вкладки список кода, Builder, модалки создания/редактирования
- **Builder** — этапы, индикаторы, Hyperopt parameters, таблицы результатов, модалки нормализации / формул
- Модалки пользователей, индикаторов, отчётов — под `src/components/users`, `indicators`, `report`, …

## Builder (Signal): кратко

- Библиотека и карточки индикаторов, формулы (промежуточный score, post-processing при необходимости)
- Таймфреймы для части UI: **`TIME_RANGES`** в `src/constants/app.js` (например `15m`, `30m`, `1h`, `4h`, `1d` — актуальный список смотреть в файле)
- Пары: **`PAIR_OPTIONS`** в `src/constants/app.js`

## Ограничения и примечания

- Состояние не вынесено в Redux/Zustand — только локальное в компонентах (если не оговорено иное в задаче)
- Перед крупным рефакторингом имеет смысл прочитать [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- После заметных изменений в структуре — обновить этот README или ARCHITECTURE

## Следующие шаги (продакшен)

1. Подключить реальный API и аутентификацию (например JWT)
2. Заменить моки Hyperopt/HeatMap данными с сервера
3. Доработать этапы Builder по продуктовым требованиям
4. Тесты (unit/e2e) по мере появления API

## Отладка

В приложении могут быть sanity-проверки в консоли браузера (структура стратегий, ID и т.п.) — смотрите код в `App.jsx` при необходимости.

---

**Версия**: 0.1.0 (mock)  
**Лицензия**: Private
