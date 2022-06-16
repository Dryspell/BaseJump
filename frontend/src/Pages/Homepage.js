import {
    Box,
    Container,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../Components/Authentication/Login";
import Register from "../Components/Authentication/Register";

const Homepage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("userInfo"));

        if (user) {
            navigate("/chats");
        }
    }, [navigate]);

    return (
        <Container maxW="xl" centerContent>
            <Box
                display="flex"
                justifyContent="center"
                p={3}
                bg={"white"}
                w="100%"
                m="40px 0 15px 0"
                borderRadius="lg"
                borderWidth="1px"
            >
                <Text fontSize="4xl" fontFamily={"work sans"} color="black">
                    Welcome to the chat app!
                </Text>
            </Box>
            <Box
                p={4}
                bg={"white"}
                w="100%"
                borderRadius="lg"
                borderWidth="1px"
            >
                <Tabs variant="soft-rounded" colorScheme="blue">
                    <TabList>
                        <Tab width="50%">Login</Tab>
                        <Tab width="50%">Register</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <Login />
                        </TabPanel>
                        <TabPanel>
                            <Register />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Container>
    );
};

export default Homepage;
