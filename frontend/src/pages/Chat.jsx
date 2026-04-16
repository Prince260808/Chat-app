import { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import { ChatContext } from "../context/ChatContext";

export default function Chat() {
  const { selectedChat } = useContext(ChatContext);

  return (
    <div className="h-screen flex overflow-hidden bg-[#0f0f13]">
      {/* Sidebar — always visible on desktop, hidden on mobile when chat is open */}
      <div className={`
        ${selectedChat ? "hidden md:flex" : "flex"}
        w-full md:w-80 lg:w-96 flex-col flex-shrink-0
      `}>
        <Sidebar />
      </div>

      {/* Chat area */}
      <div className={`
        ${selectedChat ? "flex" : "hidden md:flex"}
        flex-1 flex-col min-w-0
      `}>
        <ChatBox />
      </div>
    </div>
  );
}
