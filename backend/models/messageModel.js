const mongoose = require("mongoose");

const messageModel = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageModel);

module.exports = { Message };
