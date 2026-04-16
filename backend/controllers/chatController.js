import Chat from "../models/Chat.js";
import User from "../models/User.js";

// ✅ 1. Access or Create One-to-One Chat
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send("UserId is required");
    }

    // Check if chat already exists
    let isChat = await Chat.find({
      groupChat: false,
      users: {
        $all: [req.user._id, userId],
      },
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name email",
    });

    if (isChat.length > 0) {
      return res.status(200).send(isChat[0]);
    }

    // Create new chat
    const chatData = {
      chatName: "sender",
      groupChat: false,
      users: [req.user._id, userId],
    };

    const createdChat = await Chat.create(chatData);

    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );

    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchChats = async (req, res) => {
    try {
      const chats = await Chat.find({
        users: { $elemMatch: { $eq: req.user._id } },
      })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 });
  
      const fullChats = await User.populate(chats, {
        path: "latestMessage.sender",
        select: "name email",
      });
  
      res.status(200).json(fullChats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const createGroupChat = async (req, res) => {
    try {
      let { users, name } = req.body;
  
      if (!users || !name) {
        return res.status(400).send("Please fill all fields");
      }
  
      users = JSON.parse(users);
  
      if (users.length < 2) {
        return res.status(400).send("At least 2 users required");
      }
  
      users.push(req.user);
  
      const groupChat = await Chat.create({
        chatName: name,
        users: users,
        groupChat: true,
        groupAdmin: req.user._id,
      });
  
      const fullGroupChat = await Chat.findById(groupChat._id)
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).json(fullGroupChat);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const renameGroup = async (req, res) => {
    const { chatId, chatName } = req.body;
  
    try {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { chatName },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).json(updatedChat);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;
  
    try {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { users: userId },
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).json(updatedChat);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;
  
    try {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { users: userId },
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).json(updatedChat);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
