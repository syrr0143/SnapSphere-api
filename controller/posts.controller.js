import { Post } from '../model/posts.model.js'
import { User } from '../model/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'


const uploadPost = async (req, res) => {
    try {
        const userid = req.user._id;
        const user = await User.findById(userid);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const postLocalPath = req.files?.image[0]?.path;
        if (!postLocalPath) {
            return res.status(400).json({ message: " file is required from local path" });
        }

        const postupload = await uploadOnCloudinary(postLocalPath);
        if (!postupload) {
            return res.status(400).json({ message: " file is required to be uploaded successfully" });
        }

        const newPost = await Post.create({
            title: title,
            description: description,
            user: user._id,
            imageurl: postupload.url
        });
        const createdPost = await Post.findById(newPost._id);
        if (!createdPost) {
            return res.status(500).json({ message: `something went wrong` });
        }
        // Ensure user.posts is initialized before pushing the new post ID
        if (!user.posts) {
            user.posts = [];
        }
        // Update the user's posts array
        user.posts.push(newPost._id);
        await user.save();

        return res.status(200).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Internal server error, something went wrong", error: error.message });
    }
};

const getAllPost = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const allPosts = await Post.find();
        if (!allPosts) {
            return res.status(404).json({ message: "No posts found" });
        }
        return res.status(200).json({ message: "Posts fetched successfully", posts: allPosts });
    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}
const getpost = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const postid = req.params.postid;
        if (!postid) {
            return res.status(400).json({ message: "provide post id, post id is required" });
        }
        const post = await Post.findById(postid);
        if (!post) {
            return res.status(404).json({ message: "No posts found" });
        }
        return res.status(200).json({ message: "Posts fetched successfully", post: post });
    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}
const updatePost = async (req, res) => {
    try {
        const userid = req.user._id;
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const postId = req.params.postid;
        if (!postId) {
            return res.status(400).json({ message: "provide post id, post id is required" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "No posts found" });
        }
        const { title, description } = req.body;
        if (!title && !description) {
            return res.status(400).json({ message: "no details for fields are found" });
        }
        const filepath = req.files?.image[0]?.path;
        if (filepath) {
            const postFile = await uploadOnCloudinary(filepath);
            if (!postFile) {
                return res.status(400).json({ message: "file is required to be uploaded successfully" });
            }
            const updatedPost = await Post.findByIdAndUpdate(postId, { title: title, description: description, imageurl: postFile.url }, { new: true });
        }
        const updatedPost = await Post.findByIdAndUpdate(postId, { title: title, description: description }, { new: true });

        return res.status(200).json({ message: "post updated successfully", updatedPost: updatedPost });
    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message });
    }
}
const deletePost = async (req, res) => {
    try {
        const userid = req.user._id;
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const postId = req.params.postid;
        if (!postId) {
            return res.status(400).json({ message: "provide post id, post id is required" });
        }
        const postToDelete = await Post.findById(postId);
        if (!postToDelete) {
            return res.status(404).json({ message: "No posts found" });
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const deletePost = await Post.findByIdAndDelete(postId);
        return res.status(200).json({ message: "post deleted successfully", deletedPost: deletePost })

    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}

const likePost = async (req, res) => {
    try {
        const userid = req.user._id;
        const postId = req.params.postid;
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!postId) {
            return res.status(401).json({ message: "postid is required " });
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(401).json({ message: "no user found" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(401).json({ message: "no post found" });
        }
        if (post.likes.includes(userid)) {
            return res.status(400).json({ message: "User already liked this post" });
        }
        post.likes.push(userid);
        await post.save();
        return res.status(200).json({ message: "Post liked successfully", postlikes: post.likes });


    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}

const unLikePost = async (req, res) => {
    try {
        const userid = req.user._id;
        const postId = req.params.postid;
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!postId) {
            return res.status(401).json({ message: "postid is required " });
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(401).json({ message: "no user found" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(401).json({ message: "no post found" });
        }
        if (!(post.likes.includes(userid))) {
            return res.status(400).json({ message: "User already unliked this post" });
        }
        post.likes = post.likes.filter((id) => id.toString() !== userid.toString());
        await post.save();
        return res.status(200).json({ message: "Post unliked successfully", postlikes: post.likes });


    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}

const addComment = async (req, res) => {
    try {
        const userid = req.user._id;
        const postId = req.params.postid;
        const { comment } = req.body;
        if (!comment) {
            return res.status(400).json({ message: "comment is required" });
        }
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!postId) {
            return res.status(401).json({ message: "postid is required " });
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(401).json({ message: "no user found" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(401).json({ message: "no post found" });
        }
        if (post.comments.includes(userid)) {
            return res.status(400).json({ message: "User already liked this post" });
        }
        post.comments.push({ user: userid, comment });
        await post.save();
        return res.status(200).json({ message: "Post liked successfully", postCommneted: post });


    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}
const updateComment = async (req, res) => {
    try {

    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}
const deleteComment = async (req, res) => {
    try {
        const userid = req.user._id;
        const postId = req.params.postid;
        const commentId = req.params.commentId;
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!postId) {
            return res.status(401).json({ message: "postid is required " });
        }
        if (!commentId) {
            return res.status(400).json({ message: "commentId is required" });
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(401).json({ message: "no user found" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(401).json({ message: "no post found" });
        }
        if (!(post.comments.includes(userid))) {
            return res.status(400).json({ message: "User have not commented on this post" });
        }
        post.comments.filter({ user: userid, comment });
        await post.save();
        return res.status(200).json({ message: "Post liked successfully", postCommneted: post });

    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}

export { uploadPost, getAllPost, getpost, updatePost, deletePost, likePost, unLikePost };
