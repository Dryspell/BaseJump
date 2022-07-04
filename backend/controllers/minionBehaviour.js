const PF = require("pathfinding");
const { Minion } = require("../models/minionModel");
const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
};

const getRandomGridPoint = (coordinates, radius) => {
    // get random point within circle of radius
    const randomAngle = getRandomArbitrary(0, 2 * Math.PI);
    const randomIntDistance = Math.floor(getRandomArbitrary(1, radius + 1));
    const randomPoint = {
        x: coordinates.x + randomIntDistance * Math.cos(randomAngle),
        y: coordinates.y + randomIntDistance * Math.sin(randomAngle),
    };
    return randomPoint;
};

const distance2 = (a, b) => {
    if (
        !a ||
        !b ||
        !a.hasOwnProperty("x") ||
        !b.hasOwnProperty("x") ||
        !a.hasOwnProperty("y") ||
        !b.hasOwnProperty("y")
    ) {
        console.log(a, b);
        throw new Error("Invalid coordinates");
    }
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
};

const attackTarget = async (minion, attackType, task = null) => {
    minion.currentAction =
        attackType === "melee"
            ? "meleeAttack"
            : attackType === "ranged"
            ? "rangedAttack"
            : "idle";

    const attackSpeed =
        minion.currentAction === "meleeAttack"
            ? minion.stats.meleeAttackSpeed
            : minion.stats.rangedAttackSpeed;
    const attackCooldown =
        minion.currentAction === "meleeAttack"
            ? minion.stats.meleeAttackCooldown
            : minion.stats.rangedAttackCooldown;
    // console.log(`attackSpeed`, attackSpeed, `attackCooldown`, attackCooldown);
    const attackTask = (minion, timing) => {
        return {
            task: minion.currentAction,
            taskData: {
                target: minion.locationData.target,
            },
            eta:
                timing === "now"
                    ? Date.now()
                    : task
                    ? task.eta + Math.max(50000 / attackSpeed, attackCooldown)
                    : Date.now() +
                      Math.max(50000 / attackSpeed, attackCooldown),
        };
    };

    task = task ? task : attackTask(minion, "now");
    minion.locationData.target = task.taskData.target;
    console.log(
        `Minion ${minion._id} is ${attackType} attacking ${minion.locationData.target.type} ${minion.locationData.target._id}, health: ${minion.locationData.target.stats.health}`
    );
    const dmg = Math.floor(getRandomArbitrary(1, minion.stats.attack) / 2) ** 2;
    minion.locationData.target.stats.health -= dmg;
    minion.locationData.target.stats.health <= 0
        ? (minion.locationData.target.isAlive = false)
        : null;
    console.log(
        `Minion ${minion._id} did ${dmg} damage`,
        `to ${minion.locationData.target.type} ${minion.locationData.target._id}, health:`,
        minion.locationData.target.stats.health
    );
    minion.taskHistory.push(task);
    minion.taskQueue = [];

    if (minion.locationData.target.isAlive) {
        const nextAttack = attackTask(minion, "future");
        console.log(
            `Next: Minion ${minion._id} will attack ${
                nextAttack.taskData.target.type
            } ${nextAttack.taskData.target._id} again in ${
                (nextAttack.eta - Date.now()) / 1000
            } seconds`
        );
        minion.taskQueue.push(nextAttack);
    } else {
        console.log(
            `minion ${minion._id} killed ${minion.locationData.target.type} ${minion.locationData.target._id}`
        );
        minion.locationData.target = null;
    }

    try {
        const enemy = minion.locationData.target;
        const res = await Minion.updateOne(
            { _id: enemy._id },
            { "stats.health": enemy.stats.health }
        );
        console.log(
            `Updated enemy minion: ${enemy._id}, ${res.nModified} document saved to DB`
        );
    } catch (err) {
        console.log(err);
    }

    return minion;
};

