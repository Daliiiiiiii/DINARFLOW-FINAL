import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import process from 'process';
import fileStorage from '../services/fileStorage.js';

dotenv.config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing test user if exists
        await User.deleteOne({ email: 'test@example.com' });

        // Create new test user
        const user = new User({
            email: 'test@example.com',
            password: 'Test123!@#',
            displayName: 'Test User',
            phoneNumber: '+21612345678',
            emailVerified: true
        });

        await user.save();
        console.log('Test user created successfully:', {
            email: user.email,
            displayName: user.displayName
        });

        // For profile pictures
        await fileStorage.storeFile(file, metadata, 'profile');

        // For KYC documents
        await fileStorage.storeFile(file, metadata, 'kyc');

        // For general images
        await fileStorage.storeFile(file, metadata, 'general');

    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createTestUser(); 