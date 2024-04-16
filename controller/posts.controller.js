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
        return res.status(500).json({ message: "Internal server error uploadPost, something went wrong", error: error.message });
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
        return res.status(500).json({ message: `internal server error from get all post, something went wrong`, error: error.message })
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
        return res.status(500).json({ message: `internal server error getpost, something went wrong`, error: error.message })
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
        return res.status(500).json({ message: `internal server error update post, something went wrong`, error: error.message });
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
        return res.status(500).json({ message: `internal server error deletePost, something went wrong`, error: error.message })
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
        return res.status(500).json({ message: `internal server error like post, something went wrong`, error: error.message })
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
        return res.status(500).json({ message: `internal server error unLikePost, something went wrong`, error: error.message })
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
        const hasCommented = post.comments.some(comment => comment.user.toString() === userid.toString());
        if (hasCommented) {
            return res.status(400).json({ message: "User already commented this post" });
        }
        post.comments.push({ user: userid, comment });
        await post.save();
        return res.status(200).json({ message: "Post commented successfully", postCommneted: post });


    } catch (error) {
        return res.status(500).json({ message: `internal server error add comment, something went wrong`, error: error.message })
    }
}

const getAllComment = async (req, res) => {
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

        const allComments = post.comments;
        if (!allComments) {
            return res.status(400).json({ message: "no comments found" })
        }
        return res.status(200).json({ message: "comments found", allComments: allComments })
    } catch (error) {
        return res.status(500).json({ message: "internal server error getAllComment ", error: error.message })
    }
}
const updateComment = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.postid;
        const commentId = req.params.commentid;
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: "text is required" });
        }

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!postId) {
            return res.status(400).json({ message: "postId is required" });
        }

        if (!commentId) {
            return res.status(400).json({ message: "commentId is required" });
        }

        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);

        if (commentIndex === -1 || post.comments[commentIndex].user.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to update this comment" });
        }

        post.comments[commentIndex].comment = text;
        await post.save();

        return res.status(200).json({ message: "Comment updated successfully", postComments: post.comments });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error updateComment", error: error.message });
    }
}

const deleteComment = async (req, res) => {
    try {
        const userid = req.user._id;
        const postId = req.params.postid;
        const commentId = req.params.commentid;
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

        const commentIndex = post.comments.findIndex((comment) => comment._id.toString() === commentId);
        if (commentIndex == -1 || post.comments[commentIndex].user.toString() !== userid) {
            return res.status(400).json({ message: "User have not commented on this post" });
        }
        // Filter out the comment from the array
        post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
        await post.save();
        return res.status(200).json({ message: "comment on this post deleted successfully", postCommneted: post });

    } catch (error) {
        return res.status(500).json({ message: `internal server error deleteComment, something went wrong`, error: error.message })
    }
}
const postToshow = async (req, res) => {
    try {
        const userid = req.user._id;
        if (!userid) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        const followedId = user.following;
        const post = await Post.find({ user: { $in: followedId } }).populate('user', 'name username avatar');
        return res.status(200).json({ message: "posts fetched successfully", post: post });
    } catch (error) {
        return res.status(500).json({ message: "server error , try again later", error: error.message })
    }
}
const searchByTitle = async (req, res) => {
    try {

        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({ message: "Search term is required" });
        }

        const posts = await Post.find({ title: { $regex: searchTerm, $options: 'i' } });
        return res.status(200).json({ message: "Posts found successfully", posts: posts });
    } catch (error) {

        return res.status(500).json({ message: "Internal server error post to show, something went wrong", error: error.message });
    }
};

const allsavedPost = async (req, res) => {
    try {
        const userid = req.user._id;
        if (!userid) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        const allSavedPostIds = user.savedPost; // Assuming user.savedPost contains IDs of saved posts
        const allSavedPosts = await Post.find({ _id: { $in: allSavedPostIds } });
        return res.status(200).json({ message: "posts fetched successfully", post: allSavedPosts });
    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}
const savePost = async (req, res) => {
    try {
        const userid = req.user._id;
        const postId = req.params.postid;
        if (!userid) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        if (user.savedPost.includes(postId)) {
            return res.status(400).json({ message: "Post already saved by the user" });
        }

        // Add the post ID to the savedPost array
        user.savedPost.push(postId);
        await user.save();
        return res.status(200).json({ message: "Post saved successfully", post: user });

    } catch (error) {
        return res.status(500).json({ message: `internal server error, something went wrong`, error: error.message })
    }
}
export { uploadPost, getAllPost, getpost, updatePost, deletePost, likePost, unLikePost, addComment, deleteComment, updateComment, getAllComment, postToshow, searchByTitle, savePost, allsavedPost };
