const mongoose = require("mongoose");

const coordinatesSchema = new mongoose.Schema({
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
});

const Coordinates = mongoose.model("Coordinates", coordinatesSchema);

const minionSchema = mongoose.Schema(
    {
        minionName: { type: String, default: `Minion_${Date.now()}` },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isAlive: { type: Boolean, default: true },
        minionType: { type: String, default: "Minion" },
        minionStats: {
            minionLevel: { type: Number, default: 1 },
            minionHealth: { type: Number, default: 100 },
            minionAttack: { type: Number, default: 10 },
            minionDefense: { type: Number, default: 10 },
            minionSpeed: { type: Number, default: 10 },
        },
        minionLocationData: {
            minionFacingDirection: { type: Number, default: 0 },
            minionMovementPath: { type: Array, default: [] },
            minionTarget: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
            minionPosition: {
                type: { type: String, default: "Point" },
                coordinates: {
                    type: Object,
                    default: { x: 0, y: 0 },
                    ref: "Coordinates",
                },
            },
        },
        minionExperience: { type: Number, default: 0 },
        minionInventory: { type: Array, default: [] },
        minionEquipment: { type: Object, default: {} },
    },
    {
        timestamps: true,
    }
);

const Minion = mongoose.model("Minion", minionSchema);

module.exports = { Minion, Coordinates };
