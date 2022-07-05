const express = require("express");
const {
    getWorlds,
    createWorld,
    startWorld,
} = require("../controllers/worldControllers");

const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("fetch/:id?").get(protect, getWorlds);
router.route("createWorld").post(protect, createWorld);
router.route("start/:locationId?").post(protect, startWorld);

module.exports = router;
