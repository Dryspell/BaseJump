const express = require("express");
const {
    fetchMinions,
    spawnMinion,
    moveMinion,
} = require("../controllers/minionControllers");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/:minionId?").get(protect, fetchMinions);
router.route("/spawn").post(protect, spawnMinion);
// router.route("/testspawn").post(spawnMinion);

router.route("/move/").patch(protect, moveMinion);

module.exports = router;
