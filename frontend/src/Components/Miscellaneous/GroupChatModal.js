import {
    Box,
    Button,
    FormControl,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import UserListItem from "../UserAvatar/UserListItem";

const GroupChatModal = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [groupChatName, setGroupChatName] = useState();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);

    const toast = useToast();

    const { userInfo, chats, setChats } = ChatState();

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) {
            return;
        }
        try {
            setLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.get(
                `/api/user?search=${search}`,
                config
            );
            // console.log(data);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            toast({
                title: "Error Ocurred!",
                description: "Failed to Load Search Results",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    };
    const handleGroup = (userToAdd) => {
        if (selectedUsers.includes(userToAdd)) {
            toast({
                title: "User Already Added",
                description: "User Already Added",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }
        setSelectedUsers([...selectedUsers, userToAdd]);
    };

    const handleSubmit = async () => {
        if (!groupChatName || !selectedUsers) {
            toast({
                title: "Please enter a group name and select users",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                "/api/chat/group",
                {
                    chatName: groupChatName,
                    users: JSON.stringify(selectedUsers.map((u) => u._id)),
                },
                config
            );

            setChats([data, ...chats]);
            onClose();
            toast({
                title: "New Group Chat Created Successfully",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "Failed to Create Group Chat",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    };

    const handleDelete = (userToDelete) => {
        setSelectedUsers(
            selectedUsers.filter((user) => user._id !== userToDelete._id)
        );
    };

    return (
        <>
            <span onClick={onOpen}>{children}</span>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        fontSize={"35px"}
                        fontFamily={"Work sans"}
                        display={"flex"}
                        justifyContent={"center"}
                    >
                        Create Group Chat
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody
                        display={"flex"}
                        flexDir={"column"}
                        alignItems={"center"}
                    >
                        <FormControl>
                            <Input
                                placeholder="Chat Name"
                                mb={3}
                                onChange={(e) =>
                                    setGroupChatName(e.target.value)
                                }
                            />
                        </FormControl>
                        <FormControl>
                            <Input
                                placeholder="Add Users eg. Peter, Paul, Mary"
                                mb={1}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </FormControl>
                        <Box w="100%" display={"flex"} flexWrap={"wrap"}>
                            {selectedUsers.map((u) => (
                                // console.log(u),
                                <UserBadgeItem
                                    key={u._id}
                                    user={u}
                                    handleFunction={() => handleDelete(u)}
                                />
                            ))}
                        </Box>

                        {loading ? (
                            <div>
                                loading
                                <Spinner pl={3} ml="auto" display="flex" />
                            </div>
                        ) : searchResult ? (
                            searchResult.slice(0, 4).map((user) => (
                                <UserListItem
                                    key={user._id}
                                    user={user}
                                    handleFunction={() => {
                                        handleGroup(user);
                                    }}
                                />
                            ))
                        ) : null}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" onClick={handleSubmit}>
                            Create Chat
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default GroupChatModal;
