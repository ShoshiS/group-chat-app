import Joi from 'joi';
import { Document, Model, Schema, Types, model } from 'mongoose';

interface IAttachment {
  type: 'image' | 'audio' | 'pdf';
  url: string;
  originalName: string;
}

export interface IMessage {
  groupId: Types.ObjectId;
  senderId: Types.ObjectId;
  text?: string;
  attachments?: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

interface FindByGroupOptions {
  before?: Types.ObjectId | string;
  limit?: number;
}

interface MessageModel extends Model<IMessage> {
  findByGroup(
    groupId: Types.ObjectId | string,
    options?: FindByGroupOptions,
  ): Promise<(Document & IMessage)[]>;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ['image', 'audio', 'pdf'], required: true },
    url: { type: String, required: true },
    originalName: { type: String, required: true },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 2000 },
    attachments: {
      type: [attachmentSchema],
      validate: {
        validator: (v: IAttachment[]) => v.length <= 10,
        message: 'A message cannot have more than 10 attachments',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = (ret['_id'] as Types.ObjectId).toString();
        delete ret['_id'];
        delete ret['__v'];
      },
    },
  },
);

// Sorted descending so cursor queries (before: <id>) return the page efficiently
messageSchema.index({ groupId: 1, _id: -1 });

// Every message must carry either text or at least one attachment
messageSchema.pre('save', function (next) {
  const hasText = !!this.text?.trim();
  const hasAttachments = (this.attachments?.length ?? 0) > 0;
  if (!hasText && !hasAttachments) {
    next(new Error('Message must contain text or at least one attachment'));
    return;
  }
  next();
});

// Returns up to `limit` messages older than `before`, sorted oldest-first.
// Omit `before` to fetch the latest page.
messageSchema.static(
  'findByGroup',
  function (
    groupId: Types.ObjectId | string,
    { before, limit = 50 }: FindByGroupOptions = {},
  ) {
    const filter: Record<string, unknown> = { groupId };
    if (before) {
      filter['_id'] = { $lt: new Types.ObjectId(before.toString()) };
    }
    return this.find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('senderId', 'username avatar')
      .then((docs) => docs.reverse());
  },
);

export const Message = model<IMessage, MessageModel>('Message', messageSchema);

// Joi validator — used in controllers to validate request bodies
const validateMessage = Joi.object({
  text: Joi.string().max(2000).allow('').optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().valid('image', 'audio', 'pdf').required(),
        url: Joi.string().required(),
        originalName: Joi.string().required(),
      }),
    )
    .min(1)
    .max(10)
    .optional(),
}).or('text', 'attachments');

export default validateMessage;
