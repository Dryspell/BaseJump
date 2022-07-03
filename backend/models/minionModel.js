const mongoose = require("mongoose");

const coordinatesSchema = new mongoose.Schema({
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
});

const Coordinates = mongoose.model("Coordinates", coordinatesSchema);

const minionSchema = mongoose.Schema(
    {
        name: { type: String, default: `Minion_${Date.now()}` },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isAlive: { type: Boolean, default: true },
        type: { type: String, default: "Minion" },
        stats: {
            level: { type: Number, default: 1 },
            health: { type: Number, default: 100 },
            attack: { type: Number, default: 10 },
            meleeAttackSpeed: { type: Number, default: 10 },
            rangedAttackSpeed: { type: Number, default: 10 },
            meleeAttackCooldown: { type: Number, default: 1000 },
            rangedAttackCooldown: { type: Number, default: 1000 },
            defense: { type: Number, default: 10 },
            speed: { type: Number, default: 10 },
            meleeAttackRange: { type: Number, default: 1.5 },
            rangedAttackRange: { type: Number, default: 4 },
            vision: { type: Number, default: 10 },
        },
        locationData: {
            tilesInVision: { type: Object, default: {} },
            facingDirection: { type: Number, default: 0 },
            // movementPath: { type: Array, default: [] },
            target: {
                type: Object,
                default: null,
            },
            movementTarget: {
                type: Object,
                default: null,
            },
            position: {
                type: { type: String, default: "Point" },
                coordinates: {
                    type: Object,
                    default: { x: 0, y: 0 },
                    ref: "Coordinates",
                },
            },
        },

        experience: { type: Number, default: 0 },
        inventory: { type: Array, default: [] },
        equipment: { type: Object, default: {} },

        currentAction: { type: String, default: "idle" },
        atRestAction: { type: String, default: "idle" },

        taskQueue: { type: Array, default: [] },
        taskHistory: { type: Array, default: [] },
        enemies: { type: Array, default: ["enemy"] },
        enemiesInVision: { type: Array, default: [] },
        enemiesInMeleeRange: { type: Array, default: [] },
        enemiesInRangedRange: { type: Array, default: [] },
        team: { type: Array, default: ["ally"] },
        allies: { type: Array, default: ["ally"] },
        logs: { type: Array, default: [] },
        statistics: {
            type: Object,
            default: {
                kills: 0,
                deaths: 0,
                assists: 0,
                damageDealt: 0,
                damageTaken: 0,
                healing: 0,
                damageDealtToEnemies: 0,
                damageTakenFromEnemies: 0,
            },
        },
    },
    {
        timestamps: true,
    }
);

const Minion = mongoose.model("Minion", minionSchema);

module.exports = { Minion, Coordinates };
