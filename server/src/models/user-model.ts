import bcrypt from 'bcrypt';
import Joi from 'joi';
import { HydratedDocument, Model, Schema, model } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

interface UserModel extends Model<IUser, Record<string, never>, IUserMethods> {
  findByEmail(email: string): Promise<HydratedDocument<IUser, IUserMethods> | null>;
}

const SALT_ROUNDS = 10;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: { type: String, required: true, unique: true, minlength: 3, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, match: /^https?:\/\/.+/ },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        delete ret['password'];
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        delete ret['password'];
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.method('comparePassword', async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
});

userSchema.static('findByEmail', function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password').exec();
});

export const User = model<IUser, UserModel>('User', userSchema);

export const registerBodySchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
}).options({ stripUnknown: true });

export const loginBodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}).options({ stripUnknown: true });

export const updateProfileBodySchema = Joi.object({
  username: Joi.string().min(3).required(),
}).options({ stripUnknown: true });
