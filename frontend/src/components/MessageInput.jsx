import { useState, useContext, useRef } from "react";
import { ChatContext } from "../context/ChatContext";

export default function MessageInput() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { selectedChat, sendMessage, emitTyping, emitStopTyping } = useContext(ChatContext);
  const typingTimeout = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!selectedChat) return;
    emitTyping(selectedChat._id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitStopTyping(selectedChat._id);
    }, 1500);
  };

  const send = async () => {
    if (!text.trim() || !selectedChat || sending) return;
    setSending(true);
    clearTimeout(typingTimeout.current);
    emitStopTyping(selectedChat._id);
    await sendMessage(selectedChat._id, text.trim());
    setText("");
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="px-4 py-4 border-t border-white/5 bg-[#13131a]">
      <div className="flex items-end gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 focus-within:border-indigo-500/40 transition-all">
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none leading-relaxed max-h-32 overflow-y-auto scrollbar-hide"
          style={{ height: "auto" }}
          onInput={e => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            text.trim() && !sending
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25"
              : "bg-white/5 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={text.trim() ? "text-white" : "text-zinc-600"}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
            </svg>
          )}
        </button>
      </div>
      <p className="text-zinc-700 text-[10px] text-center mt-2">Shift+Enter for new line</p>
    </div>
  );
}