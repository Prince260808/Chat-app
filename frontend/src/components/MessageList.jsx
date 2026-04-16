import { useContext, useEffect, useRef } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

function Avatar({ src, name, size = "sm" }) {
  const s = "w-7 h-7 text-xs";
  if (src) return <img src={src} alt={name} className={`${s} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageList() {
  const { messages, isTyping, selectedChat } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const isSentByMe = (msg) => msg.sender?._id === user?._id || msg.sender === user?._id;

  const shouldShowAvatar = (messages, idx) => {
    if (idx === messages.length - 1) return true;
    return messages[idx + 1]?.sender?._id !== messages[idx]?.sender?._id;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-1">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 fade-in">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">No messages yet. Say hello! 👋</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const sent = isSentByMe(msg);
        const showAvatar = !sent && shouldShowAvatar(messages, idx);
        const showName = selectedChat?.groupChat && !sent && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id);

        return (
          <div key={msg._id} className={`flex items-end gap-2 msg-enter ${sent ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar placeholder to maintain alignment */}
            <div className="w-7 flex-shrink-0">
              {!sent && showAvatar && (
                <Avatar src={msg.sender?.pic} name={msg.sender?.username} />
              )}
            </div>

            <div className={`flex flex-col ${sent ? "items-end" : "items-start"} max-w-[70%]`}>
              {showName && (
                <span className="text-indigo-400 text-xs font-medium mb-1 ml-1">
                  {msg.sender?.username}
                </span>
              )}
              <div className={`px-4 py-2.5 ${sent ? "msg-bubble-sent" : "msg-bubble-recv"}`}>
                <p className="text-white text-sm leading-relaxed break-words">{msg.content}</p>
              </div>
              <span className="text-zinc-600 text-[10px] mt-1 mx-1">
                {formatTime(msg.createdAt)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-end gap-2 msg-enter">
          <div className="w-7 flex-shrink-0" />
          <div className="msg-bubble-recv px-4 py-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400 dot1" />
            <span className="w-2 h-2 rounded-full bg-zinc-400 dot2" />
            <span className="w-2 h-2 rounded-full bg-zinc-400 dot3" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}