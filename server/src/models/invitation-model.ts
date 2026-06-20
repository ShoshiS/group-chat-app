import Joi from 'joi';
import {
  HydratedDocument,
  Model,
  Schema,
  Types,
  model,
} from 'mongoose';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface IInvitation {
  groupId: Types.ObjectId;
  groupName: string;
  invitee: string;
  inviteeUsername: string;
  invitedBy: Types.ObjectId;
  status: InvitationStatus;
}

interface InvitationModel extends Model<IInvitation> {
  findPendingForEmail(email: string): Promise<HydratedDocument<IInvitation>[]>;
  findDuplicatePending(
    groupId: Types.ObjectId | string,
    invitee: string,
  ): Promise<HydratedDocument<IInvitation> | null>;
  findForGroup(groupId: Types.ObjectId | string): Promise<HydratedDocument<IInvitation>[]>;
}

const invitationSchema = new Schema<IInvitation, InvitationModel>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    groupName: { type: String, required: true, trim: true },
    invitee: { type: String, required: true, trim: true, lowercase: true },
    inviteeUsername: { type: String, required: true, trim: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
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
  },
);

invitationSchema.index(
  { groupId: 1, invitee: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);

invitationSchema.static('findPendingForEmail', function (email: string) {
  return this.find({ invitee: email.toLowerCase().trim(), status: 'pending' })
    .sort({ createdAt: -1 })
    .exec();
});

invitationSchema.static(
  'findDuplicatePending',
  function (groupId: Types.ObjectId | string, invitee: string) {
    return this.findOne({
      groupId,
      invitee: invitee.toLowerCase().trim(),
      status: 'pending',
    }).exec();
  },
);

invitationSchema.static(
  'findForGroup',
  function (groupId: Types.ObjectId | string) {
    return this.find({ groupId }).sort({ updatedAt: -1 }).exec();
  },
);

export const Invitation = model<IInvitation, InvitationModel>('Invitation', invitationSchema);

export const inviteBodySchema = Joi.object({
  email: Joi.string().email().required(),
}).options({ stripUnknown: true });
