/**
 * ClickRegen.js - Click Regen
 * Версия: 1.0
 * Дата: 2025-07-06
 * GitHub: https://github.com/Leha2cool
 */



class ClickRegen {
    constructor(config) {
        // Конфигурация по умолчанию
        this.defaultConfig = {
            resources: { points: 0 },
            currencies: ['points'],
            upgrades: [],
            generators: [],
            achievements: [],
            events: [],
            saveInterval: 1000,
            offlineProgress: true
        };

        // Слияние пользовательского конфига с дефолтным
        this.config = { ...this.defaultConfig, ...config };

        // Инициализация состояния игры
        this.state = {
            resources: { ...this.config.resources },
            upgrades: this.config.upgrades.map(upgrade => ({
                ...upgrade,
                owned: 0,
                unlocked: false
            })),
            generators: this.config.generators.map(generator => ({
                ...generator,
                owned: 0,
                unlocked: false
            })),
            achievements: this.config.achievements.map(achievement => ({
                ...achievement,
                unlocked: false,
                claimed: false
            })),
            events: this.config.events.map(event => ({
                ...event,
                active: false,
                progress: 0
            })),
            lastUpdate: Date.now(),
            gameStart: Date.now(),
            playTime: 0,
            totalClicks: 0
        };

        // Системные переменные
        this.lastSave = Date.now();
        this.activeTimers = [];
        this.eventListeners = {};
        this.running = false;

        // Автозагрузка сохранения
        this.load();
        this.start();
    }

    // =======================
    // Основные методы игры
    // =======================
    
    start() {
        if (this.running) return;
        this.running = true;
        
        // Запуск системных интервалов
        this.activeTimers.push(setInterval(() => this.update(), 1000));
        this.activeTimers.push(setInterval(() => this.save(), this.config.saveInterval));
    }

    stop() {
        this.running = false;
        this.activeTimers.forEach(timer => clearInterval(timer));
        this.activeTimers = [];
        this.save();
    }

    click(currency = 'points', amount = 1) {
        if (!this.running) return;
        
        const multiplier = this.getGlobalMultiplier('click');
        const actualAmount = amount * multiplier;
        
        this.state.resources[currency] += actualAmount;
        this.state.totalClicks++;
        
        this.checkUnlocks();
        this.triggerEvent('click', { currency, amount: actualAmount });
    }

    buyUpgrade(id) {
        if (!this.running) return false;
        
        const upgrade = this.state.upgrades.find(u => u.id === id);
        if (!upgrade || !upgrade.unlocked) return false;
        
        // Проверка стоимости
        for (const [currency, cost] of Object.entries(upgrade.cost)) {
            const currentCost = this.calculateCost(cost, upgrade.owned);
            if (this.state.resources[currency] < currentCost) {
                return false;
            }
        }
        
        // Оплата
        for (const [currency, cost] of Object.entries(upgrade.cost)) {
            const currentCost = this.calculateCost(cost, upgrade.owned);
            this.state.resources[currency] -= currentCost;
        }
        
        // Применение эффекта
        upgrade.owned++;
        this.applyUpgradeEffects(upgrade);
        
        this.checkUnlocks();
        this.triggerEvent('upgradeBought', { id, level: upgrade.owned });
        return true;
    }

    buyGenerator(id) {
        if (!this.running) return false;
        
        const generator = this.state.generators.find(g => g.id === id);
        if (!generator || !generator.unlocked) return false;
        
        // Проверка стоимости
        const cost = this.calculateCost(generator.cost, generator.owned);
        if (this.state.resources[generator.currency] < cost) {
            return false;
        }
        
        // Оплата
        this.state.resources[generator.currency] -= cost;
        generator.owned++;
        
        this.checkUnlocks();
        this.triggerEvent('generatorBought', { id, count: generator.owned });
        return true;
    }

    claimAchievement(id) {
        const achievement = this.state.achievements.find(a => a.id === id);
        if (!achievement || !achievement.unlocked || achievement.claimed) return false;
        
        // Выдача награды
        if (achievement.reward) {
            for (const [currency, amount] of Object.entries(achievement.reward)) {
                this.state.resources[currency] = (this.state.resources[currency] || 0) + amount;
            }
        }
        
        achievement.claimed = true;
        this.triggerEvent('achievementClaimed', { id });
        return true;
    }

