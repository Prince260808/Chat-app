import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { api } from "../api/axios";
import { io } from "socket.io-client";

export const ChatContext = createContext();

const ENDPOINT = import.meta.env.VITE_API_URL;

export const ChatProvider = ({ children }) => {
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // keep ref updated
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // ─────────────────────────────────────────────
  // SOCKET SETUP (PRODUCTION READY)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !ENDPOINT) return;

    socketRef.current = io(ENDPOINT, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // ✅ IMPORTANT FIX: send only user._id
    socketRef.current.emit("setup", user._id);

    socketRef.current.on("connected", () => {
      setSocketConnected(true);
      console.log("✅ Socket connected");
    });

    socketRef.current.on("typing", () => setIsTyping(true));
    socketRef.current.on("stop typing", () => setIsTyping(false));

    socketRef.current.on("message received", (newMsg) => {
      const current = selectedChatRef.current;

      // If message not for current chat → notification
      if (!current || current._id !== newMsg.chat._id) {
        setNotifications((prev) => [newMsg, ...prev]);
      } else {
        setMessages((prev) => [...prev, newMsg]);
      }

      // update latest message in chat list
      setChats((prev) =>
        prev.map((c) =>
          c._id === newMsg.chat._id
            ? { ...c, latestMessage: newMsg }
            : c
        )
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("❌ Socket disconnected");
      }
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

      // join socket room
      socketRef.current?.emit("join chat", chatId);
    } catch (err) {
      console.error("fetchMessages:", err.message);
    }
  }, []);

  const sendMessage = async (chatId, content) => {
    try {
      socketRef.current?.emit("stop typing", chatId);

      const { data } = await api.post("/message", {
        content,
        chatId,
      });

      // emit real-time
      socketRef.current?.emit("new message", data);

      // update UI instantly
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
        prev.map((c) => (c._id === data._id ? data : c))
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

  // ─────────────────────────────────────────────
  // SOCKET HELPERS
  // ─────────────────────────────────────────────
  const emitTyping = (chatId) => {
    socketRef.current?.emit("typing", chatId);
  };

  const emitStopTyping = (chatId) => {
    socketRef.current?.emit("stop typing", chatId);
  };

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