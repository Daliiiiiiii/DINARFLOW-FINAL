import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import process from 'process';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dinarflow';
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function migrateUsers() {
    console.log('Starting user migration...');

    try {
        // Fetch users from Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        // Transform and insert users into MongoDB
        for (const user of users) {
            const newUser = {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                walletBalance: user.wallet_balance || 0,
                phoneNumber: user.phone_number,
                displayName: user.display_name,
                kyc: {
                    status: user.kyc_status || 'unverified',
                    personalInfo: user.kyc_data || {},
                    documents: {},
                    data: {},
                    auditTrail: [{
                        action: 'migrated',
                        timestamp: new Date()
                    }]
                },
                privacyAccepted: user.privacy_accepted || false,
                privacyAcceptedAt: user.privacy_accepted_at ? new Date(user.privacy_accepted_at) : null,
                notificationsEnabled: user.notifications_enabled ?? true,
                twoFactorEnabled: user.two_factor_enabled || false,
                lastLogin: user.last_login ? new Date(user.last_login) : new Date(),
                accountStatus: user.account_status || 'active',
                deletionRequestedAt: user.deletion_requested_at ? new Date(user.deletion_requested_at) : null,
                emailVerified: user.email_confirmed || false,
                metadata: user.metadata || {}
            };

            await User.create(newUser);
            console.log(`Migrated user: ${user.email}`);
        }

        console.log('User migration completed successfully');
    } catch (error) {
        console.error('Error during user migration:', error);
        throw error;
    }
}

async function migrateTransactions() {
    console.log('Starting transaction migration...');

    try {
        // Fetch transactions from Supabase
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*');

        if (error) throw error;

        // Transform and insert transactions into MongoDB
        for (const transaction of transactions) {
            const mongoTransaction = {
                userId: transaction.user_id,
                type: transaction.type,
                subtype: transaction.subtype,
                amount: transaction.amount,
                currency: transaction.currency,
                recipientId: transaction.recipient_id,
                recipientEmail: transaction.recipient_email,
                recipientName: transaction.recipient_name,
                senderId: transaction.sender_id,
                senderEmail: transaction.sender_email,
                senderName: transaction.sender_name,
                description: transaction.description,
                status: transaction.status || 'completed',
                reference: transaction.reference,
                metadata: transaction.metadata || {},
                error: transaction.error || {},
                processedAt: transaction.processed_at ? new Date(transaction.processed_at) : null,
                confirmedAt: transaction.confirmed_at ? new Date(transaction.confirmed_at) : null,
                cancelledAt: transaction.cancelled_at ? new Date(transaction.cancelled_at) : null,
                cancellationReason: transaction.cancellation_reason,
                tags: transaction.tags || [],
                attachments: transaction.attachments || []
            };

            await Transaction.create(mongoTransaction);
            console.log(`Migrated transaction: ${transaction.reference}`);
        }

        console.log('Transaction migration completed successfully');
    } catch (error) {
        console.error('Error during transaction migration:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('Starting migration process...');

        // Run migrations in sequence
        await migrateUsers();
        await migrateTransactions();

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main(); 