import express from 'express';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
const app = express();
import { User } from '../model/user.model.js';
import { Post } from '../model/posts.model.js';

const generateAccessToken = async (_id) => {
    try {
        const user = await User.findById(_id);
        if (!user) {
            throw new Error('User not found');
        }

        const accessToken = await user.generateAccessToken(_id);
        console.log('access token', accessToken);
        await user.save({ validateBeforeSave: false });
        return accessToken;
    } catch (error) {
        console.error('Error generating access token:', error);
        return res.status(500).json({ message: 'Error generating access token' });
    }
}

async function resetToken(user) {
    try {
        const secret = proces.env.ACCESS_TOKEN_SECRET + user.password;
        const payload = {
            email: user.email,
            _id: user._id
        };
        const options = {
            expiresIn: '15m'
        };
        const resetToken = jwt.sign(payload, secret, options);
        return resetToken;
    } catch (error) {
        return res.status(500).json({ message: `internal server error resetToken, something went wrong`, error: error.message })
    }
}

const userSignup = async (req, res) => {
    try {
        const { name, email, username, password, confirmpassword, roles } = req.body;
        if ([name, email, username, password, confirmpassword].some((field) => field?.trim() === "")) {
            return res.status(400).json({ message: "no details enetered for name,email,username, passowrd or consfirm password" })
        };
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(409).json({ message: "User with the same email already exists" });
        }
        const avatarLocalPath = req.files?.avatar[0]?.path;
        if (!avatarLocalPath) {
            return res.status(400).json({ message: "avatar file is required from local path" });
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            return res.status(400).json({ message: "avatar file is required to be uploaded successfully" });
        }

        const newUser = await User.create({ name, email, username, password, confirmpassword, avatar: avatar.url });
        const createdUser = await User.findById(newUser._id).select("-password -refreshToken");
        if (!createdUser) {
            return res.status(500).json({ message: `something went wrong` });
        }
        // sendEmail('signup', newUser);

        res.status(201)
            .json({ message: `user signup successful`, user: createdUser });


    } catch (error) {
        return res.status(500).json({ message: `internal server error userSignup, something went wrong`, error: error.message })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password is required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        const passwordMatch = await user.isPasswordCorrect(password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "unauthorized access, wrong password entered" });
        }
        const token = await generateAccessToken(user._id);
        console.log(token)
        const userlogging = await User.findById(user._id).select("-password ");
        const options = {
            httpOnly: true,
            secure: true
        }
        return res.status(200)
            .cookie("token", token, options)
            .json({ message: "password matched , login successful", user: userlogging, token: token })
    } catch (error) {
        return res.status(500).json({ message: `internal server error login, something went wrong`, error: error.message })
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie('accesstoken');
        res.status(200).json({ message: 'logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: `internal server error login, something went wrong`, error: error.message })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const allUsers = await User.find();
        if (!allUsers) {
            return res.status(404).json({ message: "no user found" })
        }
        return res.status(200).json({ message: "users fetched successfully", users: allUsers });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: `internal server error getAllUsers, something went wrong`, error: error.message })
    }
}
const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        console.log(user)
        if (!user) {
            return res.status(400).json({ message: "user not logged in " })
        }
        const userLoggedIn = await User.findById(user._id).select("-password -refreshToken");
        if (!userLoggedIn) {
            return res.status(404).json({ message: "user not found" });
        }
        return res.status(200).json({ message: "user details fetched successfully", user: userLoggedIn });
    } catch (error) {
        return res.status(500).json({ message: `internal server error getCurrentUser, something went wrong`, error: error.message })
    }
}

const updateUserProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const { name, bio } = req.body;
        if (!name && !bio) {
            return res.status(400).json({ message: "no details entered" })
        }
        const avatarLocalPath = req.files?.avatar[0]?.path;
        if (avatarLocalPath) {
            const avatar = await uploadOnCloudinary(avatarLocalPath);
            if (!avatar) {
                return res.status(400).json({ message: "avatar file is required to be uploaded successfully" });
            }
            const updatedUser = await User.findByIdAndUpdate(user._id, { name: name, bio: bio, avatar: avatar.url }, { new: true }).select("-password -refreshToken");
        }
        const updatedUser = await User.findByIdAndUpdate(user._id, { name: name, bio: bio }, { new: true }).select("-password -refreshToken");


        return res.status(200).json({ message: "updated the user details", userUpdated: updatedUser });
    } catch (error) {
        return res.status(500).json({ message: "server error occured", error: error.message })
    }
}


const forgotpassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "email is required" })
        }
        const userfound = await User.findOne({ email: email });
        if (!userfound) {
            return res.status(404).json({ message: "user not found" })
        }
        const resetToken = await resetToken(userfound);
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 15);
        await User.findByIdAndUpdate(userfound._id, { resetPasswordToken: resetToken, resetTokenExpires: expiryTime }, { new: true });

        const link = `${req.protocol}://${req.hostname}:4000/api/v1/user/reset-password/${userfound._id}/${resetToken}`;

        let data = {
            email: userfound.email,
            link: link,
            name: userfound.name
        }
        sendEmail('resetPassword', data);

        return res.status(200).json({ message: "password reset link sent successfully, expiry is 15 min", passwordResetLink: link })
    } catch (error) {
        return res.status(500).json({ message: "server error ", error: error.message })
    }
}

