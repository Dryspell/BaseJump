const easystarjs = require("easystarjs");
const { Minion } = require("../models/minionModel");
const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
};

const getRandomGridPoint = (coordinates, radius) => {
    // get random point within circle of radius
    const randomAngle = getRandomArbitrary(0, 2 * Math.PI);
    const randomIntDistance = Math.floor(getRandomArbitrary(0, radius + 1));
    const randomPoint = {
        x: coordinates.x + randomIntDistance * Math.cos(randomAngle),
        y: coordinates.y + randomIntDistance * Math.sin(randomAngle),
    };
    return randomPoint;
};

const distance = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const attackTarget = async (minion, attackType) => {
    minion.currentAction =
        attackType === "melee"
            ? "meleeAttack"
            : attackType === "ranged"
            ? "rangedAttack"
            : "idle";

    const attackTask = (minion, timing) => {
        const attackSpeed =
            minion.currentAction === "meleeAttack"
                ? minion.meleeAttackSpeed
                : minion.rangedAttackSpeed;
        const attackCooldown =
            minion.currentAction === "meleeAttack"
                ? minion.meleeAttackCooldown
                : minion.rangedAttackCooldown;
        return {
            task: minion.currentAction,
            taskData: {
                target: minion.locationData.target,
            },
            eta:
                timing === "now"
                    ? Date.now()
                    : Date.now() +
                      Math.max(
                          50000 / minion.stats.attackSpeed,
                          minion.stats.attackCooldown
                      ),
        };
    };

    const task = attackTask(minion, "now");
    minion.locationData.target.stats.health -=
        Math.floor((Math.random() * minion.stats.attack) / 2) ** 2;
    await minion.target.save();

    console.log(
        `Minion ${minionId} ${attackType} attacked ${minion.locationData.target._id}`
    );

    minion.taskHistory.push(task);
    minion.taskQueue.push(attackTask(minion, "future"));

    return minion;
};

const engageTargetsInVision = async (minion) => {
    // check if any enemies are in range
    const getTilesInVision = (minion, radius = minion.vision) => {
        const tiles = [];
        // get all tiles in circle of radius vision
        for (let i = -radius; i < radius; i++) {
            for (let j = 0; j < radius - i; j++) {
                const tile = (i, j) => {
                    return {
                        x: minion.locationData.position.coordinates.x + i,
                        y: minion.locationData.position.coordinates.y + j,
                    };
                };
                tiles.push(tile(i, j));
            }
        }
        return tiles;
    };

    minion.enemiesInVision = await Minion.find({
        locationData: {
            position: {
                type: "Point",
                coordinates: { $in: getTilesInVision(minion) },
            },
        },
        $or: [
            { team: { $in: minion.enemies } },
            { enemies: { $in: minion.team } },
        ],
    });
    if (minion.enemiesInVision.length > 0) {
        // check if any enemies are in range
        minion.enemiesInMeleeRange = minion.enemiesInVision.filter((enemy) => {
            return (
                distance(
                    minion.locationData.position.coordinates,
                    enemy.locationData.position.coordinates
                ) < minion.stats.meleeAttackRange
            );
        });
        minion.enemiesInRangedRange = minion.enemiesInVision.filter((enemy) => {
            return (
                distance(
                    minion.locationData.position.coordinates,
                    enemy.locationData.position.coordinates
                ) < minion.stats.rangedAttackRange
            );
        });

        console.log(
            `Minion ${minionId} found (${minion.enemiesInVision.length}) enemies in vision: `,
            minion.enemiesInVision,
            `(${minion.enemiesInMeleeRange.length}) enemies in melee range: `,
            minion.enemiesInMeleeRange,
            `(${minion.enemiesInRangedRange.length}) enemies in ranged range: `,
            minion.enemiesInRangedRange
        );

        if (minion.enemiesInMeleeRange.length > 0) {
            minion.locationData.target = minion.enemiesInMeleeRange[0];
            minion = attackTarget(minion, "melee");
        } else if (minion.enemiesInRangedRange.length > 0) {
            minion.locationData.target = minion.enemiesInRangedRange[0];
            minion = attackTarget(minion, "ranged");
        } else {
            // move to target
            // change mode to pursue
            minion.currentAction = "pursue";
            minion.locationData.target = minion.enemiesInVision[0];
            minion = generatePathingMovementTasks(
                minion,
                minion.enemiesInVision[0]
            );
        }
    } else {
        // If no enemies in vision and no tasks in queue, generate a new move task to a random neighboring location
        if (minion.taskQueue.length == 0) {
            const randomNeighbor = getRandomGridPoint(
                minion.locationData.position.coordinates,
                3
            );
            minion = generatePathingMovementTasks(minion, randomNeighbor);
        }
    }
    return minion;
};

const updateTaskQueue = async (minion) => {
    const minionId = minion._id;
    const taskCount = minion.taskQueue.length;

    minion.currentAction = "idle" ? minion.atRestAction : minion.currentAction;

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

        if (
            task.task == "move" &&
            ["idle", "wander"].includes(minion.currentAction)
        ) {
            minion.locationData.position.coordinates = task.taskData.to;
            minion.locationData.movementPath = minion.taskQueue
                .filter((t) => t.task == "move")
                .map((t) => t.taskData.to);
            minion.taskHistory.push(task);
            console.log(`Minion ${minionId} moved to`, task.taskData.to);
        } else if (
            task.task == "patrol" ||
            (task.task == "move " && ["patrol"].includes(minion.currentAction))
        ) {
            minion = engageTargetsInVision(minion);
        } else if (task.task === "pursue") {
            minion.locationData.target = task.taskData.target;
            minion = generatePathingMovementTasks(minion, task.taskData.target);
        } else if (task.task === "attack") {
            minion.locationData.target = task.taskData.target;
            minion = engageTargetsInVision(minion);
        } else {
            minion.taskQueue = minion.taskQueue.filter(
                (t) => t.task !== "move"
            );
            minion.locationData.movementPath = [];
            if (minion.taskQueue.length > 0) {
                console.log("Unknown task");
            }
        }
    }

    return minion;
};

const generatePathingMovementTasks = (
    minion,
    movementTarget,
    appendQueue = false
) => {
    const coords =
        movementTarget.type == "Point"
            ? movementTarget.coordinates
            : movementTarget.type == "Minion"
            ? movementTarget.locationData.position.coordinates
            : null;

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

                    if (!appendQueue) {
                        minion.taskQueue = minion.taskQueue.filter((task) => {
                            return task.task !== "move";
                        });
                        // console.log(
                        //     `Canceled movement tasks, ${minion.taskQueue.length} tasks remaining`
                        // );
                    }
                    let from = truePath.shift();
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
                    return minion;
                }
            }
        );
        return easystar.calculate();
    } catch (err) {
        console.log(err);
        return minion;
    }
};

module.exports = {
    getRandomArbitrary,
    getRandomGridPoint,
    updateTaskQueue,
    generatePathingMovementTasks,
};
