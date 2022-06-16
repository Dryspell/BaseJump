import { ArrowBackIcon } from "@chakra-ui/icons";
import {
    Box,
    FormControl,
    IconButton,
    Input,
    Spinner,
    Text,
    useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./Miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./Miscellaneous/UpdateGroupChatModal";
import axios from "axios";
import "./styles.css";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
// const path = require("path");
// console.log(path.resolve());

const ENDPOINT =
    process.env.NODE_ENV === "production"
        ? "https://hay-boi.herokuapp.com/"
        : "http://localhost:5000/";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const {
        userInfo,
        selectedChat,
        setSelectedChat,
        notification,
        setNotification,
    } = ChatState();
    const user = userInfo ? userInfo.data.user : null;

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState();
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const toast = useToast();

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", userInfo.data.user);
        socket.on("connected", () => {
            setSocketConnected(true);
        });
        fetchMessages(true);
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedChatCompare && selectedChatCompare !== selectedChat) {
            socket.emit("join chat", selectedChat._id);
        } else {
            selectedChatCompare = selectedChat;
        }
        fetchMessages(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat]);

    useEffect(() => {
        socket.on("message received", (newMessageReceived) => {
            if (
                !selectedChatCompare ||
                selectedChatCompare._id !== newMessageReceived.chat._id
            ) {
                if (!notification.includes(newMessageReceived)) {
                    setNotification([newMessageReceived, ...notification]);
                    setFetchAgain(!fetchAgain);
                    console.log(
                        `New Message Received in other chat from User: ${newMessageReceived.sender._id}`
                    );
                }
            } else {
                console.log(
                    `${newMessageReceived.createdAt}: ${newMessageReceived.sender.name} has sent message: ${newMessageReceived.message}`
                );
                setMessages([...messages, newMessageReceived]);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendMessage = async (e) => {
        if (e.key === "Enter" && newMessage) {
            setTyping(false);
            socket.emit("stop typing", selectedChat._id);
            try {
                setLoading(true);
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await axios.post(
                    "/api/message",
                    {
                        chatId: selectedChat._id,
                        message: newMessage,
                    },
                    config
                );
                console.log(`Message Sent: ${data.message}`);
                socket.emit("new message", data);
                setMessages([...messages, data]);
                setNewMessage("");
                setFetchAgain(!fetchAgain);
                fetchMessages(false);
                setLoading(false);

                socket.emit("join chat", selectedChat._id);
            } catch (error) {
                toast({
                    title: "Error Ocurred!",
                    description: "Failed to send Message",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom",
                });
            }
            setLoading(false);
        }
    };

    const fetchMessages = async (backgroundLoad = false) => {
        if (!selectedChat) return;
        console.log("Fetching Messages");
        try {
            if (!backgroundLoad) setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.get(
                `/api/message/${selectedChat._id}`,
                config
            );
            console.log(data);
            setMessages(data);
            setLoading(false);

            socket.emit("join chat", selectedChat._id);
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "Failed to Load Messages",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    };

    useEffect(
        async () => {
            fetchMessages(true);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fetchAgain]
    );

    const typingHandler = async (e) => {
        setNewMessage(e.target.value);

        if (!socketConnected) return;
        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength) {
                setTyping(false);
                socket.emit("stop typing", selectedChat._id);
            }
        }, timerLength);
    };

    return (
        <>
            {selectedChat ? (
                <>
                    <Text
                        fontSize={{ base: "28px", md: "30px" }}
                        pb={3}
                        px={2}
                        fontFamily="Work sans"
                        display="flex"
                        w="100%"
                        justifyContent={{ base: "space-between" }}
                        alignItems="center"
                    >
                        <IconButton
                            display={{ base: "flex", md: "none" }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat("")}
                        />
                        {messages &&
                            (!selectedChat.isGroupChat ? (
                                <>
                                    {getSender(user, selectedChat.users)}
                                    <ProfileModal
                                        user={getSenderFull(
                                            user,
                                            selectedChat.users
                                        )}
                                    />
                                </>
                            ) : (
                                <>
                                    {selectedChat.chatName.toUpperCase()}
                                    <UpdateGroupChatModal
                                        fetchMessages={fetchMessages}
                                        fetchAgain={fetchAgain}
                                        setFetchAgain={setFetchAgain}
                                    />
                                </>
                            ))}
                    </Text>
                    <Box
                        display="flex"
                        flexDir="column"
                        justifyContent={"flex-end"}
                        p={3}
                        w="100%"
                        h="100%"
                        bg="#E8E8E8"
                        borderRadius="lg"
                        overflowY="hidden"
                    >
                        {loading ? (
                            <Spinner
                                size="xl"
                                w={20}
                                h={20}
                                alignSelf="center"
                                margin="auto"
                            />
                        ) : (
                            <div className="messages">
                                <ScrollableChat messages={messages} />
                            </div>
                        )}
                        <FormControl
                            onKeyDown={(e) =>
                                e.key === "Enter" ? sendMessage(e) : null
                            }
                            isRequired
                            mt={3}
                        >
                            {isTyping ? (
                                <div>
                                    <Lottie
                                        options={defaultOptions}
                                        style={{
                                            marginBottom: 15,
                                            marginLeft: 0,
                                        }}
                                        width={70}
                                    />
                                </div>
                            ) : (
                                <></>
                            )}
                            <Input
                                placeholder="Type a message..."
                                onChange={(e) => typingHandler(e)}
                                variant="filled"
                                bg="#E0E0E0"
                            />
                        </FormControl>
                    </Box>
                </>
            ) : (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    h="100%"
                >
                    <Text fontSize={"3xl"} pb={3} fontFamily="Work sans">
                        Click on a User to Start a Chat
                    </Text>
                </Box>
            )}
        </>
    );
};

export default SingleChat;
