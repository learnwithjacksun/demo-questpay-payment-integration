import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

userSchema.statics.creditBalance = async function (userId, amount) {
  const user = await this.findByIdAndUpdate(
    userId,
    { $inc: { balance: amount } },
    { new: true },
  );
  return user;
};

const UserModel = model("User", userSchema);

export default UserModel;
