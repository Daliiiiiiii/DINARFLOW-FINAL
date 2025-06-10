// Get blocked users
export const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .populate({
                path: 'blockedUsers',
                select: 'p2pProfile',
                populate: {
                    path: 'p2pProfile',
                    select: 'nickname'
                }
            })
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Blocked users after population (raw):', JSON.stringify(user.blockedUsers, null, 2));

        // Transform the data to include nickname from p2pProfile
        const blockedUsers = user.blockedUsers.map(blockedUser => ({
            ...blockedUser,
            nickname: blockedUser.p2pProfile?.nickname || 'Unknown User'
        }));

        res.json(blockedUsers);
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        res.status(500).json({ message: 'Error fetching blocked users' });
    }
}; 