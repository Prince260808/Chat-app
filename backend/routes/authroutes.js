import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { loginUser, registerUser, getUsers } from "../controllers/userController.js";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/signup", upload.single("pic"), registerUser);
router.post("/login", loginUser)
router.get("/get-users", protect, getUsers)


// 🔹 Start Google Login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔹 Callback URL
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // create JWT
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // redirect to frontend
    res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
  }
);

export default router;