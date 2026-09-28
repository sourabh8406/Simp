const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const upload = require("./config/multerconfig");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/profile/upload", function (req, res) {
  res.render("profileupload");
});

app.post(
  "/upload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    if (!user || !req.file) return res.redirect("/profile/upload");
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("/profile");
  },
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/profile", isLoggedIn, async function (req, res) {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.get("/like/:id", isLoggedIn, async function (req, res) {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();

  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async function (req, res) {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");

  res.render("edit", { post });
});

app.post("/update/:id", isLoggedIn, async function (req, res) {
  await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content },
  );

  res.redirect("/profile");
});

app.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");

  res.render("profile", { user });
});

app.post("/register", async function (req, res) {
  let { email, password, username, name, age } = req.body;

  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User aldreay registered");

  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      let user = await userModel.create({
        username,
        email,
        age,
        name,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "shhhhh");
      res.cookie("token", token);
      res.send("registered");
    });
  });
});

app.post("/login", async function (req, res) {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("User not found");

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhhh");
      res.cookie("token", token);
      res.status(200).send("Login successful");
    } else res.status(500).send("Invalid password");
  });
});

app.get("/logout", async function (req, res) {
  res.clearCookie("token");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const data = jwt.verify(token, "shhhhh");
    req.user = data;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
}

app.listen(3000, function () {
  console.log("Server is learning");
});