const regenerateVision = async (minion) => {
    try {
        const getTilesInVision = (minion, radius = -1) => {
            radius = radius === -1 ? minion.stats.vision : radius;
            let tilesInVision = {
                tiles: [],
                boundary: [],
                radius: radius,
            };
            // console.log(`geting all tiles in circle of radius ${radius}`);
            const tile = (i, j) => {
                return {
                    x: minion.locationData.position.coordinates.x + i,
                    y: minion.locationData.position.coordinates.y + j,
                };
            };
            for (let i = -1 * radius; i <= radius; i++) {
                for (let j = -1 * radius; j <= radius; j++) {
                    // only push tiles in circle
                    if (i ** 2 + j ** 2 <= radius ** 2)
                        tilesInVision.tiles.push(tile(i, j));
                    if (i ** 2 + j ** 2 === radius ** 2)
                        tilesInVision.boundary.push(tile(i, j));
                    if (i < 0 && i ** 2 === radius ** 2)
                        tilesInVision.W = tile(i, j);
                    if (i > 0 && i ** 2 === radius ** 2)
                        tilesInVision.E = tile(i, j);
                    if (j > 0 && j ** 2 === radius ** 2)
                        tilesInVision.N = tile(i, j);
                    if (j < 0 && j ** 2 === radius ** 2)
                        tilesInVision.S = tile(i, j);
                }
            }
            tilesInVision.tiles = Array.from(new Set(tilesInVision.tiles));
            // console.log(
            //     `Minion ${minion._id} has ${tilesInVision.tiles.length} tiles in vision`,
            //     `with a circular ${tilesInVision.boundary.length} boundary tiles`,
            //     `\nNorth:`,
            //     tilesInVision.N,
            //     `and South:`,
            //     tilesInVision.S,
            //     `and East:`,
            //     tilesInVision.E,
            //     `and West:`,
            //     tilesInVision.W
            // );

            return tilesInVision;
        };
        minion.locationData.tilesInVision = getTilesInVision(minion);
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }

    try {
        minion.enemiesInVision = await Minion.find({
            "locationData.position.coordinates": {
                $in: minion.locationData.tilesInVision.tiles,
            },
            team: { $ne: minion.team },
            isAlive: true,
        }).exec();
        // Update all the minions that we see?
        // minion.enemiesInVision.forEach((enemy) => {
        //     enemy. updateTaskQueue(enemy);
        // });
        minion.enemiesInVision.sort((a, b) => {
            return (
                distance2(
                    a.locationData.position.coordinates,
                    minion.locationData.position.coordinates
                ) -
                distance2(
                    b.locationData.position.coordinates,
                    minion.locationData.position.coordinates
                )
            );
        });
        console.log(
            `Minion ${minion._id} found (${minion.enemiesInVision.length}) enemies in vision: `,
            minion.enemiesInVision.map((enemy) => {
                return [
                    `${enemy.type} ${enemy._id}`,
                    distance2(
                        enemy.locationData.position.coordinates,
                        minion.locationData.position.coordinates
                    ),
                ];
            })
        );
    } catch (err) {
        console.log(err);
        throw err;
    }

    try {
        // check if any enemies are in range
        minion.enemiesInMeleeRange = minion.enemiesInVision.filter((enemy) => {
            return (
                distance2(
                    minion.locationData.position.coordinates,
                    enemy.locationData.position.coordinates
                ) <=
                minion.stats.meleeAttackRange ** 2
            );
        });
        minion.enemiesInRangedRange = minion.enemiesInVision.filter((enemy) => {
            return (
                distance2(
                    minion.locationData.position.coordinates,
                    enemy.locationData.position.coordinates
                ) <=
                minion.stats.rangedAttackRange ** 2
            );
        });

        minion.enemiesInMeleeRange.length
            ? console.log(
                  `(${minion.enemiesInMeleeRange.length}) enemies in melee range: `,
                  minion.enemiesInMeleeRange.map((enemy) => {
                      return [
                          `${enemy.type} ${enemy._id}`,
                          distance2(
                              enemy.locationData.position.coordinates,
                              minion.locationData.position.coordinates
                          ),
                      ];
                  })
              )
            : console.log(`No enemies in melee range`);
        minion.enemiesInRangedRange.length
            ? console.log(
                  `(${minion.enemiesInRangedRange.length}) enemies in ranged range: `,
                  minion.enemiesInRangedRange.map((enemy) => {
                      return [
                          `${enemy.type} ${enemy._id}`,
                          distance2(
                              enemy.locationData.position.coordinates,
                              minion.locationData.position.coordinates
                          ),
                      ];
                  })
              )
            : console.log(`No enemies in ranged range`);
    } catch (err) {
        console.log(err);
        throw err;
    }
    Minion.updateOne(
        { _id: minion._id },
        {
            enemiesInVision: minion.enemiesInVision,
            enemiesInMeleeRange: minion.enemiesInMeleeRange,
            enemiesInRangedRange: minion.enemiesInRangedRange,
            "locationData.tilesInVision": minion.locationData.tilesInVision,
        }
    ).exec();
    return minion;
};

