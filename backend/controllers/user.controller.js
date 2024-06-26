import{v2 as cloudinary} from "cloudinary";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
    try{
        const { username } = req.params;
        const user = await User.findOne({username: username}).select("-password");
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        res.status(200).json(user);
    }
    catch(error){
        console.log("Error in getUser controller: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const trimmedId = id.trim(); // Trim the id to remove any extraneous whitespace or newline characters

        const userToModify = await User.findById(trimmedId);
        const currentUser = await User.findById(req.user._id);

        if (trimmedId === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(trimmedId);

        if (isFollowing) { // If already following, then unfollow
            await User.findByIdAndUpdate(trimmedId, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: trimmedId } });
            res.status(200).json({ message: "Unfollowed successfully" });
        } else { // Not already following, so follow
            await User.findByIdAndUpdate(trimmedId, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: trimmedId } });
            
            const newNotification = new Notification({
                from: req.user._id,
                to: userToModify._id,//do trimmedId if not working
                type: "follow",
            });

            await newNotification.save();//saves in db

            res.status(200).json({ message: "Followed successfully" });//TODO:return id of user as response
        }
    } catch (error) {
        console.log("Error in followUnfollowUser controller: ", error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try{
        const userId=req.user._id; 

        const usersFollowedByMe=await User.findById(userId).select("following");//to filter out later

        const users=await User.aggregate([ 
            {
                $match: {
                    _id: {$ne: userId}//to remove the user themselves
                }
            },
            {
                $sample: {
                    size: 10//finding any 10 users
                }
            },
        ])

        const filteredUsers= users.filter(user=>!usersFollowedByMe.following.includes(user._id));//removing already followed users
        const suggestedUsers= filteredUsers.slice(0,4);//final suggested users (dont suggest all 10)

        suggestedUsers.forEach(user=>user.password=null);//to not show password
        res.status(200).json(suggestedUsers);
    }
    catch(error){
        console.log("Error in getSuggestedUsers controller: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const updateUser = async (req, res) => {
    try{
        const { fullName, username,currentPassword, newPassword, email, link, bio } = req.body;
        let {profileImg, coverImg} = req.body;
        const userId=req.user._id;

        let user=await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"});
        }

        //updating password checks
        if((!newPassword&&currentPassword)||(!currentPassword&&newPassword)){
            return res.status(400).json({error: "Please enter both current and new password"});
        }
        if(currentPassword&&newPassword){
            const isMatch=await bcrypt.compare(currentPassword, user.password);
            if(!isMatch){
                return res.status(400).json({error: "Incorrect current password"});
            }
            if(newPassword.length<6){
                return res.status(400).json({error: "Password must be atleast 6 characters long"});
            }
            
            const salt=await bcrypt.genSalt(10); 
            user.password=await bcrypt.hash(newPassword, salt);
        }

        //updating profileImg and coverImg
        if(profileImg){
           if(user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);//deletes the previous image from cloudinary
           } 
           const uploadedResponse= await cloudinary.uploader.upload(profileImg)
           profileImg=uploadedResponse.secure_url;
        }
        if(coverImg){
            if(user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);//deletes the previous image from cloudinary
            }
            const uploadedResponse= await cloudinary.uploader.upload(coverImg)
            coverImg=uploadedResponse.secure_url;
        }


        //updating other fields
        user.fullName=fullName||user.fullName;
        user.email=email||user.email;
        user.username=username||user.username;
        user.bio=bio||user.bio;
        user.link=link||user.link;
        user.profileImg=profileImg||user.profileImg;
        user.coverImg=coverImg||user.coverImg;

        user=await user.save();
        user.password=null;

        return res.status(200).json(user);
    }
    catch(error){
        console.log("Error in updateUser controller: ", error.message);
        res.status(500).json({error: error.message});
    }
};
