import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api/axios";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      // fetch user info with the token
      api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => {
          login({ ...data, token });
          navigate("/chat");
        })
        .catch(() => {
          // fallback — just store token and go
          login({ token });
          navigate("/chat");
        });
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <p className="text-zinc-400 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}