const expressAsyncHandler = require("express-async-handler");
const { World } = require("../models/worldModel");

const createWorld = expressAsyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        return res.status(400).json({
            status: "error",
            message: "Please provide all required fields",
        });
    }
    const world = await World.create({ name, description });
    if (world) {
        res.status(201).json({
            status: "success",
            data: {
                world,
            },
        });
    } else {
        res.status(400).json({
            status: "error",
            message: "Failed to create world",
        });
        throw new Error("Failed to create world");
    }
});
const getWorlds = expressAsyncHandler(async (req, res) => {
    req.params.id = req.params._id || "";
    const worlds = await World.find(req.params._id || {});
    if (worlds) {
        res.status(200).json({
            status: "success",
            data: {
                worlds,
            },
        });
    } else {
        res.status(400).json({
            status: "error",
            message: "Failed to get worlds",
        });
        throw new Error("Failed to get worlds");
    }
});

const startWorld = expressAsyncHandler(async (req, res) => {
    const { worldId, isActive = true } = req.body;
    if (!worldId) {
        return res.status(400).json({
            status: "error",
            message: "Please provide all required fields",
        });
    }
    try {
        const world = await World.findByIdAndUpdate(worldId, {
            $set: {
                isActive: isActive,
            },
        });

        if (world) {
            res.status(200).json({
                status: "success",
                data: {
                    world,
                },
            });
        } else {
            res.status(400).json({
                status: "error",
                message: "Failed to start world",
            });
            throw new Error("Failed to start world");
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
});

module.exports = { createWorld, getWorlds, startWorld };
