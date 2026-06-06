import { Schema, model, Document, Types } from 'mongoose';

export interface ISharedExpense extends Document {
  trip_id: Types.ObjectId;
  payer_id: Types.ObjectId;
  amount: number;
  description: string;
  participants: Array<{
    user_id: Types.ObjectId;
    share: number;
  }>;
  settled: boolean;
  created_at: Date;
}

const SharedExpenseSchema = new Schema<ISharedExpense>({
  trip_id: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  payer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  participants: [{
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    share: { type: Number, required: true }
  }],
  settled: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const SharedExpense = model<ISharedExpense>('SharedExpense', SharedExpenseSchema);
