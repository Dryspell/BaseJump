const expressAsyncHandler = require("express-async-handler");
const { Minion } = require("../models/minionModel");
const colors = require("colors");
const {
    updateTaskQueue,
    generatePathingMovementTasks,
    getRandomArbitrary,
    getRandomGridPoint,
} = require("../controllers/minionBehaviour");

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
    spawnMinion,
    moveMinion,
    clearTaskQueue,
};
