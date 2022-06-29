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
            defense: { type: Number, default: 10 },
            speed: { type: Number, default: 10 },
        },
        locationData: {
            facingDirection: { type: Number, default: 0 },
            movementPath: { type: Array, default: [] },
            target: {
                type: mongoose.Schema.Types.ObjectId,
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

        currentAction: { type: Object, default: { action: "idle" } },
        atRestAction: { type: Object, default: { action: "idle" } },

        taskQueue: { type: Array, default: [] },
        taskHistory: { type: Array, default: [] },
        enemies: { type: Array, default: ["enemy"] },
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
