import express, { Router } from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js'
import { uploadPost, getAllPost, getpost, updatePost, deletePost, likePost, addComment, deleteComment, updateComment, getAllComment, postToshow, searchByTitle, allsavedPost, savePost } from '../controller/posts.controller.js';
const router = express.Router();

router.route('/')
    .post(verifyJwt, upload.fields([{ name: "image", maxCount: 1 }]), uploadPost)
    .get(verifyJwt, getAllPost)
router.route('/like/:postid')
    .post(verifyJwt, likePost)

router.route('/comment/:postid')
    .post(verifyJwt, addComment)
    .get(verifyJwt, getAllComment)
router.route('/comment/:postid/:commentid')
    .patch(verifyJwt, updateComment)
    .delete(verifyJwt, deleteComment)
router.route('/following')
    .get(verifyJwt, postToshow)
router.route('/search')
    .get(verifyJwt, searchByTitle)
router.route('/savePost/:postid')
    .post(verifyJwt, savePost)
router.route('/savedPost')
    .get(verifyJwt, allsavedPost)
router.route('/actions/:postid')
    .get(verifyJwt, getpost)
    .patch(verifyJwt, upload.fields([{ name: "image", maxCount: 1 }]), updatePost)
    .delete(verifyJwt, deletePost)
export default router;