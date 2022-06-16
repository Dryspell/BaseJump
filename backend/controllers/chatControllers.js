const expressAsyncHandler = require("express-async-handler");
const { Mongoose } = require("mongoose");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = expressAsyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate("users", "-password")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({
                _id: createdChat._id,
            }).populate("users", "-password");
            res.status(200).json(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

const fetchChats = expressAsyncHandler(async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { groupAdmin: req.user._id },
            ],
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .limit(10)
            .then(async (chats) => {
                chats = await User.populate(chats, {
                    path: "latestMessage.sender",
                    select: "name pic email",
                });
                res.status(200).send(chats);
            });

        chats.forEach(async (chat) => {
            chat.users.forEach(async (user) => {
                if (user._id.toString() === req.user._id.toString()) {
                    chat.chatName = user.name;
                    chat.pic = user.pic;
                }
            });
        });

        chats.forEach(async (chat) => {
            if (chat.latestMessage) {
                chat.latestMessage.sender = await User.findOne({
                    _id: chat.latestMessage.sender,
                }).select("name pic email");
            }
        });

        res.status(200).json(chats);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const createGroupChat = expressAsyncHandler(async (req, res) => {
    if (!req.body.chatName || !req.body.users) {
        return res
            .sendStatus(400)
            .send({ message: "Please provide chat name and users" });
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res.sendStatus(400).send({
            message: "More than two users are required to form a group chat",
        });
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.chatName,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const FullChat = await Chat.findOne({
            _id: groupChat._id,
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(FullChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const renameGroupChat = expressAsyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;
    Mongoose.set("useFindAndModify", false);
    const updatedChat = await Chat.findOneAndUpdate(
        { _id: chatId },
        { chatName: chatName },
        { new: true }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat not found");
    } else {
        res.status(200).json(updatedChat);
    }
});

const addToGroup = expressAsyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        { new: true }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!added) {
        res.status(404);
        throw new Error("Chat not found");
    } else {
        res.status(200).json(added);
    }
});

const removeFromGroup = expressAsyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;
    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        { new: true }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(404);
        throw new Error("Chat not found");
    } else {
        res.status(200).json(removed);
    }
});

module.exports = {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroupChat,
    addToGroup,
    removeFromGroup,
};
