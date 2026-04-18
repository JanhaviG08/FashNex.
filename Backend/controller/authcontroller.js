import User from "../model/usermodel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import { genToken, genToken1 } from "../config/token.js";

export const registration = async (req,res) =>{
    try {
        const {name,email,password} = req.body;
        const existUser = await User.findOne({email});
        if(existUser){
            return res.status(400).json({message:"User already exists"});
        }
        if(!validator.isEmail(email)){
            return res.status(400).json({message:"Enter valid email"});
        }
        if(password.length < 8){
            return res.status(400).json({message:"Password must be at least 8 characters long"});
        }
        let hashPassword = await bcrypt.hash(password,10);

        const user = await User.create({
            name,
            email,
            password:hashPassword
        })

        let token = await genToken(user._id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
            maxAge: 7*24*60*60*1000
        })
        return res.status(201).json({user})

    } catch (error) {
        console.log("Registration error");
        res.status(500).json({message: `Internal server error${error} `});
    }
}

export const login = async (req,res) =>{
    try {
        const {email,password} = req.body;

        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid email"});
        } 

        let isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch)
        {
            return res.status(400).json({message:"Incorrect password"});
        }

        let token = await genToken(user._id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
            maxAge: 7*24*60*60*1000
        })
        return res.status(201).json(user)

    }  
    catch(error)
    {
        console.log("Login error");
        res.status(500).json({message: `Internal server error ${error} `});
    }
}   

export const logout = async(req,res)=>{
    try{
        res.clearCookie("token");
        return res.status(200).json({message:"Logout Successfully"});
    }
    catch(error)
    {
        console.log("Logout error");
        res.status(500).json({message: `Internal server error ${error} `});
    }
}

export const googleLogin = async(req,res) =>{
    try{
        let{name, email} = req.body;
        let user = await User.findOne({email});
        if(!user){
            user = await User.create({
                name,email
            })
        } 

        let token = await genToken(user._id);
        res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
            maxAge: 7*24*60*60*1000
        })
        return res.status(200).json(user)
    }
    catch(error){
        console.log("Google Login error");
        res.status(500).json({message: `Internal server error ${error} `});
    }
}


export const adminLogin = async(req,res) =>{
    try{
        let {email, password}= req.body;
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD ){
             let token = await genToken1(email);
            res.cookie("token",token,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
            maxAge: 1*24*60*60*1000
        })
        return res.status(200).json(token)
        }
        return res.status(400).json({message: "Invalid credentials"})
    }
    catch(error) {
        console.log("Admin Login error");
        res.status(500).json({message: `Admin login error ${error} `});
    }
}