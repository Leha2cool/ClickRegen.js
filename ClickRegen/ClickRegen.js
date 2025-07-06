/**
 * ClickRegen - Click Regen
 * Версия: 3.5
 * Дата: 2025-07-06
 * GitHub: https://github.com/Leha2cool
 */


class ClickRegen {
    constructor(config) {
        // Расширенная конфигурация по умолчанию
        this.defaultConfig = {
            resources: { points: 0 },
            currencies: ['points'],
            upgrades: [],
            generators: [],
            achievements: [],
            events: [],
            quests: [],
            prestige: [],
            saveInterval: 1000,
            offlineProgress: true,
            maxOfflineTime: 86400, // 24 часа в секундах
            version: "1.2"
        };

        // Слияние конфигураций с глубоким копированием
        this.config = this._deepMerge(this.defaultConfig, config);
        
        // Инициализация состояния
        this._initState();
        
        // Системные переменные
        this.activeTimers = [];
        this.eventListeners = {};
        this.running = false;
        this.debugMode = false;

        // Автозагрузка
        this.load();
        this.start();
    }

    // =======================
    // Внутренние методы
    // =======================
    
    _initState() {
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
                unlocked: false,
                efficiency: 1.0
            })),
            achievements: this.config.achievements.map(achievement => ({
                ...achievement,
                unlocked: false,
                claimed: false
            })),
            events: this.config.events.map(event => ({
                ...event,
                active: false,
                progress: 0,
                startedAt: 0
            })),
            quests: this.config.quests.map(quest => ({
                ...quest,
                completed: false,
                progress: 0,
                claimed: false
            })),
            prestige: {
                level: 0,
                currency: 0,
                upgrades: this.config.prestige.map(p => ({
                    id: p.id,
                    unlocked: false,
                    owned: 0
                }))
            },
            stats: {
                totalClicks: 0,
                totalGenerated: {},
                playTime: 0,
                lastReset: Date.now()
            },
            timestamps: {
                lastUpdate: Date.now(),
                gameStart: Date.now(),
                lastSave: Date.now()
            }
        };
    }

    _initResource(currency) {
        if (this.state.resources[currency] === undefined) {
            this.state.resources[currency] = 0;
        }
        if (this.state.stats.totalGenerated[currency] === undefined) {
            this.state.stats.totalGenerated[currency] = 0;
        }
    }

    _deepMerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                this._deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
        return target;
    }

    _applyModifiers(value, modifiers) {
        let result = value;
        
        // Применяем аддитивные модификаторы
        if (modifiers.additive) {
            result += modifiers.additive.reduce((sum, mod) => sum + mod.value, 0);
        }
        
        // Применяем мультипликативные модификаторы
        if (modifiers.multiplicative) {
            result *= modifiers.multiplicative.reduce((prod, mod) => prod * mod.value, 1);
        }
        
        // Применяем экспоненциальные модификаторы
        if (modifiers.exponential) {
            result = modifiers.exponential.reduce((val, mod) => 
                Math.pow(val, mod.value), result);
        }
        
        return result;
    }

    // =======================
    // Основные игровые методы
    // =======================
    
    start() {
        if (this.running) return;
        this.running = true;
        
        this.activeTimers.push(setInterval(() => this.update(), 250));
        this.activeTimers.push(setInterval(() => this.save(), this.config.saveInterval));
        
        this.triggerEvent('gameStarted');
    }

    stop() {
        if (!this.running) return;
        this.running = false;
        this.activeTimers.forEach(timer => clearInterval(timer));
        this.activeTimers = [];
        this.save();
        this.triggerEvent('gameStopped');
    }

    click(currency = 'points', amount = 1) {
        if (!this.running) return;
        
        this._initResource(currency);
        const baseAmount = amount * this.getGlobalMultiplier('click');
        
        // Случайный шанс критического клика
        const critChance = this.getModifierValue('critChance') || 0.05;
        const critMultiplier = this.getModifierValue('critMultiplier') || 2.0;
        const isCritical = Math.random() < critChance;
        
        const actualAmount = isCritical ? 
            baseAmount * critMultiplier : 
            baseAmount;
        
        this.state.resources[currency] += actualAmount;
        this.state.stats.totalClicks++;
        
        // Обновление квестов
        this.updateQuestProgress('click', { currency, amount: actualAmount });
        
        this.checkUnlocks();
        this.triggerEvent('click', { 
            currency, 
            amount: actualAmount, 
            isCritical 
        });
        
        return actualAmount;
    }

    buyUpgrade(id, quantity = 1) {
        if (!this.running) return false;
        
        const upgrade = this.state.upgrades.find(u => u.id === id);
        if (!upgrade || (!upgrade.unlocked && !upgrade.alwaysVisible)) return false;
        
        // Проверка максимального уровня
        if (upgrade.maxLevel && upgrade.owned + quantity > upgrade.maxLevel) {
            quantity = upgrade.maxLevel - upgrade.owned;
            if (quantity <= 0) return false;
        }
        
        // Проверка стоимости для всей партии
        for (const [currency, cost] of Object.entries(upgrade.cost)) {
            this._initResource(currency);
            let totalCost = 0;
            
            for (let i = 0; i < quantity; i++) {
                totalCost += this.calculateCost(cost, upgrade.owned + i);
            }
            
            if (this.state.resources[currency] < totalCost) {
                return false;
            }
        }
        
        // Оплата
        for (const [currency, cost] of Object.entries(upgrade.cost)) {
            let totalCost = 0;
            
            for (let i = 0; i < quantity; i++) {
                totalCost += this.calculateCost(cost, upgrade.owned + i);
            }
            
            this.state.resources[currency] -= totalCost;
        }
        
        // Применение покупки
        upgrade.owned += quantity;
        
        // Разблокировка при первом покупке
        if (!upgrade.unlocked) {
            upgrade.unlocked = true;
        }
        
        this.checkUnlocks();
        this.triggerEvent('upgradeBought', { id, quantity, newLevel: upgrade.owned });
        
        return true;
    }

    buyGenerator(id, quantity = 1) {
        if (!this.running) return false;
        
        const generator = this.state.generators.find(g => g.id === id);
        if (!generator || !generator.unlocked) return false;
        
        this._initResource(generator.currency);
        
        // Расчет стоимости для партии
        let totalCost = 0;
        for (let i = 0; i < quantity; i++) {
            totalCost += this.calculateCost(generator.cost, generator.owned + i);
        }
        
        if (this.state.resources[generator.currency] < totalCost) {
            return false;
        }
        
        // Оплата
        this.state.resources[generator.currency] -= totalCost;
        generator.owned += quantity;
        
        this.checkUnlocks();
        this.triggerEvent('generatorBought', { id, quantity, newCount: generator.owned });
        
        return true;
    }

    claimAchievement(id) {
        const achievement = this.state.achievements.find(a => a.id === id);
        if (!achievement || !achievement.unlocked || achievement.claimed) return false;
        
        // Выдача награды
        if (achievement.reward) {
            for (const [currency, amount] of Object.entries(achievement.reward)) {
                this._initResource(currency);
                this.state.resources[currency] += amount;
            }
        }
        
        // Применение модификаторов
        if (achievement.modifiers) {
            this._applyAchievementModifiers(achievement);
        }
        
        achievement.claimed = true;
        this.triggerEvent('achievementClaimed', { id });
        
        return true;
    }

    claimQuest(id) {
        const quest = this.state.quests.find(q => q.id === id);
        if (!quest || !quest.completed || quest.claimed) return false;
        
        // Выдача награды
        if (quest.reward) {
            for (const [currency, amount] of Object.entries(quest.reward)) {
                this._initResource(currency);
                this.state.resources[currency] += amount;
            }
        }
        
        // Применение модификаторов
        if (quest.modifiers) {
            this._applyQuestModifiers(quest);
        }
        
        quest.claimed = true;
        this.triggerEvent('questClaimed', { id });
        
        return true;
    }

    // =======================
    // Система престижа
    // =======================
    
    canPrestige() {
        return this.config.prestige.some(p => 
            p.unlockCondition && p.unlockCondition(this)
        );
    }
    
    prestige() {
        if (!this.canPrestige()) return false;
        
        const prestigeData = this._calculatePrestige();
        
        // Сброс состояния
        this._initState();
        
        // Сохранение престижных значений
        this.state.prestige.level = prestigeData.level;
        this.state.prestige.currency = prestigeData.currency;
        
        // Применение престижных улучшений
        this.config.prestige.forEach(p => {
            const upgrade = this.state.prestige.upgrades.find(u => u.id === p.id);
            if (upgrade && p.unlockCondition && p.unlockCondition(this)) {
                upgrade.unlocked = true;
            }
        });
        
        // Обновление времени
        this.state.timestamps.lastUpdate = Date.now();
        this.state.timestamps.gameStart = Date.now();
        this.state.stats.lastReset = Date.now();
        
        this.triggerEvent('prestige', { level: prestigeData.level, currency: prestigeData.currency });
        this.save();
        
        return true;
    }
    
    buyPrestigeUpgrade(id) {
        const upgrade = this.state.prestige.upgrades.find(u => u.id === id);
        if (!upgrade || !upgrade.unlocked) return false;
        
        const prestigeUpgrade = this.config.prestige.find(p => p.id === id);
        if (!prestigeUpgrade) return false;
        
        if (this.state.prestige.currency < prestigeUpgrade.cost) {
            return false;
        }
        
        this.state.prestige.currency -= prestigeUpgrade.cost;
        upgrade.owned++;
        
        // Применение эффектов
        if (prestigeUpgrade.effects) {
            this._applyPrestigeEffects(prestigeUpgrade);
        }
        
        this.triggerEvent('prestigeUpgradeBought', { id });
        return true;
    }
    
    // =======================
    // Игровое обновление
    // =======================
    
    update() {
        if (!this.running) return;
        
        const now = Date.now();
        const delta = (now - this.state.timestamps.lastUpdate) / 1000;
        
        this.state.stats.playTime += delta;
        this.state.timestamps.lastUpdate = now;
        
        // Генерация ресурсов
        this.generateResources(delta);
        
        // Проверка событий
        this.checkRandomEvents();
        
        // Проверка достижений и квестов
        this.checkAchievements();
        this.checkQuests();
        
        // Проверка разблокировок
        this.checkUnlocks();
        
        this.triggerEvent('update', { delta });
    }
    
    generateResources(delta) {
        for (const generator of this.state.generators) {
            if (generator.owned > 0) {
                this._initResource(generator.currency);
                const production = this.calculateProduction(generator, delta);
                
                this.state.resources[generator.currency] += production;
                this.state.stats.totalGenerated[generator.currency] += production;
            }
        }
    }
    
    calculateProduction(generator, delta) {
        // Базовая продукция
        let production = generator.baseProduction * generator.owned * delta;
        
        // Эффективность генератора
        production *= generator.efficiency;
        
        // Применение модификаторов
        const modifiers = {
            additive: [],
            multiplicative: [{
                source: 'global',
                value: this.getGlobalMultiplier('production')
            }]
        };
        
        // Модификаторы конкретного генератора
        const generatorModifiers = this.getGeneratorModifiers(generator.id);
        if (generatorModifiers.additive) {
            modifiers.additive.push(...generatorModifiers.additive);
        }
        if (generatorModifiers.multiplicative) {
            modifiers.multiplicative.push(...generatorModifiers.multiplicative);
        }
        
        return this._applyModifiers(production, modifiers);
    }
    
    checkRandomEvents() {
        if (!this.config.events.length) return;
        
        // Шанс триггера события каждую секунду
        const eventChance = this.getModifierValue('eventChance') || 0.001;
        
        if (Math.random() < eventChance) {
            const availableEvents = this.config.events.filter(e => 
                !this.state.events.some(se => se.id === e.id && se.active)
            );
            
            if (availableEvents.length > 0) {
                const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
                this.startEvent(randomEvent.id);
            }
        }
    }
    
    startEvent(id) {
        const eventConfig = this.config.events.find(e => e.id === id);
        if (!eventConfig) return false;
        
        const eventState = this.state.events.find(e => e.id === id);
        if (!eventState || eventState.active) return false;
        
        eventState.active = true;
        eventState.startedAt = Date.now();
        eventState.progress = 0;
        
        this.triggerEvent('eventStarted', { id });
        return true;
    }
    
    completeEvent(id) {
        const eventState = this.state.events.find(e => e.id === id);
        if (!eventState || !eventState.active) return;
        
        const eventConfig = this.config.events.find(e => e.id === id);
        
        // Выдача наград
        if (eventConfig.rewards) {
            for (const [currency, amount] of Object.entries(eventConfig.rewards)) {
                this._initResource(currency);
                this.state.resources[currency] += amount;
            }
        }
        
        // Применение модификаторов
        if (eventConfig.modifiers) {
            this._applyEventModifiers(eventConfig);
        }
        
        eventState.active = false;
        eventState.progress = 0;
        
        this.triggerEvent('eventCompleted', { id });
    }
    
    updateQuestProgress(type, data) {
        for (const quest of this.state.quests) {
            if (quest.completed || quest.claimed) continue;
            
            if (quest.condition && quest.condition.type === type) {
                const progress = quest.condition.checkProgress 
                    ? quest.condition.checkProgress(this, data) 
                    : 1;
                
                quest.progress += progress;
                
                if (quest.progress >= quest.condition.target) {
                    quest.completed = true;
                    this.triggerEvent('questCompleted', { id: quest.id });
                }
            }
        }
    }
    
    // =======================
    // Проверки состояний
    // =======================
    
    checkUnlocks() {
        // Разблокировка улучшений
        for (const upgrade of this.state.upgrades) {
            if (!upgrade.unlocked && upgrade.unlockCondition) {
                try {
                    upgrade.unlocked = upgrade.unlockCondition(this);
                    if (upgrade.unlocked) {
                        this.triggerEvent('upgradeUnlocked', { id: upgrade.id });
                    }
                } catch (e) {
                    this.logError(`Unlock error (${upgrade.id}):`, e);
                }
            }
        }
        
        // Разблокировка генераторов
        for (const generator of this.state.generators) {
            if (!generator.unlocked && generator.unlockCondition) {
                try {
                    generator.unlocked = generator.unlockCondition(this);
                    if (generator.unlocked) {
                        this.triggerEvent('generatorUnlocked', { id: generator.id });
                    }
                } catch (e) {
                    this.logError(`Unlock error (${generator.id}):`, e);
                }
            }
        }
        
        // Разблокировка престижных улучшений
        for (const upgrade of this.state.prestige.upgrades) {
            if (!upgrade.unlocked) {
                const config = this.config.prestige.find(p => p.id === upgrade.id);
                if (config && config.unlockCondition && config.unlockCondition(this)) {
                    upgrade.unlocked = true;
                    this.triggerEvent('prestigeUpgradeUnlocked', { id: upgrade.id });
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
                    this.logError(`Achievement error (${achievement.id}):`, e);
                }
            }
        }
    }
    
    checkQuests() {
        for (const quest of this.state.quests) {
            if (!quest.completed && !quest.claimed && quest.condition) {
                try {
                    if (quest.condition(this)) {
                        quest.completed = true;
                        this.triggerEvent('questCompleted', { id: quest.id });
                    }
                } catch (e) {
                    this.logError(`Quest error (${quest.id}):`, e);
                }
            }
        }
    }
    
    // =======================
    // Система модификаторов
    // =======================
    
    getModifierValue(modifierType) {
        let value = 0;
        
        // Модификаторы от улучшений
        for (const upgrade of this.state.upgrades) {
            if (upgrade.owned > 0 && upgrade.modifiers) {
                for (const mod of upgrade.modifiers) {
                    if (mod.type === modifierType) {
                        value += mod.value * upgrade.owned;
                    }
                }
            }
        }
        
        // Модификаторы от достижений
        for (const achievement of this.state.achievements) {
            if (achievement.claimed && achievement.modifiers) {
                for (const mod of achievement.modifiers) {
                    if (mod.type === modifierType) {
                        value += mod.value;
                    }
                }
            }
        }
        
        // Модификаторы от престижных улучшений
        for (const upgrade of this.state.prestige.upgrades) {
            if (upgrade.owned > 0) {
                const config = this.config.prestige.find(p => p.id === upgrade.id);
                if (config && config.modifiers) {
                    for (const mod of config.modifiers) {
                        if (mod.type === modifierType) {
                            value += mod.value * upgrade.owned;
                        }
                    }
                }
            }
        }
        
        return value;
    }
    
    getGlobalMultiplier(multiplierType) {
        return this.getModifierValue(multiplierType) || 1;
    }
    
    getGeneratorModifiers(generatorId) {
        const modifiers = {
            additive: [],
            multiplicative: []
        };
        
        // Глобальные модификаторы производства
        modifiers.multiplicative.push({
            source: 'global',
            value: this.getGlobalMultiplier('production')
        });
        
        // Специфические модификаторы генератора
        modifiers.multiplicative.push({
            source: 'generator',
            value: this.getModifierValue(`generator_${generatorId}`) || 1
        });
        
        return modifiers;
    }
    
    // =======================
    // Утилиты
    // =======================
    
    calculateCost(baseCost, owned, growthRate = 1.15) {
        return Math.floor(baseCost * Math.pow(growthRate, owned));
    }
    
    formatNumber(number) {
        if (number >= 1e15) return (number / 1e15).toFixed(2) + 'Q';
        if (number >= 1e12) return (number / 1e12).toFixed(2) + 'T';
        if (number >= 1e9) return (number / 1e9).toFixed(2) + 'B';
        if (number >= 1e6) return (number / 1e6).toFixed(2) + 'M';
        if (number >= 1e3) return (number / 1e3).toFixed(2) + 'K';
        return number.toFixed(2);
    }
    
    getResourcePerSecond(currency) {
        let production = 0;
        
        for (const generator of this.state.generators) {
            if (generator.currency === currency && generator.owned > 0) {
                production += this.calculateProduction(generator, 1);
            }
        }
        
        return production;
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
    
    off(event, callback) {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }
    
    triggerEvent(event, data = {}) {
        if (!this.eventListeners[event]) return;
        
        const eventData = {
            ...data,
            game: this,
            timestamp: Date.now()
        };
        
        for (const callback of this.eventListeners[event]) {
            try {
                callback(eventData);
            } catch (e) {
                this.logError(`Event error (${event}):`, e);
            }
        }
    }
    
    // =======================
    // Сохранение и загрузка
    // =======================
    
    save() {
        const saveData = {
            state: this.state,
            configVersion: this.config.version,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('ClickRegenSave', JSON.stringify(saveData));
            this.state.timestamps.lastSave = Date.now();
            this.triggerEvent('save', { data: saveData });
        } catch (e) {
            this.logError('Save failed:', e);
        }
    }
    
    load() {
        try {
            const saveString = localStorage.getItem('ClickRegenSave');
            if (!saveString) return;
            
            const saveData = JSON.parse(saveString);
            if (!saveData || !saveData.state) return;
            
            // Проверка версии
            if (saveData.configVersion !== this.config.version) {
                this.triggerEvent('versionMismatch', { 
                    savedVersion: saveData.configVersion, 
                    currentVersion: this.config.version 
                });
                return;
            }
            
            // Восстановление состояния
            this.state = saveData.state;
            this.state.timestamps.lastUpdate = Date.now();
            
            // Оффлайн-прогресс
            if (this.config.offlineProgress && saveData.timestamp) {
                let offlineTime = (Date.now() - saveData.timestamp) / 1000;
                
                // Ограничение максимального времени
                if (offlineTime > this.config.maxOfflineTime) {
                    offlineTime = this.config.maxOfflineTime;
                }
                
                if (offlineTime > 1) {
                    this.generateResources(offlineTime);
                    this.triggerEvent('offlineProgress', { time: offlineTime });
                }
            }
            
            this.triggerEvent('load', { data: saveData });
        } catch (e) {
            this.logError('Load failed:', e);
        }
    }
    
    reset() {
        this._initState();
        try {
            localStorage.removeItem('ClickRegenSave');
        } catch (e) {
            this.logError('Reset failed:', e);
        }
        this.triggerEvent('reset');
    }
    
    exportSave() {
        const saveData = {
            state: this.state,
            configVersion: this.config.version,
            timestamp: Date.now(),
            version: 2
        };
        return btoa(JSON.stringify(saveData));
    }
    
    importSave(encodedData) {
        try {
            const saveData = JSON.parse(atob(encodedData));
            if (!saveData || saveData.version !== 2) return false;
            
            // Проверка версии конфигурации
            if (saveData.configVersion !== this.config.version) {
                this.triggerEvent('versionMismatch', { 
                    savedVersion: saveData.configVersion, 
                    currentVersion: this.config.version 
                });
                return false;
            }
            
            this.state = saveData.state;
            this.state.timestamps.lastUpdate = Date.now();
            
            // Обработка офлайн-прогресса
            if (this.config.offlineProgress && saveData.timestamp) {
                let offlineTime = (Date.now() - saveData.timestamp) / 1000;
                
                if (offlineTime > this.config.maxOfflineTime) {
                    offlineTime = this.config.maxOfflineTime;
                }
                
                if (offlineTime > 1) {
                    this.generateResources(offlineTime);
                    this.triggerEvent('offlineProgress', { time: offlineTime });
                }
            }
            
            this.save();
            return true;
        } catch (e) {
            this.logError('Import failed:', e);
            return false;
        }
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
    
    getQuest(id) {
        return this.state.quests.find(q => q.id === id);
    }
    
    getPrestigeUpgrade(id) {
        return this.state.prestige.upgrades.find(u => u.id === id);
    }
    
    getPlayTime() {
        return this.state.stats.playTime;
    }
    
    getTotalClicks() {
        return this.state.stats.totalClicks;
    }
    
    logError(message, error) {
        if (this.debugMode) {
            console.error(message, error);
        }
        this.triggerEvent('error', { message, error });
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    // =======================
    // Приватные методы для модификаторов
    // =======================
    
    _calculatePrestige() {
        let currencyEarned = 0;
        
        // Расчет валюты престижа на основе игрового прогресса
        for (const currency in this.state.stats.totalGenerated) {
            currencyEarned += Math.sqrt(this.state.stats.totalGenerated[currency] / 1e6);
        }
        
        // Бонусы от достижений
        currencyEarned *= 1 + (this.state.achievements.filter(a => a.claimed).length * 0.05;
        
        return {
            level: this.state.prestige.level + 1,
            currency: currencyEarned
        };
    }
    
    _applyAchievementModifiers(achievement) {
        // Реализация применения модификаторов достижений
        // (В реальном проекте это было бы более сложно)
    }
    
    _applyQuestModifiers(quest) {
        // Реализация применения модификаторов квестов
    }
    
    _applyEventModifiers(event) {
        // Реализация применения модификаторов событий
    }
    
    _applyPrestigeEffects(upgrade) {
        // Реализация применения эффектов престижа
    }
}

// Экспорт для разных сред
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClickRegen;
}
if (typeof window !== 'undefined') {
    window.ClickRegen = ClickRegen;
}
