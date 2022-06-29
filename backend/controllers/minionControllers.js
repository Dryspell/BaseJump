const expressAsyncHandler = require("express-async-handler");
const easystarjs = require("easystarjs");
const { Minion } = require("../models/minionModel");
const { notFound } = require("../middleware/errorMiddleware");
const colors = require("colors");

const fetchMinions = expressAsyncHandler(async (req, res) => {
    if (!req.params.minionId) {
        console.log(req.params);
        res.status(404).json({
            status: "fail",
            message: "No minions found",
        });
    }
    console.log(`Fetching minion ${req.params.minionId}`);

    let minion = await fetchMinion(req.params.minionId);

    if (minion) {
        await minion.save();
        res.status(200).json({
            status: "success",
            data: minion,
        });
    }
});

const fetchMinion = async (minionId) => {
    const minion = await Minion.findById(minionId);
    console.log(`Fetched minion ${minionId}`);
    if (minion) {
        return updateTaskQueue(minion);
    }
    return null;
};

const spawnMinion = expressAsyncHandler(async (req, res) => {
    const { userId, allies, enemies, position, random_pos } = req.body;
    // TODO: validate userId, allies, enemies, position, random_pos
    const IS_ADMIN = req.user.isAdmin || true;
    const radius = 10;

    const getRandomArbitrary = (min, max) => {
        return Math.random() * (max - min) + min;
    };

    const minion = IS_ADMIN
        ? await Minion.create({
              owner: userId,
              allies: allies || ["ally"],
              enemies: enemies || ["enemy"],
              locationData: {
                  position: {
                      coordinates:
                          position || random_pos
                              ? {
                                    x: Math.floor(
                                        getRandomArbitrary(-radius, radius)
                                    ),
                                    y: Math.floor(
                                        getRandomArbitrary(-radius, radius)
                                    ),
                                }
                              : {
                                    x: 0,
                                    y: 0,
                                },
                      movementPath: [],
                  },
              },
          })
        : await Minion.create({
              owner: userId,
          });
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
    const taskCount = minion.taskQueue.length;
    console.log(
        `Updating minion ${minionId} task queue, ${minion.taskQueue.length} tasks in queue`
    );

    minion.taskQueue = minion.taskQueue.sort((a, b) => a.eta - b.eta);
    if (taskCount === 0) return minion;

    for (let i = 0; i < taskCount; i++) {
        if (minion.taskQueue[0].eta > Date.now()) return minion;
        // let task = minion.taskQueue[0];
        // minion.taskQueue = minion.taskQueue.slice(1);
        let task = minion.taskQueue.shift();

        if (task.taskData.to == minion.locationData.position.coordinates) {
            continue;
        }

        console.log(
            `Minion ${minionId} is executing task`,
            task,
            `that happened at ${(Date.now() - task.eta) / 1000} seconds ago`
        );

        if (task.task == "move") {
            minion.locationData.position.coordinates = task.taskData.to;
            minion.locationData.movementPath = minion.taskQueue
                .filter((t) => t.task == "move")
                .map((t) => t.taskData.to);
            minion.taskHistory.push(task);
            console.log(`Minion ${minionId} moved to`, task.taskData.to);
        } else {
            minion.taskQueue = minion.taskQueue.filter(
                (t) => t.task !== "move"
            );
            minion.locationData.movementPath = [];
            console.log("Unknown task");
        }
    }

    return minion;
}

const clearTaskQueue = expressAsyncHandler(async (req, res) => {
    const { minionId } = req.body;
    const minion = await fetchMinion(minionId);

    if (!minion) {
        res.status(404).json({
            status: "fail",
            message: "Minion not found",
        });
        throw new Error("Minion not found");
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

    let minion = await fetchMinion(minionId);
    if (!minion) {
        res.status(404).json({
            status: "fail",
            message: "Minion not found",
        });
        throw new Error("Minion not found");
    } else {
        console.log(
            `Received request to move minion ${minionId} from `,
            minion.locationData.position.coordinates,
            ` to `,
            coords
        );
    }

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
                    console.log(
                        `Path found between`,
                        currentCoords,
                        ` and `,
                        coords
                    );
                    let eta = Date.now();
                    let from = truePath[0];
                    let to = truePath[1];
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
