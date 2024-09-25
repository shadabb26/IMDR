const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A user must have a name"],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ""));
        },
      },
    },

    contact: {
      type: Number,
      required: [true, "A user must have a contact"],
    },
    password: {
      type: String,
      required: [true, "A user must have a password"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "A user must confirm the password"],
      // This will only work with CREATE and SAVE
      validate: {
        validator: function (pass) {
          return pass === this.password;
        },
        message: "Passwords are not equal",
      },
    },
    email: {
      type: String,
      required: [true, "A user must have an email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    passwordChangedAt: Date,
  },

  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // 1) Only run this function if password is modified
  if (!this.isModified("password")) return next();

  // 2) Hash password with salt 12
  this.password = await bcrypt.hash(this.password, 12);

  // 3) Delete the confirm password field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changeTimeStamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
