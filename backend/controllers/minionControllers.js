const expressAsyncHandler = require("express-async-handler");
const { Minion } = require("../models/minionModel");
const colors = require("colors");
const {
    updateTaskQueue,
    generatePathingMovementTasks,
    getRandomArbitrary,
    getRandomGridPoint,
    engageTargetsInVision,
    regenerateVision,
} = require("../controllers/minionBehaviour");

const fetchMinions = expressAsyncHandler(async (req, res) => {
    if (!req.params.minionId) {
        console.log(req.params);
        res.status(404).json({
            status: "fail",
            message: "No minions found",
        });
    }
    console.log(
        `\n /////////////////////////////////////////////////////// \n`
    );
    console.log(`Fetching minion ${req.params.minionId}`);

    let minion = await fetchMinion(req.params.minionId);

    if (minion) {
        minion = await minion.save();
        res.status(200).json({
            status: "success",
            data: minion,
        });
    }
    console.log(
        `\n /////////////////////////////////////////////////////// \n`
    );
});

const fetchAllMinions = expressAsyncHandler(async (req, res) => {
    console.log(
        `\n /////////////////////////////////////////////////////// \n`
    );
    let { coords, x, y } = req.body;
    if (x && y) {
        coords = { x: x, y: y };
    }
    console.log(`Fetching all minions`, coords ? `at ${coords}` : "");

    const IS_ADMIN = req.user.isAdmin || true;
    if (!IS_ADMIN) {
        console.log(
            `${req.user.email} is not an admin, cannot access all minions resouce`
        );
        res.status(403).json({
            status: "fail",
            message: "You are not authorized to view this page",
        });
    }

    const minions = await Minion.find(
        coords
            ? {
                  "locationData.position.coordinates": {
                      $in: [coords],
                  },
              }
            : {}
    ).exec();
    console.log(minions.length);
    if (minions) {
        res.status(200).json({
            status: "success",
            data: minions,
        });
    }
    console.log(
        `\n /////////////////////////////////////////////////////// \n`
    );
});

const fetchMinion = async (minionId) => {
    const minion = await Minion.findById(minionId);
    const taskCount = minion.taskQueue.length;
    console.log(
        `Found minion ${minion._id} from DB, located at`,
        minion.locationData.position.coordinates,
        `with ${taskCount} tasks`
    );
    let updatedMinion = await regenerateVision(minion);
    try {
        updatedMinion.enemiesInVision.forEach(async (enemy) => {
            updateTaskQueue(enemy);
        });
    } catch (e) {
        console.log(e);
    }
    updatedMinion = await updateTaskQueue(minion);
    console.log(
        `Fetched minion has been updated with ${
            updatedMinion.taskQueue.length - taskCount
        } new tasks, queue length: ${updatedMinion.taskQueue.length}`
    );
    return updatedMinion;
};

const spawnMinion = expressAsyncHandler(async (req, res) => {
    const {
        userId,
        allies,
        enemies,
        position,
        random_pos,
        currentAction,
        atRestAction,
        team,
    } = req.body;
    // TODO: validate userId, allies, enemies, position, random_pos
    const IS_ADMIN = req.user.isAdmin || true;
    const radius = 10;

    const minion = IS_ADMIN
        ? await Minion.create({
              owner: userId,
              allies: allies || ["ally"],
              enemies: enemies || ["enemy"],
              currentAction: currentAction || "idle",
              atRestAction: atRestAction || "idle",
              team: team || [],
              locationData: {
                  position: {
                      type: "Point",
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
    const { minionId, coords, appendQueue, target } = req.body;
    if (!minionId || (!coords && !target)) {
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
        const position = coords
            ? { type: "Point", coordinates: coords }
            : target.type == "Minion"
            ? target.locationData.position
            : null;
        console.log(
            `Received request to move minion ${minionId} from `,
            minion.locationData.position.coordinates,
            ` to `,
            position
        );
    }
    minion = generatePathingMovementTasks(minion, position);
    minion.save();
    return res.status(200).json({
        status: "success",
        data: {
            minion,
        },
    });
});

module.exports = {
    fetchMinions,
    fetchAllMinions,
    spawnMinion,
    moveMinion,
    clearTaskQueue,
};
