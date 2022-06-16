import {
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setemail] = useState();
    const [password, setPassword] = useState();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleShowPass = () => {
        setShowPass(!showPass);
    };

    const handleSubmit = async () => {
        setLoading(true);
        if (!email || !password) {
            setLoading(false);
            toast({
                title: "Please Fill all the Fields",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                },
            };
            const { data } = await axios.post(
                "/api/user/login",
                {
                    email,
                    password,
                },
                config
            );
            toast({
                title: "Login Successful",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });

            localStorage.setItem("userInfo", JSON.stringify(data));
            setLoading(false);
            navigate("/chats");
        } catch (error) {
            setLoading(false);
            toast({
                title: "Invalid Credentials",
                status: "error",
                description: error.response.data.message,
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    };

    return (
        <VStack spacing="5px">
            <FormControl>
                <FormLabel>email</FormLabel>
                <Input
                    placeholder="Enter your email"
                    value={email || ""}
                    onChange={(e) => setemail(e.target.value)}
                />
            </FormControl>
            <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                    <Input
                        type={showPass ? "text" : "password"}
                        placeholder="Enter your password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password || ""}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleShowPass}>
                            {showPass ? "Hide" : "Show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>
            <Button
                colorScheme="blue"
                width="100%"
                color="white"
                onClick={handleSubmit}
                style={{ marginTop: 15 }}
                isLoading={loading}
            >
                Login
            </Button>
            <Button
                colorScheme="red"
                width="100%"
                color="white"
                onClick={() => {
                    setemail("Guest");
                    setPassword("12guest34");
                    handleSubmit();
                }}
                style={{ marginTop: 15 }}
            >
                Chat as a Guest
            </Button>
        </VStack>
    );
};

export default Login;
