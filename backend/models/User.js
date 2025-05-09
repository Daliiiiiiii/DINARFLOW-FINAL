import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import process from 'process';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: { unique: true }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: { unique: true },
    validate: {
      validator: function (v) {
        return /^\+216\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid Tunisian phone number!`
    }
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  cryptoBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  address: String,
  kycVerified: {
    type: Boolean,
    default: false
  },
  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  kycData: {
    idType: String,
    idNumber: String,
    dateOfBirth: Date,
    idFrontUrl: String,
    idBackUrl: String,
    selfieUrl: String
  },
  privacyAccepted: {
    type: Boolean,
    default: false
  },
  privacyAcceptedAt: Date,
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  accountStatus: {
    type: String,
    enum: ['active', 'pending_deletion'],
    default: 'active'
  },
  deletionRequestedAt: Date,
  // Email verification fields
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationToken: String,
  verificationTokenExpires: Date,
  // Password reset fields
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  lastPasswordChange: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  socialAuth: {
    type: Map,
    of: String
  },
  profilePicture: {
    type: String,
    default: null
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  kyc: {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    submittedAt: Date,
    verifiedAt: Date,
    verificationNotes: String,
    documents: {
      frontId: String,
      backId: String,
      selfieWithId: String
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    auditTrail: [{
      action: {
        type: String,
        required: true
      },
      details: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      if (ret.profilePicture && !ret.profilePicture.startsWith('http')) {
        const baseUrl = process.env.API_URL || 'http://localhost:3000';
        ret.profilePicture = `${baseUrl}${ret.profilePicture}`;
      }
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ 'socialAuth.google': 1 });
userSchema.index({ 'socialAuth.facebook': 1 });
userSchema.index({ 'socialAuth.twitter': 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
  }
  await this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;