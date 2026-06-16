import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface GroupDocument extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupModel extends Model<GroupDocument> {
  findByName(name: string): Promise<GroupDocument | null>;
}

const groupSchema = new Schema<GroupDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 1 },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

groupSchema.pre('save', function trimName() {
  if (typeof this.name === 'string') {
    this.name = this.name.trim();
  }
});

groupSchema.statics.findByName = function findByName(name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return this.findOne({ name: { $regex: new RegExp(`^${escaped}$`, 'i') } });
};

groupSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown> & { _id: unknown; __v: unknown };
    plain.id = plain._id;
    delete plain._id;
    delete plain.__v;
    return plain;
  },
});

export const Group = mongoose.model<GroupDocument, GroupModel>('Group', groupSchema);
