import { Box } from "@chakra-ui/react";
import React from "react";
import Game from "../Components/Game/Game";
import GameBox from "../Components/GameBox";
import SideDrawer from "../Components/Miscellaneous/SideDrawer";
import { ChatState } from "../Context/ChatProvider";

const GamePage = () => {
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
                {user && <GameBox component={<Game />} />}
            </Box>
        </div>
    );
};

export default GamePage;
