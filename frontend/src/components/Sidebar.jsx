import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/axios";

function Avatar({ src, name, size = "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (src) return <img src={src} alt={name} className={`${s} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Sidebar() {
  const { chats, fetchChats, selectedChat, setSelectedChat, fetchMessages, notifications, setNotifications, accessChat } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupUsers, setGroupUsers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const { createGroupChat } = useContext(ChatContext);

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const { data } = await api.get("/auth/get-users?search=" + search);
        setSearchResults(data.filter(u => u._id !== user?._id));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
    setNotifications(prev => prev.filter(n => n.chat._id !== chat._id));
  };

  const startChat = async (userId) => {
    const chat = await accessChat(userId);
    if (chat) {
      openChat(chat);
      setSearch("");
      setSearchResults([]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || groupUsers.length < 2) return;
    const chat = await createGroupChat(groupName, groupUsers.map(u => u._id));
    if (chat) {
      openChat(chat);
      setShowNewGroup(false);
      setGroupName("");
      setGroupUsers([]);
    }
  };

  const getChatName = (chat) => {
    if (chat.groupChat) return chat.chatName;
    return chat.users?.find(u => u._id !== user?._id)?.username || "Chat";
  };

  const getChatPic = (chat) => {
    if (chat.groupChat) return null;
    return chat.users?.find(u => u._id !== user?._id)?.pic;
  };

  const hasNotif = (chatId) => notifications.some(n => n.chat?._id === chatId);

  return (
    <div className="flex flex-col h-full bg-[#13131a] border-r border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Chatter</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewGroup(true)}
              title="New group"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="relative"
            >
              <Avatar src={user?.pic} name={user?.username} size="sm" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full bg-white/5 border border-white/8 text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Profile dropdown */}
      {showProfile && (
        <div className="mx-4 mt-2 glass rounded-2xl p-4 fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={user?.pic} name={user?.username} />
            <div>
              <p className="text-white text-sm font-semibold">{user?.username}</p>
              <p className="text-zinc-500 text-xs">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
        </div>
      )}

      {/* New Group modal */}
      {showNewGroup && (
        <div className="mx-4 mt-2 glass rounded-2xl p-4 fade-in">
          <h3 className="text-white text-sm font-semibold mb-3">New Group Chat</h3>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-500 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-indigo-500/50"
          />
          <input
            placeholder="Search users to add…"
            onChange={async (e) => {
              if (!e.target.value.trim()) return;
              try {
                const { data } = await api.get("/auth/get-users?search=" + e.target.value);
                setSearchResults(data.filter(u => u._id !== user?._id && !groupUsers.find(gu => gu._id === u._id)));
              } catch {}
            }}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-500 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-indigo-500/50"
          />
          {groupUsers.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {groupUsers.map(u => (
                <span key={u._id} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 rounded-lg px-2 py-0.5 text-xs">
                  {u.username}
                  <button onClick={() => setGroupUsers(prev => prev.filter(x => x._id !== u._id))}>×</button>
                </span>
              ))}
            </div>
          )}
          {searchResults.slice(0, 4).map(u => (
            <div key={u._id} onClick={() => { setGroupUsers(prev => [...prev, u]); setSearchResults([]); }}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
              <Avatar src={u.pic} name={u.username} size="sm" />
              <span className="text-white text-xs">{u.username}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setShowNewGroup(false); setGroupUsers([]); setGroupName(""); }}
              className="flex-1 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button onClick={handleCreateGroup}
              disabled={!groupName.trim() || groupUsers.length < 2}
              className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && !showNewGroup && (
        <div className="mx-4 mt-2 glass rounded-2xl overflow-hidden fade-in">
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">People</p>
          </div>
          {searchResults.map(u => (
            <div key={u._id} onClick={() => startChat(u._id)}
              className="flex items-center gap-3 px-3 py-3 hover:bg-white/5 cursor-pointer transition-all">
              <Avatar src={u.pic} name={u.username} size="sm" />
              <div>
                <p className="text-white text-sm font-medium">{u.username}</p>
                <p className="text-zinc-500 text-xs">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="text-zinc-400 text-sm font-medium">No conversations yet</p>
            <p className="text-zinc-600 text-xs">Search for users above to start chatting</p>
          </div>
        ) : (
          chats.map(chat => {
            const name = getChatName(chat);
            const pic = getChatPic(chat);
            const isSelected = selectedChat?._id === chat._id;
            const notif = hasNotif(chat._id);

            return (
              <div key={chat._id} onClick={() => openChat(chat)}
                className={`flex items-center gap-3 mx-2 px-3 py-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected ? "bg-indigo-500/15 border border-indigo-500/20" : "hover:bg-white/5"
                }`}>
                <div className="relative">
                  {chat.groupChat ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {name[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <Avatar src={pic} name={name} />
                  )}
                  {notif && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#13131a]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-300" : "text-white"}`}>
                      {name}
                    </p>
                    <span className="text-zinc-600 text-xs flex-shrink-0 ml-2">
                      {formatTime(chat.latestMessage?.createdAt)}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs truncate mt-0.5">
                    {chat.latestMessage?.content || (chat.groupChat ? "Group chat" : "Start chatting")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}