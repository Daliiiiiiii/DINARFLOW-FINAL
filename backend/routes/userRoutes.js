router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/blocked', authenticate, userController.getBlockedUsers); 