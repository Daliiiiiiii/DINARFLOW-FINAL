// Get blocked users
export const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .populate('blockedUsers', 'username email p2pProfile')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Transform the data to include nickname from p2pProfile
        const blockedUsers = user.blockedUsers.map(blockedUser => ({
            ...blockedUser,
            nickname: blockedUser.p2pProfile?.nickname || null
        }));

        res.json(blockedUsers);
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ message: 'Error fetching blocked users' });
    }
}; 