# ClickRegen.js - Документация

ClickRegen.js - это мощная библиотека для создания кликер-игр (incremental games) на JavaScript. Она предоставляет полный набор инструментов для управления игровой механикой, включая ресурсы, улучшения, генераторы, достижения, события, квесты и систему престижа.

---
```html
<script src="ClickRegen.js"><script>
```
---
## Основные возможности

- Управление ресурсами и валютами
- Система улучшений с эффектами
- Автоматические генераторы ресурсов
- Достижения с наградами
- Случайные события
- Система квестов
- Механика престижа
- Автосохранение и офлайн-прогресс
- Система модификаторов (аддитивные, мультипликативные)
- Расширенная система событий
- Импорт/экспорт сохранений

## Инициализация

```javascript
const game = new ClickRegen({
    // Начальные ресурсы
    resources: {
        gold: 0,
        gems: 5
    },
    
    // Доступные валюты
    currencies: ['gold', 'gems'],
    
    // Улучшения
    upgrades: [
        {
            id: 'better_click',
            name: 'Better Click',
            description: 'Увеличивает силу клика на 0.2',
            cost: { gold: 15 },
            effects: [
                { type: 'click', value: 0.2 }
            ],
            unlockCondition: (game) => game.getResource('gold') >= 10
        }
    ],
    
    // Генераторы
    generators: [
        {
            id: 'gold_miner',
            name: 'Gold Miner',
            currency: 'gold',
            baseProduction: 0.1,
            cost: 50,
            unlockCondition: (game) => game.getResource('gold') >= 20
        }
    ],
    
    // Достижения
    achievements: [
        {
            id: 'first_click',
            name: 'First Click',
            description: 'Совершите первый клик',
            condition: (game) => game.getTotalClicks() >= 1,
            reward: { gold: 10 }
        }
    ],
    
    // События
    events: [
        {
            id: 'gold_rush',
            name: 'Gold Rush',
            description: 'Золотая лихорадка! Двойная добыча золота на 30 секунд',
            duration: 30,
            modifiers: [
                { type: 'production', value: 2.0, target: 'gold' }
            ]
        }
    ],
    
    // Квесты
    quests: [
        {
            id: 'click_100_times',
            name: '100 Clicks',
            description: 'Сделайте 100 кликов',
            condition: {
                type: 'click',
                target: 100
            },
            reward: { gems: 1 }
        }
    ],
    
    // Престиж
    prestige: [
        {
            id: 'prestige_boost',
            name: 'Golden Touch',
            description: 'Увеличивает добычу золота на 10%',
            cost: 25,
            effects: [
                { type: 'production', value: 0.1, target: 'gold' }
            ],
            unlockCondition: (game) => game.state.prestige.level >= 1
        }
    ],
    
    // Настройки
    saveInterval: 5000, // Автосохранение каждые 5 секунд
    offlineProgress: true,
    maxOfflineTime: 86400 // Максимум 24 часа офлайн-прогресса
});

// Запуск игры
game.start();
```

## Основные методы

### Управление игрой

- **start()**: Запускает игровые циклы
- **stop()**: Останавливает игру и сохраняет состояние
- **reset()**: Сбрасывает игру в начальное состояние

```javascript
game.start();
// Через некоторое время...
game.stop();
```

### Работа с ресурсами

- **click(currency, amount)**: Совершает клик по указанной валюте
- **getResource(name)**: Возвращает количество ресурса
- **getResourcePerSecond(currency)**: Возвращает производство ресурса в секунду

```javascript
// Совершить клик по золоту
game.click('gold');

// Получить текущее количество золота
const gold = game.getResource('gold');

// Получить производство золота в секунду
const goldPerSecond = game.getResourcePerSecond('gold');
```

### Покупка улучшений и генераторов

- **buyUpgrade(id, quantity)**: Покупает улучшение
- **buyGenerator(id, quantity)**: Покупает генератор
- **getUpgrade(id)**: Возвращает информацию об улучшении
- **getGenerator(id)**: Возвращает информацию о генераторе

```javascript
// Купить улучшение "Better Click"
game.buyUpgrade('better_click');

// Купить 5 золотых шахт
game.buyGenerator('gold_miner', 5);

// Получить информацию об улучшении
const upgrade = game.getUpgrade('better_click');
console.log(`Уровень улучшения: ${upgrade.owned}`);
```

