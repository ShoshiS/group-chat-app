import Joi from 'joi';
import { HydratedDocument, Model, Schema, Types, model } from 'mongoose';

export interface IGroup {
  name: string;
  description?: string;
  adminId: Types.ObjectId;
  members: Types.ObjectId[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupModel extends Model<IGroup> {
  findForUser(userId: Types.ObjectId | string): Promise<HydratedDocument<IGroup>[]>;
}

const groupSchema = new Schema<IGroup, GroupModel>(
  {
    name: { type: String, required: true, minlength: 2, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    // Populated from the JWT token in auth middleware — never read from req.body
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    avatar: { type: String, match: /^https?:\/\/.+/ },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
      },
    },
  },
);

groupSchema.index({ adminId: 1 });
groupSchema.index({ members: 1 });

// Ensure the creator is always a member of their own group
groupSchema.pre('save', function (next) {
  if (this.isNew && !this.members.some((m) => m.equals(this.adminId))) {
    this.members.push(this.adminId);
  }
  next();
});

groupSchema.static(
  'findForUser',
  function (userId: Types.ObjectId | string) {
    return this.find({ members: userId }).exec();
  },
);

export const Group = model<IGroup, GroupModel>('Group', groupSchema);

// Joi validator — used in controllers to validate request bodies.
// stripUnknown removes any field not listed here (e.g. adminId, members injected from client).
const validateGroup = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().max(500).allow('').optional(),
  avatar: Joi.string().uri().optional(),
}).options({ stripUnknown: true });

export default validateGroup;
