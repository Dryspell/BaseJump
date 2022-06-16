const expressAsyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const { Message } = require("../models/messageModel");
const User = require("../models/userModel");

const sendMessage = expressAsyncHandler(async (req, res) => {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        console.log("ChatId or message not sent with request");
        return res.sendStatus(400);
    }

    const messageData = {
        chat: chatId,
        sender: req.user._id,
        message: message,
    };

    try {
        let message = await Message.create(messageData);
        message = await message.populate("sender", "name pic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message,
        });

        res.status(200).json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { messages: messageData },
        },
        { new: true }
    );
    if (updatedChat) {
        res.status(200).json({
            status: "success",
            data: {
                updatedChat,
            },
        });
    } else {
        res.status(400).json({
            status: "error",
            message: "Failed to send message",
        });
        throw new Error("Failed to send message");
    }
});

const allMessages = expressAsyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name pic email")
            .populate("chat");
        res.status(200).json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = {
    sendMessage,
    allMessages,
};