const engageTargetsInVision = async (minion, task = null) => {
    // console.log(`Minion ${minion._id} is checking for targets in vision`);
    minion = await regenerateVision(minion);

    try {
        if (task?.task) {
            if (
                task.task === "meleeAttack" &&
                minion.enemiesInMeleeRange.length > 0 &&
                minion.enemiesInMeleeRange
                    .map((enemy) => enemy._id)
                    .includes(task.taskData.target._id)
            ) {
                console.log(
                    `${task.taskData.target.type} ${task.taskData.target._id} is still in melee range`
                );
                console.log(
                    `Minion ${minion._id} is proceeding to ${
                        task.task
                    } an enemy ${
                        task.taskData.target.name
                    } in range at distance ${distance2(
                        task.taskData.target.locationData.position.coordinates,
                        minion.locationData.position.coordinates
                    )}`
                );
                minion = await attackTarget(minion, "melee", task);
            } else if (
                task.task === "rangedAttack" ||
                (task.task === "meleeAttack" &&
                    minion.enemiesInRangedRange.length > 0 &&
                    minion.enemiesInRangedRange
                        .map((enemy) => enemy._id)
                        .includes(task.taskData.target._id))
            ) {
                if (task.task === "meleeAttack") {
                    console.log(
                        `${task.taskData.target.type} ${task.taskData.target._id} is out of melee range, switching to ranged attack`
                    );
                    task.task = "rangedAttack";
                }

                console.log(
                    `Minion ${minion._id} is proceeding to ${
                        task.task
                    } an enemy ${
                        task.taskData.target.name
                    } in range at distance ${distance2(
                        task.taskData.target.locationData.position.coordinates,
                        minion.locationData.position.coordinates
                    )}`
                );
                minion = await attackTarget(minion, "ranged", task);
            }
        }
    } catch (err) {
        console.log(err);
        throw err;
    }

    try {
        if (minion.enemiesInMeleeRange.length > 0) {
            if (
                minion.locationData.target?._id ===
                minion.enemiesInMeleeRange[0]._id
            ) {
                console.log(
                    `Minion ${minion._id} is maintaining target ${minion.locationData.target.name}`
                );
            } else {
                console.log(
                    `Minion ${minion._id} has changed target from ${minion.locationData.target?.name} to ${minion.enemiesInMeleeRange[0].name}`,
                    minion.locationData.target?.name,
                    minion.enemiesInMeleeRange[0].name
                );
                console.log(
                    `Minion ${minion._id} has changed targets to ${minion.enemiesInMeleeRange[0].name}`
                );
                minion.locationData.target = minion.enemiesInMeleeRange[0];
            }
            minion = await attackTarget(minion, "melee");
        } else if (minion.enemiesInRangedRange.length > 0) {
            if (
                String(minion.locationData.target?._id) ==
                String(minion.enemiesInRangedRange[0]._id)
            ) {
                console.log(
                    `Minion ${minion._id} is already attacking ${minion.locationData.target?._id}`
                );
            } else {
                console.log(
                    `Minion ${minion._id} has changed targets from ${minion.locationData.target.name} to ${minion.enemiesInRangedRange[0].name}, and is attacking`
                );
                minion.locationData.target = minion.enemiesInRangedRange[0];
            }
            minion = await attackTarget(minion, "ranged");
        } else if (minion.enemiesInVision.length > 0) {
            minion.currentAction = "pursue";
            minion.locationData.sameTarget =
                minion.locationData.target === minion.enemiesInVision[0]
                    ? true
                    : false;
            minion.locationData.target = minion.enemiesInVision[0];
            console.log(
                `Minion ${minion._id} is doing "${
                    minion.currentAction
                }" towards ${
                    minion.locationData.sameTarget ? "same" : ""
                } target: ${minion.locationData.target.type} ${
                    minion.locationData.target._id
                } located at`,
                minion.locationData.target.locationData.position.coordinates
            );
            !minion.locationData.sameTarget
                ? (minion = await generatePathingMovementTasks(
                      minion,
                      minion.enemiesInVision[0]
                  ))
                : null;
        }
    } catch (err) {
        console.log(err);
        throw err;
    }

    return minion;
};

