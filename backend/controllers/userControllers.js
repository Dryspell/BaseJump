const expressAsyncHandler = require("express-async-handler");
const { generateToken } = require("../config/generateToken");
const User = require("../models/userModel");

const registerUser = expressAsyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            status: "error",
            message: "Please provide all required fields",
        });
    }

    // Check if user already exists in mongoDB
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400).json({
            status: "error",
            message: "User already exists",
        });
        throw new Error("User already exists");
    }

    let user = await User.create({ name, email, password, pic });

    if (user) {
        delete user.password;
        res.status(201).json({
            data: {
                user,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({
            status: "error",
            message: "Failed to create user",
        });
        throw new Error("Failed to create user");
    }
});

const authUser = expressAsyncHandler(async (req, res) => {
    // console.log(`Attempting to authenticate user: ${req.body.email}`);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        // console.log(`User ${user.email} authenticated`);
        const { password, ...rest } = user;
        res.status(200).json({
            data: {
                user: rest,
            },
            token: generateToken(user._id),
        });
    } else {
        if (!user) {
            console.log(
                `User ${req.body.email} failed to authenticate; User does not exist`
            );
            res.status(400).json({
                status: "error",
                message: "User does not exist",
            });
        } else
            console.log(
                `User ${req.body.email} failed to authenticate; Password incorrect`
            );
        res.status(400).json({
            status: "error",
            message: "Incorrect password",
        });
    }
});

const allUsers = expressAsyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
              $or: [
                  { name: { $regex: req.query.search, $options: "i" } },
                  { email: { $regex: req.query.search, $options: "i" } },
              ],
          }
        : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
});

module.exports = {
    registerUser,
    authUser,
    allUsers,
};
