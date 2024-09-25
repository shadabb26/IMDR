const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// 1) AUTHENTICATION
exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      contact: req.body.contact,
      password: req.body.password,
      passwordConfirm: req.body.password,
      email: req.body.email,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: "fail",
      message: "Something went wrong",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exits

    if (!email || !password)
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password !",
      });

    // 2) Check if email and password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password)))
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });

    // 3) if Everything is good send token to client
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: "Something went wrong",
    });
  }
};

// 2) AUTHORIZATION
exports.protect = async (req, res, next) => {
  // 1) Getting token and checking if it's there
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.json({
        status: "fail",
        message: "Please login!",
      });
    }

    // 2) Verification of Token
    let decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    if (!decoded) {
      res.json({
        status: "fail",
        message: "Inavlid Token",
      });
    }

    // 3) Check User still exists

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      res.json({
        status: "fail",
        message: "User belonging to this token don't exists",
      });
    }

    // 4) Check if user has change password after token issued
    if (currentUser.passwordChangedAfter(decoded.iat)) {
      res.status(401).json({
        status: "fail",
        message: "User Recently changed password, Login Again",
      });
    }

    // 5) Access to protected Route
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "Something Went wrong !",
    });
  }
};
