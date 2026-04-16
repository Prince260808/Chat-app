import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OauthSuccess from "./pages/OauthSuccess"
import Chat from "./pages/Chat";
import ProtectedRoutes from "./utils/ProtectedRoutes";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth-success" element={<OauthSuccess />} />
      <Route path="/chat" element={<ProtectedRoutes><Chat /></ProtectedRoutes>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}