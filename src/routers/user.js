const express = require("express");
const bcryptjs = require("bcryptjs");
const multer = require("multer");
const sharp = require("sharp");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = new express.Router();

//creating users
router.post("/users", async (req, res) => {
  //   return console.log(req.body);

  try {
    const user = new User(req.body);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "hows the work buddy!",
      text: `you received this email because you are my friend ${user.name}`,
    };

    await user.save();

    transporter
      .sendMail(mailOptions)
      .then(() => {
        console.log("email send");
      })
      .catch((e) => {
        console.log(e);
      });

    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//loging in
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//logout user

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

//loging out all

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});
//getting the user
router.get("/users/me", auth, async (req, res) => {
  const user = req.user;
  res.send(user);
  //    try {
  // const user = await User.find({})
  // res.status(200).send(user)
  //    }catch(e) {
  // res.status(400).send(e)
  //    }
});

//geting user by id
// router.get("/users/:id",async (req,res) => {

//     const _id = req.params.id

//     try{
// const user = await User.findById(_id)
// if(!user) {
//     res.status(404).send()
// }
// res.status(200).send(user)
//     }catch(e) {
// res.status(400).send(e)
//     }

// })

//updating resource by id
router.patch("/users/me", auth, async (req, res) => {
  // const _id = req.params.id
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

//deleting user
router.delete("/users/me", auth, async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: req.user.email,
      subject: "account cancellation",
      text: `we are sad because u cancelled our services ${req.user.name}`,
    };

    req.user.remove();
    transporter
      .sendMail(mailOptions)
      .then(() => {
        console.log("cancellation mail");
      })
      .catch((e) => {
        console.log(e);
      });

    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

//uploading user avatar
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    //match for regex
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("upload pictures only"));
    }
    cb(undefined, true);
  },
});
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  //for handeling error message the (err,req,res,next) format must be same
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//delete the avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//get users avatar
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("content-type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

//send mails to user

module.exports = router;
