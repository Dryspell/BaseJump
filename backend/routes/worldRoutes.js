const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/:locationId?").get(protect, fetchLocationData);

module.exports = router;
