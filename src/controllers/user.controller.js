import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
    // steps while registering a user
    // get details from frontend
    // validate - check if empty
    // check if user already exists: username, email
    // check for images and check for avatar
    // upload them to cloudinary
    // create an user object - create an entry in db
    // remove password and refresh token field from the response
    // check for user creation
    // return res


    //if data is coming from form or json you can get it from req.body
    const { fullName, email, username, password } = req.body
    // console.log( fullName, email, username, password )

    if(
        [fullName, email, username, password].some( (field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne( { $or: [ { email }, { username } ] } )

    if( existedUser ){
        throw new ApiError(400, "User already exists")
    }
    console.log("files ", req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if( !avatarLocalPath  ){
        throw new ApiError(400, "Avatar are required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if( !avatar ){
        throw new ApiError(500, "Error while uploading avatar")
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if( !createdUser ){
        throw new ApiError(500, "Error while creating user")
    }

    return res.status(201).json( new ApiResponse(201, createdUser, "User created successfully") )



} )

export {
    registerUser,
}