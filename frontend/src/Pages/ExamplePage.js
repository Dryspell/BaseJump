import { Box } from "@chakra-ui/react";
import React from "react";
// import { Route, Routes } from "react-router-dom";
import GameBox from "../Components/GameBox";
import SideDrawer from "../Components/Miscellaneous/SideDrawer";
import Pathfinding from "../Components/Game/Examples/Pathfinding/Pathfinding";
import { ChatState } from "../Context/ChatProvider";

const ExamplePage = () => {
    const { userInfo } = ChatState();
    const user = userInfo ? userInfo.data.user : null;

    return (
        <div style={{ width: "100%" }}>
            {user && <SideDrawer />}
            <Box
                display="flex"
                justifyContent="space-between"
                w="100%"
                h="91.5vh"
                p="10px"
            >
                <GameBox component={<Pathfinding />} />
            </Box>
        </div>
    );
};

export default ExamplePage;
