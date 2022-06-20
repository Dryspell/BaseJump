import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";
// import { Route, Routes } from "react-router-dom";
import GameBox from "../Components/GameBox";
import SideDrawer from "../Components/Miscellaneous/SideDrawer";
import Pathfinding from "../Components/Game/Examples/Pathfinding/Pathfinding";
import PatternSwap from "../Components/Game/Examples/PatternSwap/PatternSwap";
import DragAndDrop from "../Components/Game/Examples/DragAndDrop/DragAndDrop";
import CustomGrid from "../Components/Game/Examples/CustomGrid/CustomGrid";
import { ChatState } from "../Context/ChatProvider";

const ExamplePage = () => {
    const { userInfo } = ChatState();
    const user = userInfo ? userInfo.data.user : null;

    return (
        <div style={{ width: "100%" }}>
            {user && <SideDrawer />}
            <Box
                display={{ base: "flex", md: "flex" }}
                alignItems="center"
                alignSelf="center"
                flexDir="column"
                bg="white"
                padding={3}
                w={{ base: "95%", md: "95%" }}
                borderRadius="lg"
                borderWidth="5px"
            >
                <Tabs>
                    <TabList>
                        <Tab>Pathfinding</Tab>
                        <Tab>Pattern Swap</Tab>
                        <Tab>Drag and Drop</Tab>
                        <Tab>Custom Grid</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <GameBox component={<Pathfinding />} />
                        </TabPanel>
                        <TabPanel>
                            <GameBox component={<PatternSwap />} />
                        </TabPanel>
                        <TabPanel>
                            <GameBox component={<DragAndDrop />} />
                        </TabPanel>
                        <TabPanel>
                            <GameBox component={<CustomGrid />} />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </div>
    );
};

export default ExamplePage;