### Достижения и квесты

- **claimAchievement(id)**: Забирает награду за достижение
- **claimQuest(id)**: Забирает награду за квест
- **getAchievement(id)**: Возвращает информацию о достижении
- **getQuest(id)**: Возвращает информацию о квесте

```javascript
// Забрать награду за достижение
game.claimAchievement('first_click');

// Забрать награду за квест
game.claimQuest('click_100_times');

// Проверить статус достижения
const achievement = game.getAchievement('first_click');
if (achievement.unlocked) {
    console.log('Достижение разблокировано!');
}
```

### Система престижа

- **prestige()**: Выполняет престиж (перезапуск игры с бонусами)
- **canPrestige()**: Проверяет, доступен ли престиж
- **buyPrestigeUpgrade(id)**: Покупает престижное улучшение

```javascript
// Проверить возможность престижа
if (game.canPrestige()) {
    // Выполнить престиж
    game.prestige();
}

// Купить престижное улучшение
game.buyPrestigeUpgrade('prestige_boost');
```

### Сохранение и загрузка

- **save()**: Сохраняет текущее состояние игры
- **load()**: Загружает сохранённую игру
- **exportSave()**: Экспортирует сохранение в виде строки
- **importSave(encodedData)**: Импортирует сохранение из строки

```javascript
// Вручную сохранить игру
game.save();

// Экспортировать сохранение
const saveData = game.exportSave();
console.log('Код сохранения:', saveData);

// Импортировать сохранение
game.importSave(saveData);
```

### События

- **on(event, callback)**: Регистрирует обработчик события
- **off(event, callback)**: Удаляет обработчик события
- **triggerEvent(event, data)**: Вызывает событие

```javascript
// Подписаться на событие клика
game.on('click', (data) => {
    console.log(`Клик! Получено ${data.amount} ${data.currency}`);
});

// Подписаться на покупку улучшения
game.on('upgradeBought', (data) => {
    console.log(`Куплено улучшение ${data.id} (уровень ${data.newLevel})`);
});

// Подписаться на офлайн-прогресс
game.on('offlineProgress', (data) => {
    console.log(`Загружен офлайн-прогресс: ${data.time.toFixed(1)} секунд`);
});
```

## Подробное описание систем

### Ресурсы и валюты

Система ресурсов позволяет управлять различными игровыми валютами. Ресурсы автоматически инициализируются при первом обращении.

```javascript
// Добавить собственный ресурс
const game = new ClickRegen({
    resources: {
        gold: 0,
        gems: 5,
        energy: 100 // Новый ресурс
    },
    currencies: ['gold', 'gems', 'energy'] // Добавить в список валют
});

// Использовать новый ресурс
game.click('energy', 5);
```

### Улучшения (Upgrades)

Улучшения предоставляют постоянные бонусы и могут иметь несколько уровней. Каждое улучшение может содержать:

- `id`: Уникальный идентификатор
- `name`: Название
- `description`: Описание
- `cost`: Стоимость (может быть объектом для нескольких валют)
- `effects`: Массив эффектов
- `unlockCondition`: Функция разблокировки
- `maxLevel`: Максимальный уровень (необязательно)
- `alwaysVisible`: Всегда отображать, даже если не разблокировано (по умолчанию false)

```javascript
upgrades: [
    {
        id: 'super_click',
        name: 'Super Click',
        description: 'Увеличивает силу клика на 50%',
        cost: { gems: 10 },
        effects: [
            { type: 'click', value: 0.5 }
        ],
        unlockCondition: (game) => game.getTotalClicks() >= 100,
        maxLevel: 5
    }
]
```

### Генераторы (Generators)

Генераторы автоматически производят ресурсы. Характеристики генератора:

- `id`: Уникальный идентификатор
- `name`: Название
- `currency`: Валюта, которую производит
- `baseProduction`: Базовая производительность в секунду
- `cost`: Стоимость покупки
- `unlockCondition`: Функция разблокировки
- `efficiency`: Эффективность (можно изменять динамически)

```javascript
generators: [
    {
        id: 'gem_extractor',
        name: 'Gem Extractor',
        currency: 'gems',
        baseProduction: 0.01,
        cost: 100,
        unlockCondition: (game) => game.getResource('gems') >= 5
    }
]
```