const resetpasswordui = async (req, res) => {
    try {
        // Render the password reset form
        res.send(`
        <h1>Password Reset</h1>
        <form action="api/v1/user/reset-password/${req.params.id}/${req.params.token}" method="POST">
            <label for="password">New Password:</label><br>
            <input type="password" id="password" name="password" required><br><br>
            <label for="confirmPassword">Confirm Password:</label><br>
            <input type="password" id="confirmPassword" name="confirmPassword" required><br><br>
            <input type="submit" value="Reset Password">
        </form>
        `);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error resetpasswordui', error: error.message });
    }
}


const resetPassword = async (req, res) => {
    try {
        const { id, token } = req.params;
        if (!token) {
            return res.status(401).json({ message: 'unauthorised , no token found ' })
        }
        const { password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "passwords do not match" });
        }
        const user = await User.findOne({ resetPasswordToken: token });
        if (!user) {
            return res.status(404).json({ message: "password reset token is invalid" });
        }
        user.password = password;
        // Invalidate existing sessions or tokens
        user.sessions = []; // Assuming sessions are stored in an array
        // Update the password reset token
        user.resetPasswordToken = null;
        await user.save();
        return res.status(200).json({ message: "password reset successful, please login now" });
    } catch (error) {
        return res.status(500).json({ message: 'internal server error occured resetPassword ', error: error.message })
    }
}
const followUser = async (req, res) => {
    try {
        const userfollowingid = req.user._id;
        if (!userfollowingid) {
            return res.status(400).json({ message: "user is not logged in " });
        }
        const userfollowing = await User.findById(userfollowingid);
        if (!userfollowing) {
            return res.status(404).json({ message: "logged in user not found " });
        }
        const userIdToFollow = req.params.userId;

        const userToFollow = await User.findById(userIdToFollow);
        if (!userToFollow) {
            return res.status(404).json({ message: "User to be followed was not found" });
        }

        // Check if the user is already following the user to follow
        if (userfollowing.following.includes(userIdToFollow)) {
            return res.status(400).json({ message: "User is already being followed" });
        }

        userfollowing.following.push(userIdToFollow);
        userToFollow.followers.push(userfollowingid);

        await userfollowing.save();
        await userToFollow.save();

        return res.status(200).json({ message: "User followed successfully", userfollowedBy: userfollowing, userfollowed: userToFollow });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error  followUser, something went wrong", error: error.message });
    }
};

const unfollowUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const userIdToUnfollow = req.params.userId;
        const userToUnfollow = await User.findById(userIdToUnfollow);
        if (!userToUnfollow) {
            return res.status(404).json({ message: "User to be unfollowed was not found" });
        }
        // Check if the user is  following the user to unfollow
        const isfollowing = await user.following.includes(userIdToUnfollow);
        if (!isfollowing) {
            return res.status(400).json({ message: "User is not being followed" });
        }
        // remove the id of the user to unfollow 
        user.following = user.following.filter((id) => id.toString() !== userIdToUnfollow);
        // remove the user from the follower list of the unfollowed user 
        userToUnfollow.followers = userToUnfollow.followers.filter((id) => id.toString() !== user._id.toString());
        await user.save();
        await userToUnfollow.save();
        return res.status(200).json({ message: "User unfollowed successfully", userunfollowedBy: user, userunfollowed: userToUnfollow });
    } catch (error) {
        return res.status(500).json({ message: `internal server error unfollowUser, something went wrong`, error: error.message })
    }
}


const followers = async (req, res) => {
    try {
        const userId = req.params.userId; // Assuming the user ID is passed in the request params
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Find the user by ID and populate the 'followers' array
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Extract the followers' details
        const followers = user.followers;

        return res.status(200).json({ message: "user's follower fetched successfully ", followers: followers });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error followers, something went wrong", error: error.message });
    }
};


const searchUsers = async (req, res) => {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({ message: "Search term is required" });
        }

        // Perform a case-insensitive search for users whose name contains the search term
        const users = await User.find({ name: { $regex: searchTerm, $options: 'i' } });

        return res.status(200).json({ message: "Users found successfully", users: users });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error searchUsers, something went wrong", error: error.message });
    }
};
const searchUserByid = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ message: "user id is required" })
        }
        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(404).json({ message: "user not found" })
        }
        return res.status(200).json({ message: "user found", foundUser: foundUser })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error searchUsers, something went wrong", error: error.message });
    }
}

const deleteAccount = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "user not logged in" })
        }
        const userfound = await User.findById(user._id);
        if (!userfound) {
            return res.status(404).json({ message: "user not found" })
        }
        const deletedUser = await User.findByIdAndDelete({ _id: user._id });
        return res.status(200).json({ message: "user deleted successfully", deletedUser: deletedUser });
    } catch (error) {
        return res.status(500).json({ message: `internal server error deleteAccount, something went wrong`, error: error.message })
    }
}





export { userSignup, login, logout, getCurrentUser, updateUserProfile, forgotpassword, resetPassword, resetpasswordui, followUser, followers, getAllUsers, unfollowUser, searchUsers, deleteAccount, searchUserByid }