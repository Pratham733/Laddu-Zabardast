import { Schema, model, models } from 'mongoose';

const addressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  picture: {
    type: String,
  },
  addresses: [addressSchema],
  wishlist: {
    type: Array,
    default: [],
  },
}, { timestamps: true });

const User = models.User || model('User', userSchema);

export default User;