### Достижения (Achievements)

Достижения предоставляют разовые награды и бонусы:

- `id`: Уникальный идентификатор
- `name`: Название
- `description`: Описание
- `condition`: Условие разблокировки
- `reward`: Награда (объект ресурсов)
- `modifiers`: Постоянные модификаторы

```javascript
achievements: [
    {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Накопить 1,000,000 золота',
        condition: (game) => game.getResource('gold') >= 1000000,
        reward: { gems: 100 },
        modifiers: [
            { type: 'production', value: 0.1, target: 'gold' }
        ]
    }
]
```

### События (Events)

Случайные события предоставляют временные бонусы:

- `id`: Уникальный идентификатор
- `name`: Название
- `description`: Описание
- `duration`: Длительность в секундах
- `chance`: Шанс появления (необязательно)
- `rewards`: Награды по завершении
- `modifiers`: Временные модификаторы

```javascript
events: [
    {
        id: 'lucky_day',
        name: 'Lucky Day',
        description: 'Увеличивает шанс критического удара',
        duration: 60,
        modifiers: [
            { type: 'critChance', value: 0.2 }
        ]
    }
]
```

### Квесты (Quests)

Квесты - задания, которые игрок должен выполнить:

- `id`: Уникальный идентификатор
- `name`: Название
- `description`: Описание
- `condition`: Условие выполнения
- `reward`: Награда
- `modifiers`: Постоянные модификаторы

```javascript
quests: [
    {
        id: 'upgrade_master',
        name: 'Upgrade Master',
        description: 'Купить 50 улучшений',
        condition: (game) => {
            return game.state.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 50;
        },
        reward: { gems: 50 }
    }
]
```

### Престиж (Prestige)

Система престижа позволяет перезапустить игру с постоянными бонусами:

- `id`: Уникальный идентификатор
- `name`: Название
- `description`: Описание
- `cost`: Стоимость в престижной валюте
- `unlockCondition`: Условие разблокировки
- `effects`: Эффекты улучшения

```javascript
prestige: [
    {
        id: 'eternal_miner',
        name: 'Eternal Miner',
        description: 'Увеличивает производство всех ресурсов на 5%',
        cost: 100,
        effects: [
            { type: 'production', value: 0.05 }
        ],
        unlockCondition: (game) => game.state.prestige.level >= 3
    }
]
```

## Модификаторы

Библиотека поддерживает три типа модификаторов:

1. **Аддитивные (additive)**: Добавляют значение
   ```javascript
   { type: 'click', value: 0.2 }
   ```

2. **Мультипликативные (multiplicative)**: Умножают значение
   ```javascript
   { type: 'production', value: 1.5 }
   ```

3. **Экспоненциальные (exponential)**: Возводят в степень
   ```javascript
   { type: 'prestige', value: 1.1 }
   ```

Модификаторы могут применяться к:
- Силе клика (`click`)
- Производству ресурсов (`production`)
- Шансу критического удара (`critChance`)
- Множителю критического удара (`critMultiplier`)
- Шансу события (`eventChance`)
- И другим пользовательским параметрам

## Система событий

Библиотека генерирует различные события, на которые можно подписаться:

| Событие                | Описание                                 | Данные                                      |
|------------------------|------------------------------------------|---------------------------------------------|
| `gameStarted`          | Игра запущена                            | -                                           |
| `gameStopped`          | Игра остановлена                         | -                                           |
| `click`                | Совершён клик                            | `currency`, `amount`, `isCritical`          |
| `upgradeBought`        | Куплено улучшение                        | `id`, `quantity`, `newLevel`                |
| `generatorBought`      | Куплен генератор                         | `id`, `quantity`, `newCount`                |
| `achievementUnlocked`  | Разблокировано достижение                | `id`                                        |
| `achievementClaimed`   | Получена награда за достижение           | `id`                                        |
| `questCompleted`       | Завершён квест                           | `id`                                        |
| `questClaimed`         | Получена награда за квест                | `id`                                        |
| `eventStarted`         | Началось событие                         | `id`                                        |
| `eventCompleted`       | Завершилось событие                      | `id`                                        |
| `prestige`             | Выполнен престиж                         | `level`, `currency`                         |
| `prestigeUpgradeBought`| Куплено престижное улучшение             | `id`                                        |
| `save`                 | Игра сохранена                           | `data` (данные сохранения)                  |
| `load`                 | Игра загружена                           | `data` (данные загрузки)                    |
| `reset`                | Игра сброшена                            | -                                           |
| `update`               | Обновление игры (каждые 250мс)           | `delta` (время с последнего обновления)     |
| `offlineProgress`      | Загружен офлайн-прогресс                 | `time` (время в офлайне)                    |
| `error`                | Произошла ошибка                         | `message`, `error`                          |

