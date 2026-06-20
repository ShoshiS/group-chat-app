import { HydratedDocument, Model, Schema, Types, model } from 'mongoose';

export type GroupEventType = 'member_removed';

export interface IGroupEvent {
  groupId: Types.ObjectId;
  type: GroupEventType;
  memberUsername: string;
}

interface GroupEventModel extends Model<IGroupEvent> {
  findForGroup(groupId: Types.ObjectId | string): Promise<HydratedDocument<IGroupEvent>[]>;
}

const groupEventSchema = new Schema<IGroupEvent, GroupEventModel>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    type: { type: String, enum: ['member_removed'], required: true },
    memberUsername: { type: String, required: true, trim: true },
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

groupEventSchema.index({ groupId: 1, createdAt: -1 });

groupEventSchema.static('findForGroup', function (groupId: Types.ObjectId | string) {
  return this.find({ groupId }).sort({ createdAt: 1 }).exec();
});

export const GroupEvent = model<IGroupEvent, GroupEventModel>('GroupEvent', groupEventSchema);