    // =======================
    // Системные методы
    // =======================
    
    update() {
        if (!this.running) return;
        
        const now = Date.now();
        const delta = (now - this.state.lastUpdate) / 1000;
        this.state.playTime += delta;
        this.state.lastUpdate = now;
        
        // Генерация ресурсов
        this.generateResources(delta);
        
        // Проверка достижений
        this.checkAchievements();
        
        // Обновление событий
        this.updateEvents(delta);
        
        // Проверка разблокировок
        this.checkUnlocks();
        
        this.triggerEvent('update', { delta });
    }
    
    generateResources(delta) {
        for (const generator of this.state.generators) {
            if (generator.owned > 0) {
                const production = this.calculateProduction(generator, delta);
                this.state.resources[generator.currency] += production;
            }
        }
    }
    
    calculateProduction(generator, delta) {
        let production = generator.baseProduction * generator.owned * delta;
        
        // Применение модификаторов
        const productionMultiplier = this.getGlobalMultiplier('production');
        const generatorMultiplier = this.getGeneratorMultiplier(generator.id);
        
        production *= productionMultiplier * generatorMultiplier;
        
        return production;
    }
    
    updateEvents(delta) {
        for (const event of this.state.events) {
            if (event.active) {
                event.progress += delta;
                if (event.progress >= event.duration) {
                    this.completeEvent(event.id);
                }
            }
        }
    }
    
    completeEvent(id) {
        const event = this.state.events.find(e => e.id === id);
        if (!event || !event.active) return;
        
        // Выдача наград
        if (event.rewards) {
            for (const [currency, amount] of Object.entries(event.rewards)) {
                this.state.resources[currency] = (this.state.resources[currency] || 0) + amount;
            }
        }
        
        event.active = false;
        event.progress = 0;
        this.triggerEvent('eventCompleted', { id });
    }
    
    checkUnlocks() {
        // Проверка разблокировки улучшений
        for (const upgrade of this.state.upgrades) {
            if (!upgrade.unlocked && upgrade.unlockCondition) {
                try {
                    upgrade.unlocked = upgrade.unlockCondition(this);
                } catch (e) {
                    console.error(`Error in unlock condition for ${upgrade.id}:`, e);
                }
            }
        }
        
        // Проверка разблокировки генераторов
        for (const generator of this.state.generators) {
            if (!generator.unlocked && generator.unlockCondition) {
                try {
                    generator.unlocked = generator.unlockCondition(this);
                } catch (e) {
                    console.error(`Error in unlock condition for ${generator.id}:`, e);
                }
            }
        }
    }
    
    checkAchievements() {
        for (const achievement of this.state.achievements) {
            if (!achievement.unlocked && achievement.condition) {
                try {
                    achievement.unlocked = achievement.condition(this);
                    if (achievement.unlocked) {
                        this.triggerEvent('achievementUnlocked', { id: achievement.id });
                    }
                } catch (e) {
                    console.error(`Error in condition for achievement ${achievement.id}:`, e);
                }
            }
        }
    }
    
    // =======================
    // Расчетные функции
    // =======================
    
    getGlobalMultiplier(type) {
        let multiplier = 1;
        
        // Модификаторы от улучшений
        for (const upgrade of this.state.upgrades) {
            if (upgrade.owned > 0 && upgrade.effects) {
                for (const effect of upgrade.effects) {
                    if (effect.type === type) {
                        multiplier += effect.value * upgrade.owned;
                    }
                }
            }
        }
        
        // Модификаторы от достижений
        for (const achievement of this.state.achievements) {
            if (achievement.claimed && achievement.multipliers) {
                for (const [mType, value] of Object.entries(achievement.multipliers)) {
                    if (mType === type) {
                        multiplier += value;
                    }
                }
            }
        }
        
        return multiplier;
    }
    
