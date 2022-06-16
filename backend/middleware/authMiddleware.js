const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const expressAsyncHandler = require("express-async-handler");

const protect = expressAsyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");

            next();
        } catch (error) {
            res.status(401).json({
                status: "error",
                message:
                    "You are not authorized to access this resource, token is invalid",
            });
            throw new Error(
                "You are not authorized to access this resource, token is invalid"
            );
        }
    }
    if (!token) {
        res.status(401).json({
            status: "error",
            message:
                "You are not authorized to access this resource, no token provided",
        });
        throw new Error(
            "You are not authorized to access this resource, no token provided"
        );
    }
});

module.exports = { protect };
