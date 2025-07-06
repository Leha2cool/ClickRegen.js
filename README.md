# ClickRegen.js

# ClickRegen.js - Документация

ClickRegen.js - это мощная JavaScript библиотека для создания кликер-игр (clicker games) с гибкой настройкой и продвинутыми механиками. Она предоставляет все необходимые инструменты для управления ресурсами, улучшениями, генераторами, достижениями и событиями, а также включает систему сохранения и офлайн-прогресса.

## Основные возможности

1. **Управление ресурсами**: Множественные валюты с автоматической генерацией
2. **Система улучшений**: Многоуровневые апгрейды с эффектами
3. **Генераторы ресурсов**: Автоматическое производство с растущей стоимостью
4. **Достижения**: Задания с наградами и условиями разблокировки
5. **События**: Временные события с прогрессом и наградами
6. **Сохранение игры**: Автосохранение, офлайн-прогресс, импорт/экспорт
7. **Система событий**: Гибкая система подписки на игровые события
8. **Модификаторы**: Глобальные и специфические множители

---
## Установка:
```html
<script src="https://cdn.jsdelivr.net/gh/Leha2cool/ClickRegen.js@main/ClickRegen/ClickRegen.js"></script>
```
---

## Инициализация игры

```javascript
const game = new ClickRegen(config);
```

### Конфигурационный объект

| Параметр        | Тип     | По умолчанию       | Описание                                 |
|-----------------|---------|--------------------|------------------------------------------|
| `resources`     | Object  | `{ points: 0 }`    | Начальные значения ресурсов              |
| `currencies`    | Array   | `['points']`       | Список валют в игре                      |
| `upgrades`      | Array   | `[]`               | Список улучшений                         |
| `generators`    | Array   | `[]`               | Список генераторов                       |
| `achievements`  | Array   | `[]`               | Список достижений                        |
| `events`        | Array   | `[]`               | Список событий                           |
| `saveInterval`  | Number  | `1000`             | Интервал автосохранения (мс)             |
| `offlineProgress`| Boolean| `true`             | Включить офлайн-прогресс                 |

## Структуры объектов

### Улучшение (Upgrade)

```javascript
{
  id: 'unique_id',           // Уникальный идентификатор
  name: 'Upgrade Name',      // Название для отображения
  cost: { currency: 100 },   // Стоимость в ресурсах
  effects: [                 // Список эффектов
    {
      type: 'click',         // Тип эффекта (click/production/generator)
      value: 1,              // Значение эффекта
      generatorId: 'gen_id'  // Опционально: ID генератора
    }
  ],
  unlockCondition: (game) => {  // Условие разблокировки
    return game.getResource('currency') >= 50;
  }
}
```

### Генератор (Generator)

```javascript
{
  id: 'unique_id',           // Уникальный идентификатор
  name: 'Generator Name',    // Название для отображения
  currency: 'points',        // Какую валюту генерирует
  baseProduction: 1,         // Базовое производство в секунду
  cost: 10,                  // Начальная стоимость (число или объект)
  unlockCondition: (game) => {  // Условие разблокировки
    return game.getResource('points') >= 15;
  }
}
```

### Достижение (Achievement)

```javascript
{
  id: 'unique_id',           // Уникальный идентификатор
  name: 'Achievement Name',  // Название для отображения
  condition: (game) => {     // Условие выполнения
    return game.getResource('gold') >= 1000;
  },
  reward: { gems: 100 },     // Награда за выполнение
  multipliers: {             // Глобальные множители
    click: 0.1,              // +10% к кликам
    production: 0.05         // +5% к производству
  }
}
```

### Событие (Event)

```javascript
{
  id: 'unique_id',           // Уникальный идентификатор
  name: 'Event Name',        // Название для отображения
  duration: 60,              // Длительность в секундах
  rewards: { gold: 500 },    // Награда за выполнение
  startCondition: (game) => {  // Условие старта
    return game.getResource('gold') >= 100;
  }
}
```

## Основные методы

### Управление игрой

- `click(currency = 'points', amount = 1)` - Зарегистрировать клик
- `buyUpgrade(id)` - Купить улучшение
- `buyGenerator(id)` - Купить генератор
- `claimAchievement(id)` - Получить награду за достижение
- `startEvent(id)` - Начать событие
- `reset()` - Сбросить игру

### Получение информации

- `getResource(name)` - Получить количество ресурса
- `getUpgrade(id)` - Получить данные улучшения
- `getGenerator(id)` - Получить данные генератора
- `getAchievement(id)` - Получить данные достижения
- `getEvent(id)` - Получить данные события
- `getPlayTime()` - Получить время игры (секунды)
- `getTotalClicks()` - Получить общее количество кликов

### Сохранение и загрузка

- `save()` - Сохранить игру
- `load()` - Загрузить игру
- `exportSave()` - Экспортировать сохранение (строка)
- `importSave(encodedData)` - Импортировать сохранение

### Система событий

- `on(event, callback)` - Подписаться на событие

## Система событий (Event System)

Библиотека генерирует события, на которые можно подписаться:

```javascript
game.on('event_name', (data) => {
  // Обработка события
});
```

### Доступные события

