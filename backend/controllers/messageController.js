import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    return res.status(400).json({ message: "Content and chatId are required" });
  }
  try {
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
    });
    message = await message.populate("sender", "username pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username pic email",
    });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username pic email")
      .populate("chat");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};