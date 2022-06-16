const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const minionRoutes = require("./routes/minionRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.get("/ping", (req, res) => {
    res.status(200).send("pong");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/minions", minionRoutes);

// --------------------------------------------------
// ---------------  Deployment  ---------------
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "/frontend/build")));

    app.get("*", (req, res) => {
        res.sendFile(
            path.resolve(__dirname1, "frontend", "build", "index.html")
        );
    });
} else {
    app.get("/", (req, res) => {
        res.send("API is Running Successfully");
    });
}

// --------------------------------------------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(`Server started on port ${PORT}`.yellow.bold)
);

const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
        origin:
            process.env.NODE_ENV === "production"
                ? `http://localhost:${PORT}`
                : `http://localhost:3000`,
    },
});

io.on("connection", (socket) => {
    console.log(
        `Server received a socket.io connection at ${new Date()}`.brightMagenta
    );

    socket.on("setup", (userData) => {
        console.log(`User ${userData.name} is setting up socket`);
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log("User joined room: ", chatId);
    });

    socket.on("typing", (chatId) => {
        socket.in(chatId).emit("typing", chatId);
    });

    socket.on("stop typing", (chatId) => {
        socket.in(chatId).emit("stop typing", chatId);
    });

    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;
        if (!chat.users) {
            return console.log("chat.users not defined".red);
        }

        console.log(chat);
        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;
            console.log(
                `${newMessageReceived.sender.name} sending new message "${newMessageReceived.message}" to User: ${user.name} in Room: ${newMessageReceived.chat._id}`
            );
            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});
