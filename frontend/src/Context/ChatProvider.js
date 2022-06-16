import { useNavigate } from "react-router-dom";
import React from "react";

const { createContext, useContext, useState, useEffect } = require("react");

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState();
    const [selectedChat, setSelectedChat] = useState();
    const [chats, setChats] = useState([]);
    const [notification, setNotification] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUserInfo(userInfo);

        if (!userInfo) {
            navigate("/");
        }
    }, [navigate]);

    return (
        <ChatContext.Provider
            value={{
                userInfo,
                setUserInfo,
                selectedChat,
                setSelectedChat,
                chats,
                setChats,
                notification,
                setNotification,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const ChatState = () => {
    return useContext(ChatContext);
};

export default ChatProvider;
