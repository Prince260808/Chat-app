import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authroutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ FRONTEND URL (LOCAL + PRODUCTION SAFE)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── MIDDLEWARE ────────────────────────────────────────────────
app.use(express.json());

// ✅ CORS FIX (IMPORTANT FOR DEPLOYMENT)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ─── SESSION ───────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set TRUE only if using HTTPS with proper cookies
      sameSite: "lax",
    },
  })
);

// ─── PASSPORT ──────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ─── SOCKET.IO SETUP ───────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
  pingTimeout: 60000,
});

// ─── SOCKET LOGIC ──────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // User setup
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  // Join chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined room:", room);
  });

  // Typing indicator
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  // New message event
  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) return;

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ─── DATABASE ──────────────────────────────────────────────────
connectDB();

// ─── START SERVER ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});