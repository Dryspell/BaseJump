import { ViewIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    FormControl,
    IconButton,
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

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [groupChatName, setGroupChatName] = useState();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [renameLoading, setRenameLoading] = useState(false);

    const toast = useToast();

    const { selectedChat, setSelectedChat, userInfo } = ChatState();

    const handleRemove = async (u) => {
        console.log(userInfo);
        if (
            selectedChat.groupAdmin._id !== userInfo.data.user._id &&
            u._id !== userInfo.data.user._id
        ) {
            toast({
                title: "Error Ocurred!",
                description: "You are not allowed to remove users",
                status: "error",
                duration: 5000,
            });
            return;
        }
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.patch(
                `/api/chat/groupremove`,
                {
                    chatId: selectedChat._id,
                    userId: u._id,
                },
                config
            );

            u._id === userInfo.data.user._id
                ? setSelectedChat()
                : setSelectedChat(data);
            setLoading(false);
            setFetchAgain(!fetchAgain);
            fetchMessages();
        } catch (error) {
            toast({
                title: "Error Ocurred!",
                description: "Failed to remove user",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    };

    const handleAddUser = async (u) => {
        if (selectedChat.users.find((user) => user._id === u._id)) {
            toast({
                title: "User Already in Group!",
                description: "User Already Added to this Group Chat",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        if (selectedChat.groupAdmin._id === userInfo.data.user._id) {
            setSelectedUsers([...selectedUsers, u]);
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.patch(
                `/api/chat/groupadd`,
                {
                    chatId: selectedChat._id,
                    userId: u._id,
                },
                config
            );

            setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            setLoading(false);
        } catch (error) {
            console.log(error);

            toast({
                title: "Error Ocurred!",
                description: "Failed to Add User to Group",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
        }
    };

    const handleRename = async (u) => {
        if (!groupChatName) {
            return;
        }
        try {
            setRenameLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.patch(
                `/api/chat/rename`,
                {
                    chatId: selectedChat._id,
                    chatName: groupChatName,
                },
                config
            );
            setRenameLoading(false);
            setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            // onClose();
        } catch (error) {
            toast({
                title: "Error Ocurred!",
                description: "Failed to Rename Group Chat",
                status: "error",
                duration: 5000,
            });
            setRenameLoading(false);
        }

        setGroupChatName("");
    };

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

    return (
        <>
            <IconButton
                display={{ base: "flex" }}
                icon={<ViewIcon />}
                onClick={onOpen}
            />

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        fontSize="35px"
                        fontFamily="Work sans"
                        display="flex"
                        justifyContent="center"
                    >
                        {selectedChat.chatName}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box display="flex" w={"100%"} flexWrap="wrap" pb={3}>
                            {selectedChat.users.map((u) => (
                                <UserBadgeItem
                                    key={u._id}
                                    user={u}
                                    handleFunction={() => handleRemove(u)}
                                />
                            ))}
                        </Box>
                        <FormControl display="flex">
                            <Input
                                placeholder="Chat Name"
                                mb={3}
                                onChange={(e) =>
                                    setGroupChatName(e.target.value)
                                }
                            />
                            <Button
                                variant="solid"
                                colorScheme="teal"
                                isLoading={renameLoading}
                                onClick={handleRename}
                                ml={1}
                            >
                                Update
                            </Button>
                        </FormControl>
                        <FormControl>
                            <Input
                                placeholder="Add Users eg. Peter, Paul, Mary"
                                mb={1}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </FormControl>
                        {loading ? (
                            <Spinner size="lg" />
                        ) : searchResult ? (
                            searchResult.map((u) => (
                                <UserListItem
                                    key={u._id}
                                    user={u}
                                    handleFunction={() => handleAddUser(u)}
                                />
                            ))
                        ) : null}
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            onClick={() => handleRemove(userInfo.data.user)}
                            colorScheme="red"
                        >
                            Leave Group
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default UpdateGroupChatModal;
