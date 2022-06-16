const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    // console.log(`Generating token for user: ${id}`);
    try {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
    } catch (error) {
        console.log(`Error generating token: ${error}`);
    }
};

module.exports = { generateToken };
