import express, { Router } from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js'
import { uploadPost, getAllPost, getpost, updatePost, deletePost, likePost, unLikePost } from '../controller/posts.controller.js';
const router = express.Router();

router.route('/')
    .post(verifyJwt, upload.fields([{ name: "image", maxCount: 1 }]), uploadPost)
    .get(verifyJwt, getAllPost)
router.route('/:postid')
    .get(verifyJwt, getpost)
    .patch(verifyJwt, upload.fields([{ name: "image", maxCount: 1 }]), updatePost)
    .delete(verifyJwt, deletePost)
router.route('/like/:postid')
    .post(verifyJwt, likePost)
router.route('/unlike/:postid')
    .post(verifyJwt, unLikePost)

export default router;