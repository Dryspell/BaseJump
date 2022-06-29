const express = require("express");
const { getMarketData } = require("../controllers/marketControllers");

const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").get(protect, getMarketData);
// router.route("/buy").post(protect, buyItem);
// router.route("/sell").post(protect, sellItem);
// router.route("/:itemId?").get(protect, getItem);
// router.route("/:itemId?").delete(protect, deleteItem);

module.exports = router;
