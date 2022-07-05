const mongoose = require("mongoose");

// Generate schema for game worlds
const worldSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Generate model for game worlds
const World = mongoose.model("World", worldSchema);

// Export model for game worlds
module.exports = { World };
