const expressAsyncHandler = require("express-async-handler");
const { Minion } = require("../models/minionModel");

const fetchMinions = expressAsyncHandler(async (req, res) => {
    let minions;
    if (req.params.minionId) {
        minions = await Minion.findById(req.params.minionId);
    } else {
        minions = await Minion.find();
    }
    if (minions) {
        res.status(200).json({
            status: "success",
            data: {
                minions,
            },
        });
    } else {
        res.status(404).json({
            status: "fail",
            message: "No minions found",
        });
    }
});

const spawnMinion = expressAsyncHandler(async (req, res) => {
    const { userId } = req.body;
    const minion = await Minion.create({ owner: userId });
    if (minion) {
        res.status(201).json({
            status: "success",
            data: {
                minion,
            },
        });
    } else {
        res.status(400).json({
            status: "error",
            message: "Failed to create minion",
        });
        throw new Error("Failed to create minion");
    }
});

const moveMinion = expressAsyncHandler(async (req, res) => {
    const { minionId, coords } = req.body;
    const updatedMinion = await Minion.findByIdAndUpdate(
        minionId,
        {
            "minionLocationData.minionPosition.coordinates": coords,
        },
        { new: true }
    );
    if (updatedMinion) {
        res.status(200).json({
            status: "success",
            data: {
                updatedMinion,
            },
        });
    } else {
        res.status(400).json({
            status: "error",
            message: "Failed to update minion",
        });
        throw new Error("Failed to update minion");
    }
});

module.exports = {
    fetchMinions,
    spawnMinion,
    moveMinion,
};
