import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  post_id: Types.ObjectId;
  user_id: Types.ObjectId;
  text: string;
  parent_id?: Types.ObjectId;
  likes: Types.ObjectId[];
  created_at: Date;
}

const CommentSchema = new Schema<IComment>({
  post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  parent_id: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Comment = model<IComment>('Comment', CommentSchema);