| Событие               | Данные                               | Описание                        |
|-----------------------|--------------------------------------|---------------------------------|
| `click`               | `{ currency, amount }`               | Произведен клик                 |
| `upgradeBought`       | `{ id, level }`                      | Куплено улучшение               |
| `generatorBought`     | `{ id, count }`                      | Куплен генератор                |
| `achievementUnlocked` | `{ id }`                             | Разблокировано достижение       |
| `achievementClaimed`  | `{ id }`                             | Получена награда за достижение  |
| `eventStarted`        | `{ id }`                             | Начато событие                  |
| `eventCompleted`      | `{ id }`                             | Завершено событие               |
| `update`              | `{ delta }`                          | Обновление игры (каждую секунду)|
| `save`                | `{ data }`                           | Игра сохранена                  |
| `load`                | `{ data }`                           | Игра загружена                  |
| `reset`               | -                                    | Игра сброшена                   |
| `offlineProgress`     | `{ time }`                           | Начислен офлайн-прогресс        |

## Модификаторы и расчеты

### Глобальные множители

Библиотека автоматически рассчитывает множители:
- `game.getGlobalMultiplier('click')` - Множитель для кликов
- `game.getGlobalMultiplier('production')` - Множитель для производства
- `game.getGeneratorMultiplier(id)` - Множитель для конкретного генератора

### Расчет стоимости

Стоимость объектов рассчитывается по формуле:
```javascript
cost = baseCost * 1.15^owned
```

## Пример игры

```javascript
// Конфигурация игры
const config = {
  resources: { gold: 0, gems: 0 },
  currencies: ['gold', 'gems'],
  
  generators: [
    {
      id: 'gold_mine',
      name: 'Gold Mine',
      currency: 'gold',
      baseProduction: 0.1,
      cost: 15,
      unlockCondition: (game) => game.getResource('gold') >= 10
    },
    {
      id: 'gem_cave',
      name: 'Gem Cave',
      currency: 'gems',
      baseProduction: 0.01,
      cost: { gold: 100 },
      unlockCondition: (game) => game.getResource('gold') >= 50
    }
  ],
  
  upgrades: [
    {
      id: 'better_pickaxe',
      name: 'Better Pickaxe',
      cost: { gold: 50 },
      effects: [{ type: 'click', value: 0.5 }],
      unlockCondition: (game) => game.getResource('gold') >= 20
    },
    {
      id: 'mining_boost',
      name: 'Mining Boost',
      cost: { gold: 200 },
      effects: [
        { type: 'generator', generatorId: 'gold_mine', value: 0.2 }
      ],
      unlockCondition: (game) => game.getGenerator('gold_mine').owned > 0
    }
  ],
  
  achievements: [
    {
      id: 'first_gold',
      name: 'First Gold',
      condition: (game) => game.getResource('gold') >= 1,
      reward: { gems: 5 }
    },
    {
      id: 'gold_digger',
      name: 'Gold Digger',
      condition: (game) => game.getResource('gold') >= 1000,
      reward: { gems: 50 },
      multipliers: { click: 0.1 }
    }
  ],
  
  events: [
    {
      id: 'gold_rush',
      name: 'Gold Rush',
      duration: 120,
      rewards: { gold: 500, gems: 10 },
      startCondition: (game) => game.getResource('gold') >= 100
    }
  ],
  
  saveInterval: 5000
};

// Инициализация игры
const game = new ClickRegen(config);

// Подписка на события
game.on('update', () => {
  console.log('Gold:', game.getResource('gold'));
  console.log('Gems:', game.getResource('gems'));
});

game.on('achievementUnlocked', (data) => {
  console.log('Achievement unlocked:', data.id);
});

// Клик по основной валюте
document.getElementById('click-btn').addEventListener('click', () => {
  game.click('gold');
});

// Покупка генератора
document.getElementById('buy-mine').addEventListener('click', () => {
  game.buyGenerator('gold_mine');
});
```

## Расширенные возможности

### Пользовательские условия

Все условия разблокировки - это функции, которые получают экземпляр игры:

```javascript
unlockCondition: (game) => {
  // Любая логика с доступом к состоянию игры
  return game.getResource('gold') >= 100 && 
         game.getGenerator('gold_mine').owned >= 5;
}
```

### Кастомные эффекты

Вы можете создавать сложные эффекты, комбинируя типы:

```javascript
effects: [
  { type: 'click', value: 1.0 }, // +100% к кликам
  { type: 'production', value: 0.5 }, // +50% ко всему производству
  { 
    type: 'generator', 
    generatorId: 'gold_mine', 
    value: 0.2 // +20% к производству золотых шахт
  }
]
```

### Офлайн-прогресс

При включенной опции `offlineProgress` игрок будет получать ресурсы за время, проведенное вне игры. Прогресс рассчитывается автоматически при загрузке сохранения.

## Советы по использованию

1. **Балансировка игры**: Используйте экспоненциальный рост стоимости для долгосрочной прогрессии
2. **Условия разблокировки**: Создавайте цепочки разблокировок для управления прогрессией
3. **События**: Используйте временные события для увеличения вовлеченности
4. **Модификаторы**: Комбинируйте глобальные и специфические множители для создания интересных механик
5. **Интерфейс**: Обновляйте UI через систему событий для быстрой реакции на изменения

## Ограничения

1. Библиотека работает только на стороне клиента
2. Для сохранения используется localStorage (ограничение ~5MB)
3. Сложные вычисления могут повлиять на производительность при очень большом количестве объектов

## Заключение

ClickRegen.js предоставляет полный набор инструментов для создания кликер-игр любой сложности. Благодаря гибкой системе конфигурации и мощному API, вы можете реализовать уникальные механики и интересный игровой процесс с минимальными усилиями.
