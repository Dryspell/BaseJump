import { Box } from "@chakra-ui/react";
import React from "react";
// import App from "../Components/Comb/examples/drag-and-drop/src/App.js";
// import App from "../Components/Comb/examples/basic-board/src/App.js";
// import App from "../Components/Comb/examples/custom-grid/src/App.js";
// import App from "../Components/Comb/examples/animations/src/App.js";
// import App from "../Components/Comb/examples/pathfinding/src/App.js";
// import App from "../Components/Comb/examples/pattern-swap/src/App.js";

const GameBox = (props) => {
    return (
        <Box
            display={{ base: "flex", md: "flex" }}
            alignItems="center"
            flexDir="column"
            bg="white"
            p={3}
            w={{ base: "100%", md: "100%" }}
            borderRadius="lg"
            borderWidth="1px"
        >
            {props.component}
        </Box>
    );
};

export default GameBox;