const evaluateTask = async (minion, task) => {
    try {
        minion.taskQueue =
            minion.taskQueue[0] == task
                ? minion.taskQueue.slice(1)
                : minion.taskQueue;
        if (task.taskData?.hasOwnProperty("to")) {
            if (
                task.taskData.to == minion.locationData.position.coordinates ||
                distance2(
                    minion.locationData.position.coordinates,
                    task.taskData.to
                ) > 1.5
            ) {
                return minion;
            }
        }

        console.log(
            `\nMinion ${minion._id} is executing task`,
            task.taskData?.target
                ? `${task.task} against ${task.taskData.target.type} ${task.taskData.target._id}`
                : task,
            task.eta
                ? `that happened at ${
                      (Date.now() - task.eta) / 1000
                  } seconds ago`
                : ""
        );
        if (task.task === "move") {
            minion.locationData.position.coordinates = task.taskData.to;
            minion.taskHistory.push(task);
            console.log(`Minion ${minion._id} moved to`, task.taskData.to);
        } else if (task.task === "pursue") {
            minion.locationData.target = task.taskData.target;
            minion = await generatePathingMovementTasks(
                minion,
                task.taskData.target
            );
        } else if (
            ["attack", "meleeAttack", "rangedAttack"].includes(task.task)
        ) {
            minion.taskQueue = [];
            minion = await engageTargetsInVision(minion, task);
        } else if (
            task.task === "patrol" &&
            minion.enemiesInVision.length === 0
        ) {
            // If no enemies in vision and no tasks in queue, generate a new move task to a random neighboring location
            console.log(
                `Minion ${minion._id} has no enemies in vision, patrolling randomly`
            );
            const randomNeighbor = getRandomGridPoint(
                minion.locationData.position.coordinates,
                3
            );
            minion = await generatePathingMovementTasks(minion, randomNeighbor);
        } else {
            if (minion.taskQueue.length > 0) {
                ["patrol", "pursue", "attack", "move"].includes(task.type)
                    ? console.log(`Next task is ${minion.taskQueue[0]}`)
                    : console.log("Unknown next task");
            }
        }

        console.log(
            `Minion ${minion._id} finished task ${task.task}${
                task.to ? " " + task.to : ""
            }`,
            `now located at`,
            minion.locationData.position.coordinates,
            `\n`
        );
    } catch (e) {
        console.log(e);
        throw e;
    }
    try {
        const res = await Minion.updateOne(
            { _id: minion._id },
            {
                locationData: minion.locationData,
                taskHistory: minion.taskHistory,
                taskQueue: minion.taskQueue,
            }
        );
        console.log(
            `Minion ${minion._id} updated, ${res.nModified} document saved to DB`
        );
    } catch (e) {
        console.log(e);
        throw e;
    }

    return minion;
};

const batchUpdateTaskQueue = async (minions) => {
    try {
        let taskless = minions.filter((minion) => {
            return minion.taskQueue.length === 0;
        });
        taskless = taskless.map(async (minion) => {
            return await generateTaskForTaskless(minion);
        });
        minions = minions
            .filter((minion) => {
                return minion.taskQueue.length > 0;
            })
            .map(async (minion) => {
                task = minion.taskQueue.shift();
                return await evaluateTask(minion, task);
            });
    } catch (e) {
        console.log(e);
        throw e;
    }
    return minions;
};

