const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

// 1) AUTHENTICATION
exports.signup = catchAsync(async (req, res, next) => {
  const checkUser = await User.findOne({ email: req.body.email });

  if (checkUser) {
    return next(new AppError("User already exist!", 409));
  }

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
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exits
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if email and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  // 3) if Everything is good send token to client
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    status: "success",
    token,
  });
});

// 2) AUTHORIZATION
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and checking if it's there

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new AppError("Please login!", 401));

  // 2) Verification of Token
  let decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  if (!decoded) return next(new AppError("Invalid Token!", 401));

  // 3) Check User still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(new AppError("User belonging to this token don't exists", 401));

  // 4) Check if user has change password after token issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError("User Recently changed password, Login Again", 401)
    );
  }

  // 5) Access to protected Route
  req.user = currentUser;
  next();
});
