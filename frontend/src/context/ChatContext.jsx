import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api/axios";
import { io } from "socket.io-client";

export const ChatContext = createContext();

// ✅ USE ENV FOR DEPLOYMENT
const ENDPOINT = import.meta.env.VITE_API_URL;
let socket;

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const selectedChatRef = useRef(null);
  selectedChatRef.current = selectedChat;

  // ─────────────────────────────────────────────
  // SOCKET CONNECTION (PRODUCTION SAFE)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !ENDPOINT) return;

    socket = io(ENDPOINT, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.emit("setup", user);

    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("message received", (newMsg) => {
      const current = selectedChatRef.current;

      if (!current || current._id !== newMsg.chat._id) {
        setNotifications((prev) => [newMsg, ...prev]);
      } else {
        setMessages((prev) => [...prev, newMsg]);
      }

      setChats((prev) =>
        prev.map((c) =>
          c._id === newMsg.chat._id
            ? { ...c, latestMessage: newMsg }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
      socket = null;
    };
  }, []);

  // ─────────────────────────────────────────────
  // API FUNCTIONS
  // ─────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      const { data } = await api.get("/chat");
      setChats(data);
    } catch (err) {
      console.error("fetchChats:", err.message);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const { data } = await api.get("/message/" + chatId);
      setMessages(data);

      socket?.emit("join chat", chatId);
    } catch (err) {
      console.error("fetchMessages:", err.message);
    }
  }, []);

  const sendMessage = async (chatId, content) => {
    try {
      socket?.emit("stop typing", chatId);

      const { data } = await api.post("/message", {
        content,
        chatId,
      });

      socket?.emit("new message", data);

      setMessages((prev) => [...prev, data]);

      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId
            ? { ...c, latestMessage: data }
            : c
        )
      );

      return data;
    } catch (err) {
      console.error("sendMessage:", err.message);
    }
  };

  const accessChat = async (userId) => {
    try {
      const { data } = await api.post("/chat", { userId });

      setSelectedChat(data);

      setChats((prev) =>
        prev.find((c) => c._id === data._id)
          ? prev
          : [data, ...prev]
      );

      return data;
    } catch (err) {
      console.error("accessChat:", err.message);
    }
  };

  const createGroupChat = async (name, users) => {
    try {
      const { data } = await api.post("/chat/group", {
        name,
        users: JSON.stringify(users),
      });

      setChats((prev) => [data, ...prev]);

      return data;
    } catch (err) {
      console.error("createGroupChat:", err.message);
    }
  };

  const renameGroup = async (chatId, chatName) => {
    try {
      const { data } = await api.put("/chat/rename", {
        chatId,
        chatName,
      });

      setChats((prev) =>
        prev.map((c) =>
          c._id === data._id ? data : c
        )
      );

      if (selectedChat?._id === data._id) {
        setSelectedChat(data);
      }

      return data;
    } catch (err) {
      console.error("renameGroup:", err.message);
    }
  };

  const addToGroup = async (chatId, userId) => {
    try {
      const { data } = await api.put("/chat/groupadd", {
        chatId,
        userId,
      });

      setSelectedChat(data);
      return data;
    } catch (err) {
      console.error("addToGroup:", err.message);
    }
  };

  const removeFromGroup = async (chatId, userId) => {
    try {
      const { data } = await api.put("/chat/groupremove", {
        chatId,
        userId,
      });

      setSelectedChat(data);
      return data;
    } catch (err) {
      console.error("removeFromGroup:", err.message);
    }
  };

  const emitTyping = (chatId) =>
    socket?.emit("typing", chatId);

  const emitStopTyping = (chatId) =>
    socket?.emit("stop typing", chatId);

  // ─────────────────────────────────────────────
  // PROVIDER
  // ─────────────────────────────────────────────
  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        messages,
        setMessages,
        isTyping,
        socketConnected,
        notifications,
        setNotifications,
        fetchChats,
        fetchMessages,
        sendMessage,
        accessChat,
        createGroupChat,
        renameGroup,
        addToGroup,
        removeFromGroup,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};