## Расширенные примеры

### Пользовательский генератор ресурсов

```javascript
// Создаем кнопку для ручной добычи золота
document.getElementById('mine-gold').addEventListener('click', () => {
    const amountMined = game.click('gold');
    updateUI();
});

// Функция обновления интерфейса
function updateUI() {
    document.getElementById('gold-count').textContent = 
        game.formatNumber(game.getResource('gold'));
    
    document.getElementById('gems-count').textContent = 
        game.formatNumber(game.getResource('gems'));
    
    document.getElementById('gold-per-second').textContent = 
        game.formatNumber(game.getResourcePerSecond('gold'));
}

// Обновляем UI при изменениях
game.on('update', updateUI);
game.on('upgradeBought', updateUI);
game.on('generatorBought', updateUI);
```

### Система престижа с бонусами

```javascript
// Проверка доступности престижа
function checkPrestige() {
    const canPrestige = game.canPrestige();
    document.getElementById('prestige-button').disabled = !canPrestige;
    
    if (canPrestige) {
        const prestigeData = game._calculatePrestige();
        document.getElementById('prestige-info').textContent = 
            `После престижа вы получите: ${prestigeData.currency.toFixed(1)} престижных очков`;
    }
}

// Кнопка престижа
document.getElementById('prestige-button').addEventListener('click', () => {
    if (game.prestige()) {
        alert('Престиж выполнен! Ваша игра перезапущена с бонусами.');
        updateUI();
    }
});

// Обновляем информацию о престиже
game.on('update', checkPrestige);
```

### Обработка случайных событий

```javascript
// Обработка начала события
game.on('eventStarted', (data) => {
    const event = game.getEvent(data.id);
    
    // Показать уведомление
    showNotification(`Событие: ${event.name}`, event.description);
    
    // Показать индикатор прогресса
    const eventElement = document.createElement('div');
    eventElement.id = `event-${event.id}`;
    eventElement.className = 'active-event';
    eventElement.innerHTML = `
        <h3>${event.name}</h3>
        <div class="progress-bar">
            <div class="progress"></div>
        </div>
    `;
    document.getElementById('events-container').appendChild(eventElement);
});

// Обновление прогресса события
game.on('update', () => {
    const activeEvents = game.state.events.filter(e => e.active);
    
    activeEvents.forEach(event => {
        const element = document.getElementById(`event-${event.id}`);
        if (element) {
            const progress = (event.progress / event.duration) * 100;
            element.querySelector('.progress').style.width = `${progress}%`;
        }
    });
});

// Обработка завершения события
game.on('eventCompleted', (data) => {
    const eventElement = document.getElementById(`event-${data.id}`);
    if (eventElement) {
        eventElement.classList.add('completed');
        setTimeout(() => eventElement.remove(), 3000);
    }
});
```

## Советы по производительности

1. Для сложных вычислений используйте Web Workers
2. Ограничивайте количество проверок условий
3. Используйте кеширование для часто используемых значений
4. При большом количестве элементов используйте виртуализацию
5. Оптимизируйте функции условий для быстрой работы

## Заключение

ClickRegen.js предоставляет мощный набор инструментов для создания кликер-игр любой сложности. Библиотека обрабатывает все основные аспекты игровой механики, позволяя разработчику сосредоточиться на создании увлекательного игрового процесса.

Библиотека полностью самодостаточна, не имеет внешних зависимостей и может использоваться как в браузере, так и в среде Node.js (с некоторыми ограничениями для функций, связанных с DOM).

Для начала работы просто подключите библиотеку и создайте экземпляр игры с вашей конфигурацией!
