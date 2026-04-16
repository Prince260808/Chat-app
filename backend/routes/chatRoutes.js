import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from "../controllers/chatController.js";

import  {protect}  from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Create or access one-to-one chat
router.post("/", protect, accessChat);

// 🔹 Get all chats of logged-in user
router.get("/", protect, fetchChats);

// 🔹 Create group chat
router.post("/group", protect, createGroupChat);

// 🔹 Rename group
router.put("/rename", protect, renameGroup);

// 🔹 Add user to group
router.put("/groupadd", protect, addToGroup);

// 🔹 Remove user from group
router.put("/groupremove", protect, removeFromGroup);

export default router;