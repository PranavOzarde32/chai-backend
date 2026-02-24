import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user= await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error while generating tokens")
    }
}


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

const loginUser = asyncHandler( async (req, res) => {
    // steps while logging in a user
    // get details from frontend
    // username or email 
    // find the user
    // password check
    // access token and refresh token
    // send cookies

    const { email, username, password } = req.body
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }

    const user = await User.findOne( { $or: [ { email }, { username } ] } )

    if( !user ){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if( !isPasswordValid ){
        throw new ApiError(401, "Invalid password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure:true,
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken", refreshToken, options).json( new ApiResponse(200, {loggedInUser, accessToken},"User logged in successfully" ))


})

const logoutUser = asyncHandler( async (req, res) => {
   await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{ refreshToken: null },

    },
    { new: true }
   )

   const options = {
        httpOnly: true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, null, "User logged out successfully") )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken
        if( !incomingRefreshToken ){
            throw new ApiError(401, "unAuthorized request")
        }

        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id)
            if( !user ){
                throw new ApiError(401, "invalid refresh token")
            }
    
            if( user.refreshToken !== incomingRefreshToken ){
                throw new ApiError(401, "refresh token is expired or used")
            }
    
            const options = {
                httpOnly: true,
                secure:true,
            }
    
            const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json( new ApiResponse(200, { accessToken ,refreshToken: newRefreshToken}, "Access token refreshed successfully") )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}