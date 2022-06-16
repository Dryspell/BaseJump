const express = require("express");
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroupChat,
    removeFromGroup,
    addToGroup,
} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/rename").patch(protect, renameGroupChat);
router.route("/groupadd").patch(protect, addToGroup);
router.route("/groupremove").patch(protect, removeFromGroup);

module.exports = router;
