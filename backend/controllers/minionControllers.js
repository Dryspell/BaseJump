const expressAsyncHandler = require("express-async-handler");
const easystarjs = require("easystarjs");
const { Minion } = require("../models/minionModel");
const { notFound } = require("../middleware/errorMiddleware");
const colors = require("colors");

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

function updateTaskQueue(minion) {
    const minionId = minion._id;
    // console.log(
    //     `Updating minion ${minionId} task queue, ${minion.taskQueue.length} tasks in queue`
    // );
    minion.taskQueue.sort((a, b) => a.eta - b.eta);
    for (i in minion.taskQueue) {
        if (minion.taskQueue[0].eta < Date.now()) {
            // console.log(`Task ${i} in progress: ${minion.taskQueue[i].eta}`);
            let task = minion.taskQueue.shift();

            switch (task.task) {
                case "move":
                    minion.locationData.position.coordinates = task.taskData.to;
                    minion.taskHistory.push(task);
                    // console.log(minion.taskQueue);
                    // console.log(
                    //     `Minion ${minionId} moved to`,
                    //     task.taskData.to
                    // );
                    break;
                default:
                    console.log("Unknown task".red);
            }
        }
    }
    return minion;
}

const clearTaskQueue = expressAsyncHandler(async (req, res) => {
    const { minionId } = req.body;
    // console.log(`Clearing task queue for minion ${minionId}`);
    const minion = await Minion.findById(minionId);
    if (!minion) {
        return;
    }
    minion.taskQueue = [];
    minion.locationData.movementPath = [];
    minion.locationData.target = null;

    await minion.save();
    res.status(200).json({
        status: "success",
        data: {
            minion,
        },
    });
});

const moveMinion = expressAsyncHandler(async (req, res) => {
    const { minionId, coords, appendQueue } = req.body;
    if (!minionId || !coords) {
        res.status(400).json({
            status: "error",
            message: "Please provide all required fields",
        });
        throw new Error("Please provide all required fields");
    }

    let minion = await Minion.findById(minionId);
    if (!minion) {
        return;
    } else {
        // console.log(
        //     `Received request to move minion ${minionId} from `,
        //     minion.locationData.position.coordinates,
        //     ` to `,
        //     coords
        // );
    }
    minion = updateTaskQueue(minion);

    const currentCoords = minion.locationData.position.coordinates;

    // Generate grid surrounding the current position: currentCoords and the target position: coords
    const gridPadding = 20;
    const x1 = Math.min(
        currentCoords.x - gridPadding,
        currentCoords.x + gridPadding,
        coords.x - gridPadding,
        coords.x + gridPadding
    );
    const x2 = Math.max(
        currentCoords.x - gridPadding,
        currentCoords.x + gridPadding,
        coords.x - gridPadding,
        coords.x + gridPadding
    );
    const y1 = Math.min(
        currentCoords.y - gridPadding,
        currentCoords.y + gridPadding,
        coords.y - gridPadding,
        coords.y + gridPadding
    );
    const y2 = Math.max(
        currentCoords.y - gridPadding,
        currentCoords.y + gridPadding,
        coords.y - gridPadding,
        coords.y + gridPadding
    );
    // Generate empty grid for testing
    const grid = Array(x2 - x1 + 1)
        .fill(0)
        .map((_, x) => {
            return Array(y2 - y1 + 1).fill(0);
        });
    // console.log(grid);

    const easystar = new easystarjs.js();
    easystar.setGrid(grid);
    easystar.setAcceptableTiles([0]);
    easystar.setIterationsPerCalculation(1000);

    // Find the path between the current position and the target position
    try {
        easystar.findPath(
            currentCoords.x - x1,
            currentCoords.y - y1,
            coords.x - x1,
            coords.y - y1,
            (path) => {
                if (path === null) {
                    res.status(400).json({
                        status: "error",
                        message: "No path found",
                    });
                    throw new Error(
                        `No path found between `,
                        currentCoords,
                        ` and `,
                        coords
                    );
                } else {
                    const truePath = path.map((node) => {
                        return {
                            x: node.x + x1,
                            y: node.y + y1,
                        };
                    });
                    // console.log(
                    //     `Path found between`,
                    //     currentCoords,
                    //     ` and `,
                    //     coords
                    // );
                    let eta = Date.now();
                    let from = currentCoords;
                    let to = truePath[0];
                    if (!appendQueue) {
                        minion.taskQueue = minion.taskQueue.filter((task) => {
                            return task.task !== "move";
                        });
                        // console.log(
                        //     `Canceled movement tasks, ${minion.taskQueue.length} tasks remaining`
                        // );
                    }
                    truePath.forEach((node) => {
                        eta += Math.floor(50000 / minion.stats.speed);
                        minion.taskQueue.push({
                            eta: eta,
                            task: "move",
                            taskData: {
                                from: from,
                                to: node,
                            },
                        });
                        from = node;
                    });
                    // Update the minion's movement path
                    minion.locationData.movementPath = truePath;

                    // Update the minion's facing direction
                    minion.locationData.facingDirection =
                        (Math.atan2(
                            truePath[1].y - currentCoords.y,
                            truePath[1].x - currentCoords.x
                        ) *
                            180) /
                        Math.PI;
                    // Save the minion
                    // console.log(`added ${truePath.length} tasks to queue`);
                    minion.save();
                    res.status(200).json({
                        status: "success",
                        data: {
                            minion,
                        },
                    });
                }
            }
        );
        easystar.calculate();
    } catch (err) {
        console.log(err);
    }
});

module.exports = {
    fetchMinions,
    spawnMinion,
    moveMinion,
    clearTaskQueue,
};
