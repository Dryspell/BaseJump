const mongoose = require("mongoose");
const color = require("colors");

const connectDB = async () => {
    const connectionURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.MONGO_URI}`;
    // console.log(`Connecting to ${connectionURI}`.yellow.bold);
    console.log(`Connecting to ${process.env.MONGO_URI}`.yellow.bold);
    try {
        const connection = await mongoose.connect(connectionURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(
            `MongoDB Connected to ${connection.connection.host}`.cyan.underline
                .bold
        );
    } catch (err) {
        console.error(`Mongo Connection Error: ${err.message}`.red.bold);
        process.exit();
    }
};

module.exports = connectDB;
