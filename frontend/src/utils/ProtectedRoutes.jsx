import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoutes({ children }) {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  if (!user && !token) return <Navigate to="/login" />;
  return children;
}