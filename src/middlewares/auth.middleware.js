import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
export const isAuthenticated = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        res.redirect("/")
      }
      
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken?.userId).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json(new ApiError(401, "user not found"));
    }
    // console.log(user);

    req.user = user;
    console.log("object");
    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, "Unauthorized request"));
  }
};
