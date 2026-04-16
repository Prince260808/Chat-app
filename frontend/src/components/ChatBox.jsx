import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

function Avatar({ src, name, size = "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";
  if (src) return <img src={src} alt={name} className={`${s} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function ChatBox() {
  const { selectedChat, fetchMessages, setSelectedChat, renameGroup, removeFromGroup } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [showInfo, setShowInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      setShowInfo(false);
    }
  }, [selectedChat?._id]);

  if (!selectedChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0f0f13] gap-4 fade-in">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-zinc-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Select a conversation</p>
          <p className="text-zinc-500 text-sm mt-1">Choose a chat from the sidebar or search for users</p>
        </div>
      </div>
    );
  }

  const chatName = selectedChat.groupChat
    ? selectedChat.chatName
    : selectedChat.users?.find(u => u._id !== user?._id)?.username || "Chat";
  const chatPic = selectedChat.groupChat
    ? null
    : selectedChat.users?.find(u => u._id !== user?._id)?.pic;
  const memberCount = selectedChat.users?.length;

  const handleRename = async () => {
    if (!editName.trim()) return;
    await renameGroup(selectedChat._id, editName.trim());
    setEditingName(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f13]">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#13131a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="md:hidden mr-1 text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          {selectedChat.groupChat ? (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {chatName[0]?.toUpperCase()}
            </div>
          ) : (
            <Avatar src={chatPic} name={chatName} />
          )}
          <div>
            <p className="text-white font-semibold text-sm">{chatName}</p>
            <p className="text-zinc-500 text-xs">
              {selectedChat.groupChat ? `${memberCount} members` : "Online"}
            </p>
          </div>
        </div>
        {selectedChat.groupChat && (
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01"/>
            </svg>
          </button>
        )}
      </div>

      {/* Group Info Panel */}
      {showInfo && selectedChat.groupChat && (
        <div className="mx-4 mt-3 glass rounded-2xl p-4 flex-shrink-0 fade-in">
          <h3 className="text-white text-sm font-semibold mb-3">Group Info</h3>
          {editingName ? (
            <div className="flex gap-2 mb-3">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Group name"
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
              />
              <button onClick={handleRename} className="px-3 py-2 rounded-xl bg-indigo-500 text-white text-xs">Save</button>
              <button onClick={() => setEditingName(false)} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-zinc-300 text-sm flex-1">{selectedChat.chatName}</span>
              {selectedChat.groupAdmin?._id === user?._id && (
                <button onClick={() => { setEditName(selectedChat.chatName); setEditingName(true); }}
                  className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
              )}
            </div>
          )}
          <div className="space-y-1">
            {selectedChat.users?.map(u => (
              <div key={u._id} className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <Avatar src={u.pic} name={u.username} size="sm" />
                  <span className="text-white text-xs">{u.username}</span>
                  {selectedChat.groupAdmin?._id === u._id && (
                    <span className="text-indigo-400 text-[10px] bg-indigo-500/15 px-1.5 py-0.5 rounded-md">Admin</span>
                  )}
                </div>
                {selectedChat.groupAdmin?._id === user?._id && u._id !== user?._id && (
                  <button
                    onClick={() => removeFromGroup(selectedChat._id, u._id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {selectedChat.groupAdmin?._id !== user?._id && (
            <button
              onClick={() => removeFromGroup(selectedChat._id, user?._id).then(() => setSelectedChat(null))}
              className="mt-3 w-full py-2 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 text-xs transition-all"
            >
              Leave group
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <MessageInput />
    </div>
  );
}