    getGeneratorMultiplier(id) {
        let multiplier = 1;
        
        // Модификаторы от улучшений
        for (const upgrade of this.state.upgrades) {
            if (upgrade.owned > 0 && upgrade.effects) {
                for (const effect of upgrade.effects) {
                    if (effect.type === 'generator' && effect.generatorId === id) {
                        multiplier += effect.value * upgrade.owned;
                    }
                }
            }
        }
        
        return multiplier;
    }
    
    calculateCost(baseCost, owned) {
        // Экспоненциальный рост стоимости
        return Math.floor(baseCost * Math.pow(1.15, owned));
    }
    
    // =======================
    // Работа с событиями
    // =======================
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    triggerEvent(event, data) {
        if (!this.eventListeners[event]) return;
        
        for (const callback of this.eventListeners[event]) {
            try {
                callback({ ...data, game: this });
            } catch (e) {
                console.error(`Error in event handler for ${event}:`, e);
            }
        }
    }
    
    startEvent(id) {
        const event = this.state.events.find(e => e.id === id);
        if (!event || event.active) return false;
        
        event.active = true;
        event.progress = 0;
        this.triggerEvent('eventStarted', { id });
        return true;
    }
    
    // =======================
    // Сохранение и загрузка
    // =======================
    
    save() {
        const saveData = {
            state: this.state,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('ClickRegenSave', JSON.stringify(saveData));
            this.triggerEvent('save', { data: saveData });
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }
    
    load() {
        try {
            const saveData = JSON.parse(localStorage.getItem('ClickRegenSave'));
            if (!saveData) return;
            
            // Восстановление основного состояния
            this.state = {
                ...this.state,
                ...saveData.state,
                lastUpdate: Date.now()
            };
            
            // Восстановление оффлайн-прогресса
            if (this.config.offlineProgress && saveData.timestamp) {
                const offlineTime = (Date.now() - saveData.timestamp) / 1000;
                if (offlineTime > 1) {
                    this.generateResources(offlineTime);
                    this.triggerEvent('offlineProgress', { time: offlineTime });
                }
            }
            
            this.triggerEvent('load', { data: saveData });
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    }
    
    reset() {
        // Сброс состояния
        this.state = {
            resources: { ...this.config.resources },
            upgrades: this.config.upgrades.map(upgrade => ({
                ...upgrade,
                owned: 0,
                unlocked: false
            })),
            generators: this.config.generators.map(generator => ({
                ...generator,
                owned: 0,
                unlocked: false
            })),
            achievements: this.config.achievements.map(achievement => ({
                ...achievement,
                unlocked: false,
                claimed: false
            })),
            events: this.config.events.map(event => ({
                ...event,
                active: false,
                progress: 0
            })),
            lastUpdate: Date.now(),
            gameStart: Date.now(),
            playTime: 0,
            totalClicks: 0
        };
        
        localStorage.removeItem('ClickRegenSave');
        this.triggerEvent('reset');
    }
    
    // =======================
    // Вспомогательные методы
    // =======================
    
    getResource(name) {
        return this.state.resources[name] || 0;
    }
    
    getUpgrade(id) {
        return this.state.upgrades.find(u => u.id === id);
    }
    
    getGenerator(id) {
        return this.state.generators.find(g => g.id === id);
    }
    
    getAchievement(id) {
        return this.state.achievements.find(a => a.id === id);
    }
    
    getEvent(id) {
        return this.state.events.find(e => e.id === id);
    }
    
    getPlayTime() {
        return this.state.playTime;
    }
    
    getTotalClicks() {
        return this.state.totalClicks;
    }
    
    exportSave() {
        const saveData = {
            state: this.state,
            timestamp: Date.now(),
            version: 1
        };
        return btoa(JSON.stringify(saveData));
    }
    
    importSave(encodedData) {
        try {
            const saveData = JSON.parse(atob(encodedData));
            if (saveData.version !== 1) throw new Error('Invalid save version');
            
            this.state = {
                ...this.state,
                ...saveData.state
            };
            
            this.save();
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
}

// Экспорт для разных сред
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClickRegen;
}
if (typeof window !== 'undefined') {
    window.ClickRegen = ClickRegen;
}
