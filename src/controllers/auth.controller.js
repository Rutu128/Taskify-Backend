import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json(new ApiError(400, "All fields must be filled"));
    }
    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new User({
        email,
        password: hashedPassword,
      });
      user = await newUser.save();
    }
    const isAuthenticated = await bcrypt.compare(password, user.password);
    if (!isAuthenticated) {
      return res.status(401).json(new ApiResponse(401, "Invalid credentials"));
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 604800000,
    };
    res.cookie("token", token, options);
    delete user.password;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { token: token, user: { _id: user._id, email: user.email } },
          "login successfull"
        )
      );
  } catch (err) {
    console.log(err.message);
    res.status(500).json(new ApiResponse(500, "Server Error", err));
  }
};

const logout = (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("token", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
};

const ping = (req, res) => {
  try {
    return res.status(200).json(new ApiResponse(200, "ok"));
  } catch (err) {
    console.log(err.message);
    return res.status(500).json(new ApiResponse(500, "Server Error", err));
  }
};

export { login, logout,ping };
