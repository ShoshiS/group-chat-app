import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface InvitationDocument extends Document {
  groupId: Types.ObjectId;
  groupName: string;
  invitee: string;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<InvitationDocument>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    groupName: { type: String, required: true, trim: true },
    invitee: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

invitationSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown> & { _id: unknown; __v: unknown };
    plain.id = plain._id;
    delete plain._id;
    delete plain.__v;
    return plain;
  },
});

export const Invitation = mongoose.model<InvitationDocument>('Invitation', invitationSchema);
