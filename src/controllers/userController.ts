import { NextFunction, Request, Response } from "express";
import { User } from "../models/userModel";
import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { Wallet } from "../models/walletModel";

const userController = {
    signUp: async(req: Request, res: Response)=>{
        try{
            if(req.body.email == null || req.body.password == null){
                return res.status(400).json({message: "Please enter your Email and Password"});
            }
            // Check if user exists
            const existingUser = await User.findOne({where:{
                email: req.body.email
            }})

            if(existingUser){
                return res.status(400).json({message: "Email has been used already"});
            }

            // if user does not exist, create a new user
            // first hash password
            const hashedPassword = await hash(req.body.password, 10)
            const newUser = await User.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: hashedPassword
            });
            // create a new wallet as well for the user
            await Wallet.create({
                userId: newUser.id,
                balance: 0.0
            })
        
            return res.status(201).json({message: "Signup Successful!"});
        }
        catch(error){
            return res.status(500).json({message: "Error occured when registering, Please try again later: ", error: String(error)})
        }
    },
    login: async(req: Request, res: Response)=>{
        try{
            if(req.body.email == null || req.body.password == null){
                return res.status(400).json({message: "Please enter your Email and Password"});
            }
            // Check if user exists
            const existingUser = await User.findOne({where:{
                email: req.body.email
            }})

            if(!existingUser){
                return res.status(400).json({message: "Error occured when logging in, please check login details"});
            }

            // if user does exist, then check password
            const confirmUser = await compare(req.body.password, existingUser!.password)
            if(!confirmUser){
                return res.status(400).json({message: "Error occured when logging in, please check login details"});
            }

            // user has the right details. create a token for logging in
            const token = sign({data: existingUser!.email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'})

            return res.status(200).json({message: "Login Successful!", token: token});
        }
        catch(error){
            return res.status(500).json({message: "Error occured when logging in, Please try again later: ", error: String(error)})
        }
    },
    authenticate: async(req: Request, res: Response, next: NextFunction)=>{
        try{
            // verify the token in the authorization header
            const token = req.header('Authorization');
            if(!token) return res.status(401).json({message: "Please Sign in"});

            verify(token, process.env.ACCESS_TOKEN, (error, userEmail)=>{
                if(error) return res.status(401).json({message: "Please Sign in again"});
                // pass the user to the next function
                req.body.userEmail = userEmail;
                next();
            })
            
        }
        catch(error){
            return res.status(500).json({message: "Error occured when logging in, Please try again later: " , error: String(error)})
        }
    }
}

export default userController;