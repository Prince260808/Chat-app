import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: false, // ⚠️ important for OAuth
    },

    pic: {
      type: String,
      default:
        "https://cdn-icons-png.flaticon.com/128/3177/3177440.png",
    },

    // ✅ NEW FIELD (important)
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);