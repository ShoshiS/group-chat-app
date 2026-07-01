import { HydratedDocument, Model, Schema, Types, model } from 'mongoose';

export interface IGroupReadState {
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupReadStateModel extends Model<IGroupReadState> {
  upsertReadState(
    userId: Types.ObjectId | string,
    groupId: Types.ObjectId | string,
    lastReadAt: Date,
  ): Promise<HydratedDocument<IGroupReadState>>;
  findForUser(
    userId: Types.ObjectId | string,
    groupIds: Types.ObjectId[],
  ): Promise<HydratedDocument<IGroupReadState>[]>;
  deleteForUserInGroup(
    userId: Types.ObjectId | string,
    groupId: Types.ObjectId | string,
  ): Promise<void>;
}

const groupReadStateSchema = new Schema<IGroupReadState, GroupReadStateModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    lastReadAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['_id'];
        delete ret['__v'];
      },
    },
  },
);

groupReadStateSchema.index({ userId: 1, groupId: 1 }, { unique: true });

groupReadStateSchema.static(
  'upsertReadState',
  function (
    userId: Types.ObjectId | string,
    groupId: Types.ObjectId | string,
    lastReadAt: Date,
  ) {
    return this.findOneAndUpdate(
      { userId, groupId },
      { lastReadAt },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },
);

groupReadStateSchema.static(
  'findForUser',
  function (userId: Types.ObjectId | string, groupIds: Types.ObjectId[]) {
    if (groupIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.find({ userId, groupId: { $in: groupIds } }).exec();
  },
);

groupReadStateSchema.static(
  'deleteForUserInGroup',
  async function (userId: Types.ObjectId | string, groupId: Types.ObjectId | string) {
    await this.deleteOne({ userId, groupId }).exec();
  },
);

export const GroupReadState = model<IGroupReadState, GroupReadStateModel>(
  'GroupReadState',
  groupReadStateSchema,
);