const updateTaskQueue = async (minion) => {
    minion.currentAction = "idle" ? minion.atRestAction : minion.currentAction;

    console.log(
        `Updating minion ${minion._id} task queue, ${minion.taskQueue.length} tasks in queue`,
        minion.taskQueue.length > 0
            ? ""
            : "\n Due to no tasks in queue, creating new task based on current/atRest action"
    );

    let taskCount = minion.taskQueue.length;
    for (let i = 0; i < taskCount; i++) {
        minion.taskQueue = minion.taskQueue.sort((a, b) => a.eta - b.eta);
        if (minion.taskQueue[0].eta > Date.now()) return minion;
        // let task = minion.taskQueue[0];
        // minion.taskQueue = minion.taskQueue.slice(1);
        let task = minion.taskQueue.shift();
        // console.log(` Evaluating task`, task, `Queue is now`, minion.taskQueue);

        minion = await evaluateTask(minion, task);
        taskCount === minion.taskQueue.length ? taskCount++ : null;
    }

    minion = await generateTaskForTaskless(minion);

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
            : movementTarget.x && movementTarget.y
            ? movementTarget
            : null;

    const currentCoords = minion.locationData.position.coordinates;

    if (coords) {
        coords.x = Math.floor(coords.x);
        coords.y = Math.floor(coords.y);
        console.log(
            `Minion ${minion._id} is pathing from`,
            currentCoords,
            `towards`,
            coords
        );
    } else {
        console.log(
            `Cannot find target for minion ${minion._id} to path towards`
        );
        return minion;
    }

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
    // const grid = Array(x2 - x1 + 1)
    //     .fill(0)
    //     .map((_, x) => {
    //         return Array(y2 - y1 + 1).fill(0);
    //     });

    const grid = new PF.Grid(x2 - x1 + 1, y2 - y1 + 1);
    const finder = new PF.AStarFinder();
    const path = finder.findPath(
        currentCoords.x - x1,
        currentCoords.y - y1,
        coords.x - x1,
        coords.y - y1,
        grid
    );

    // Find the path between the current position and the target position
    const evaluatePath = (minion, path) => {
        if (path == null) {
            console.log(`No path found between `, currentCoords, `and`, coords);
            return minion;
        } else {
            const truePath = path.map((node) => {
                return node.x
                    ? {
                          x: node.x + x1,
                          y: node.y + y1,
                      }
                    : {
                          x: node[0] + x1,
                          y: node[1] + y1,
                      };
            });
            console.log(
                `Path found between`,
                currentCoords,
                `and`,
                coords,
                `:\n`,
                truePath
            );

            // if (!appendQueue) {
            //     // console.log(
            //     //     `Canceled movement tasks, ${minion.taskQueue.length} tasks remaining`
            //     // );
            //     minion.taskQueue = minion.taskQueue.filter((task) => {
            //         return task.task !== "move";
            //     });
            // }
            let from = truePath.shift();
            const samePath = [];
            minion.taskQueue.sort((a, b) => a.eta - b.eta);
            truePath.forEach((node) => {
                if (
                    minion.taskQueue.filter(
                        (task) =>
                            task.taskData?.to?.x == node.x &&
                            task.taskData?.to?.y == node.y
                    ).length > 0
                ) {
                    samePath.push(node);
                } else {
                    const lastTask = minion.taskQueue
                        ? minion.taskQueue.sort((a, b) => b.eta - a.eta)[0]
                        : minion.taskHistory
                        ? minion.taskHistory.sort((a, b) => b.eta - a.eta)[0]
                        : null;
                    const eta =
                        lastTask?.eta ||
                        Date.now() + 50000 / minion.stats.speed;
                    minion.taskQueue.push({
                        eta: eta,
                        task: "move",
                        taskData: {
                            from: from,
                            to: node,
                        },
                    });
                }
                return (from = node);
            });
            console.log(
                `Of those, ${samePath.length} were the same path components and were not updated`
            );

            // Update the minion's facing direction
            minion.locationData.facingDirection =
                truePath.length > 0
                    ? (Math.atan2(
                          truePath[0].y - currentCoords.y,
                          truePath[0].x - currentCoords.x
                      ) *
                          180) /
                      Math.PI
                    : minion.locationData.facingDirection;
            // Save the minion
            console.log(
                `Added ${truePath.length} movement tasks to Minion ${minion._id} queue`
            );

            return minion;
        }
    };

    return evaluatePath(minion, path);
};

module.exports = {
    getRandomArbitrary,
    getRandomGridPoint,
    updateTaskQueue,
    generatePathingMovementTasks,
    engageTargetsInVision,
    regenerateVision,
    batchUpdateTaskQueue,
};

async function generateTaskForTaskless(minion) {
    if (minion.taskQueue.length == 0) {
        console.log(
            minion.taskQueue.length == 0
                ? "No tasks in queue"
                : "Tasks in queue"
        );
        minion.currentAction = minion.atRestAction;
        minion = await evaluateTask(minion, { task: minion.currentAction });
    }
    return minion;
}
