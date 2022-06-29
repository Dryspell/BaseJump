const expressAsyncHandler = require("express-async-handler");

const getMarketData = (req, res) => {
    const marketData = {
        market: {
            name: "Market",
            description: "Market description",
        },
    };
    res.status(200).json({
        status: "success",
        data: {
            marketData,
        },
    });
};

module.exports = { getMarketData };
