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
        // Allow both +216XXXXXXXX and 216XXXXXXXX formats
        return /^(\+?216)?\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid Tunisian phone number!`
    }
  },
  role: {
    type: String,
    required: true,
    default: 'user',
    enum: ['user', 'admin', 'superadmin'],
    index: true
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  bankAccount: {
    bankName: { type: String },
    accountNumber: { type: String }
  },
  address: String,
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
    enum: ['active', 'pending_deletion', 'suspended'],
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
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  kyc: {
    status: {
      type: String,
      enum: ['verified', 'unverified', 'rejected', 'pending'],
      default: 'unverified'
    },
    submissions: [{
      submittedAt: Date,
      verifiedAt: Date,
      verificationNotes: String,
      personalInfo: {
        idType: String,
        idNumber: String,
        dateOfBirth: Date,
        firstName: String,
        lastName: String,
        address: String,
        city: String,
        province: String,
        zipCode: String
      },
      documents: {
        frontId: String,
        backId: String,
        selfieWithId: String,
        signature: String
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
    }],
    currentSubmission: {
      type: Number,
      default: -1
    }
  },
  associatedBankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    default: null
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
      // Use the API_URL from environment, fallback to localhost only in development
      const baseUrl = process.env.NODE_ENV === 'production'
        ? process.env.API_URL
        : (process.env.API_URL || 'http://localhost:3000');

      // Transform profile picture URL
      if (ret.profilePicture && !ret.profilePicture.startsWith('http')) {
        ret.profilePicture = `${baseUrl}${ret.profilePicture}`;
      }

      // Transform KYC document URLs for all submissions
      if (ret.kyc && Array.isArray(ret.kyc.submissions)) {
        ret.kyc.submissions.forEach(sub => {
          if (sub.documents) {
            Object.keys(sub.documents).forEach(key => {
              if (sub.documents[key] && !sub.documents[key].startsWith('http')) {
                sub.documents[key] = `${baseUrl}/uploads/${sub.documents[key]}`;
              }
            });
          }
        });
      }

      // Transform top-level document URLs
      if (ret.documents) {
        Object.keys(ret.documents).forEach(key => {
          if (ret.documents[key] && !ret.documents[key].startsWith('http')) {
            ret.documents[key] = `${baseUrl}/uploads/${ret.documents[key]}`;
          }
        });
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

// Add compound index for role and lastSeen
userSchema.index({ role: 1, lastSeen: -1 });

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