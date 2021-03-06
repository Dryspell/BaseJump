const express = require("express");
const {
    fetchMinions,
    spawnMinion,
    moveMinion,
    clearTaskQueue,
    fetchAllMinions,
} = require("../controllers/minionControllers");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/spawn").post(protect, spawnMinion);
// router.route("/testspawn").post(spawnMinion);

router.route("/move").patch(protect, moveMinion);
router.route("/cleartasks").delete(protect, clearTaskQueue);
router.route("/all").get(protect, fetchAllMinions);
router.route("/:minionId?").get(protect, fetchMinions);

module.exports = router;
