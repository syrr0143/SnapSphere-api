import express from 'express'
import { verifyJwt } from '../middleware/auth.middleware.js'
const router = express.Router();
import { upload } from '../middleware/multer.middleware.js';
import { userSignup, login, logout, getCurrentUser, updateUserProfile, forgotpassword, resetPassword, resetpasswordui, followUser, followers, getAllUsers, unfollowUser, searchUsers, deleteAccount } from '../controller/user.controller.js'
router.route("/")
    .post(upload.fields([{ name: "avatar", maxCount: 1 }]), userSignup)
    .get(verifyJwt, getCurrentUser)
    .patch(verifyJwt, upload.fields([{ name: "avatar", maxCount: 1 }]), updateUserProfile)
router.route('/allUsers')
    .get(verifyJwt, getAllUsers)
router.route('/search')
    .get(verifyJwt, searchUsers)
router.route('/login')
    .post(login)

router.route('/logout')
    .post(verifyJwt, logout)

router.route('/forgot-password')
    .post(forgotpassword)

router.route('/reset-password/:id/:token')
    .get(resetpasswordui) // Render the password reset form
    .post(resetPassword)

router.route('/follow/:userId')
    .get(verifyJwt, followers)
    .post(verifyJwt, followUser)
router.route('/unfollow/:userId')
    .post(verifyJwt, unfollowUser)
router.route('/delete')
    .delete(verifyJwt, deleteAccount)

export default router 