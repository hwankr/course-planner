/**
 * Login Throttle Model
 * @api-separable
 * @migration-notes Move with services/models when the API is separated.
 */

import mongoose, { type HydratedDocument, Model, Schema } from 'mongoose';

export interface ILoginThrottle {
  _id: string;
  failures: number;
  windowStartedAt: Date;
  expiresAt: Date;
}

export type ILoginThrottleDocument = HydratedDocument<ILoginThrottle>;

const loginThrottleSchema = new Schema<ILoginThrottle>(
  {
    _id: { type: String, required: true },
    failures: { type: Number, required: true, default: 0 },
    windowStartedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'login_throttles' }
);

loginThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LoginThrottle: Model<ILoginThrottle> =
  mongoose.models.LoginThrottle ||
  mongoose.model<ILoginThrottle>('LoginThrottle', loginThrottleSchema);

export default LoginThrottle;
