import { Avatar, Tooltip } from "@chakra-ui/react";
import React from "react";
import ScrollableFeed from "react-scrollable-feed";
import {
    isLastMessage,
    isSameSender,
    isSameSenderMargin,
    isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const ScrollableChat = ({ messages }) => {
    const { userInfo } = ChatState();

    return (
        <ScrollableFeed>
            {messages &&
                messages.map((message, index) => (
                    <div key={message._id} style={{ display: "flex" }}>
                        {(isSameSender(
                            messages,
                            message,
                            index,
                            userInfo.data.user._id
                        ) ||
                            isLastMessage(
                                messages,
                                index,
                                userInfo.data.user._id
                            )) && (
                            <Tooltip
                                label={message.sender.name}
                                placement="bottom-start"
                                hasArrow
                            >
                                <Avatar
                                    mt="7px"
                                    mr={1}
                                    size="sm"
                                    cursor="pointer"
                                    name={message.sender.name}
                                    src={message.sender.pic}
                                />
                            </Tooltip>
                        )}
                        <span
                            style={{
                                backgroundColor: `${
                                    message.sender._id ===
                                    userInfo.data.user._id
                                        ? "#BEE3F8"
                                        : "#B9F5D0"
                                }`,
                                borderRadius: "20px",
                                padding: "5px 15px",
                                maxWidth: "75%",
                                marginLeft: isSameSenderMargin(
                                    messages,
                                    message,
                                    index,
                                    userInfo.data.user._id
                                ),
                                marginTop: isSameUser(
                                    messages,
                                    message,
                                    index,
                                    userInfo.data.user._id
                                )
                                    ? 3
                                    : 10,
                            }}
                        >
                            {message.message}
                        </span>
                    </div>
                ))}
        </ScrollableFeed>
    );
};

export default ScrollableChat;
