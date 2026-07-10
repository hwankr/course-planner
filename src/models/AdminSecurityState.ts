/**
 * Admin Security State Model
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 models/AdminSecurityState.ts로 이동
 */

import mongoose, { type HydratedDocument, Model, Schema } from 'mongoose';

export interface IAdminSecurityState {
  _id: string;
  revision: number;
}

export type IAdminSecurityStateDocument = HydratedDocument<IAdminSecurityState>;

const adminSecurityStateSchema = new Schema<IAdminSecurityState>(
  {
    _id: { type: String, required: true },
    revision: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, collection: 'admin_security_state' }
);

const AdminSecurityState: Model<IAdminSecurityState> =
  mongoose.models.AdminSecurityState ||
  mongoose.model<IAdminSecurityState>('AdminSecurityState', adminSecurityStateSchema);

export default AdminSecurityState;
