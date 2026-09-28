const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/miniproject")
  .catch((error) => console.error("MongoDB connection failed:", error.message));

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  profilepic: {
    type: String,
    default: "default.png",
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
