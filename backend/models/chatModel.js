const mongoose = require("mongoose");

const chatModel = mongoose.Schema(
    {
        isGroupChat: { type: Boolean, default: false },
        chatName: { type: String, default: `Chat_${Date.now()}` },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
