import { Request, Response } from "express";
import { User } from "../models/userModel";
import { Wallet } from "../models/walletModel";
import { Sequelize, Transaction } from "sequelize";
import { ExternalAccount, accountType } from "../models/externalAccountModel";
import { TransactionRecord, paymentStatus, paymentType } from "../models/transactionModel";

const walletController = {
    getWallet: async(req: Request, res: Response)=>{
        try{
            // if the user from the request exists then return the wallet of the user
            const existingUser = await User.findOne({where:{
                email: req.body.userEmail.data
            }})
            if(!existingUser) return res.status(400).json({message: "Please Sign in again"});

            const wallet = await Wallet.findOne({where:{
                userId: existingUser.id
            }})
            res.status(200).json({message: "Wallet Returned Successfully!", wallet: wallet});
        }
        catch(error){
            res.status(500).json({message: "Error occured when Retrieving Wallet, Please try again later: ", error: String(error)})
        }
    },
    creditWalletFromExternal:async(req: Request, res: Response)=>{
        try{
            const {senderAccountType, senderAccountIdentifier, senderInstitutionName,
                amount, description } = req.body;
            
            if(!senderAccountIdentifier  || !senderAccountType || !senderInstitutionName || amount <= 0){
                return res.status(400).json({message: "Form incomplete, Please enter all required information"});
            }

            const receivingUser = await User.findOne({where:{
                email: req.body.userEmail.data
            }});

            if(!receivingUser) return res.status(404).json({message: "Could not find your account, please try again!"});

            const sequelize = Wallet.sequelize as Sequelize;

            await sequelize.transaction({isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE},
                async(transaction: Transaction)=>{

                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Transaction Timed out")), process.env.TRANSACTION_TIMEOUT);
                    });

                    const transactionLogic = (async() =>{
                        let externalAccount = await ExternalAccount.findOne({
                            where: {accountIdentifier: senderAccountIdentifier, institutionName: senderInstitutionName},
                            lock: transaction.LOCK.UPDATE,
                            transaction: transaction,
                        });

                        if(!externalAccount){
                            // create external account
                            externalAccount = await ExternalAccount.create({
                                userId: receivingUser.id,
                                accountType: senderAccountType,
                                accountIdentifier: senderAccountIdentifier,
                                institutionName: senderInstitutionName                    
                            }, {transaction: transaction});
                        }

                        await TransactionRecord.create({
                            externalAccountId:senderAccountIdentifier,
                            amount: amount,
                            type: paymentType.Debit,
                            description: description,
                            paymentStatus: paymentStatus.Completed,
                        }, {transaction: transaction})

                        // get the receiving wallet
                        const receivingWallet = await Wallet.findOne({
                            where:{userId: receivingUser.id},
                            lock: transaction.LOCK.UPDATE,
                            transaction: transaction
                        });

                        receivingWallet!.balance = Number(receivingWallet!.balance) + parseFloat(amount);
                        await receivingWallet!.save({ transaction: transaction });

                        await TransactionRecord.create({
                            walletAccountId:receivingWallet!.id,
                            amount: amount,
                            type: paymentType.Credit,
                            description: description,
                            paymentStatus: paymentStatus.Completed,
                        }, {transaction: transaction})
                    })();

                    await Promise.race([transactionLogic, timeoutPromise]);
                })

            res.status(200).json({message: "Your Wallet has been Credited Successfully!"});
        }
        catch(error){
            res.status(500).json({message: "Error occured when Crediting Account, Please try again later: " , error: String(error)})
        }
    },
    creditWalletToWallet: async(req: Request, res: Response)=>{
        try{
            const {receivingWalletEmail, amount, description} = req.body

            if(!receivingWalletEmail || amount <=0){
                return res.status(404).json({message: "Form incomplete, Please enter all required information"});
            }

            if(req.body.userEmail.data==receivingWalletEmail) return res.status(400).json({message: "Credit and Debit Accounts cannot be the same"});
            const receivingUser = await User.findOne({where:{
                email: receivingWalletEmail
            }});

            const sendingUser = await User.findOne({where:{
                email: req.body.userEmail.data
            }});

            if(!receivingUser) return res.status(404).json({message: "Could not find receiving User!"});

            const sequelize = Wallet.sequelize as Sequelize;

            await sequelize.transaction({isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE},
                async(transaction: Transaction)=>{

                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("Transaction Timed out")), process.env.TRANSACTION_TIMEOUT);
                    });

                    const transactionLogic = (async() =>{
                        const sendingWallet = await Wallet.findOne({
                            where:{userId: sendingUser!.id},
                            lock: transaction.LOCK.UPDATE,
                            transaction: transaction
                        });

                        if(Number(sendingWallet!.balance) < amount){
                            throw new Error("Insufficient funds")
                        }

                        sendingWallet!.balance = Number(sendingWallet!.balance) - parseFloat(amount);
                        await sendingWallet!.save({ transaction: transaction });
                        await TransactionRecord.create({
                            walletAccountId:sendingWallet!.id,
                            amount: amount,
                            type: paymentType.Debit,
                            description: description,
                            paymentStatus: paymentStatus.Completed,
                        }, {transaction: transaction})

                    // get the receiving wallet
                        const receivingWallet = await Wallet.findOne({
                        where:{userId: receivingUser.id},
                        lock: transaction.LOCK.UPDATE,
                        transaction: transaction
                    });

                        receivingWallet!.balance = Number(receivingWallet!.balance) + parseFloat(amount);
                        await receivingWallet!.save({ transaction: transaction });
                        await TransactionRecord.create({
                            walletAccountId:receivingWallet!.id,
                            amount: amount,
                            type: paymentType.Credit,
                            description: description,
                            paymentStatus: paymentStatus.Completed,
                        }, {transaction: transaction});
                    })();

                    await Promise.race([transactionLogic, timeoutPromise]);
            })
            res.status(200).json({message: "Transfer Completed Successfully!"});
        }
        catch(error){
            res.status(500).json({message: "Error occured when transfering, Please try again later: ", error: String(error)})
        }
    },
    debitWallet: async(req: Request, res: Response)=>{
        try{
            const {receiverAccountType, receiverAccountIdentifier, receiverInstitutionName,
                amount, description } = req.body;

            if(!receiverAccountIdentifier || !receiverAccountType || !receiverInstitutionName || amount<=0){
                return res.status(400).json({message: "Form incomplete, Please enter all required information"});
            }
            
            const sendingUser = await User.findOne({where:{
                email: req.body.userEmail.data
            }});
    
            if(!sendingUser) return res.status(404).json({message: "Could not find your account, please try again!"});
    
            const sequelize = Wallet.sequelize as Sequelize;
    
            await sequelize.transaction({
                isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE},
                async(transaction: Transaction)=>{
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Transaction Timed out")), process.env.TRANSACTION_TIMEOUT);
                });

                const transactionLogic = (async() =>{
                // get the sending wallet
                    const sendingWallet = await Wallet.findOne({
                        where:{userId: sendingUser.id},
                        lock: transaction.LOCK.UPDATE,
                        transaction: transaction
                    });

                    if(Number(sendingWallet!.balance) < amount){
                        throw new Error("Insufficient funds")
                    }

                    let externalAccount = await ExternalAccount.findOne({
                        where: {accountIdentifier: receiverAccountIdentifier, institutionName: receiverInstitutionName},
                        lock: transaction.LOCK.UPDATE,
                        transaction: transaction,
                    });
        
                    if(!externalAccount){
                        // create external account
                        externalAccount = await ExternalAccount.create({
                            userId: sendingUser.id,
                            accountType: receiverAccountType,
                            accountIdentifier: receiverAccountIdentifier,
                            institutionName: receiverInstitutionName                    
                        }, {transaction: transaction});
                    }
        
                    await TransactionRecord.create({
                        externalAccountId:receiverAccountIdentifier,
                        amount: amount,
                        type: paymentType.Credit,
                        description: description,
                        paymentStatus: paymentStatus.Completed,
                    }, {transaction: transaction})
        
                sendingWallet!.balance = Number(sendingWallet!.balance) - parseFloat(amount);
                await sendingWallet!.save({ transaction: transaction });
                await TransactionRecord.create({
                    walletAccountId:sendingWallet!.id,
                    amount: amount,
                    type: paymentType.Debit,
                    description: description,
                    paymentStatus: paymentStatus.Completed,
                }, {transaction: transaction})
                })();

                await Promise.race([transactionLogic, timeoutPromise]);
            })
    
            res.status(200).json({message: "Your Wallet has been Debited Successfully!",});
    
        }
        catch(error){
            res.status(500).json({message: "Error occured when withdrawing, Please try again later: " , error: String(error)})
        }
    }
}

export default walletController;
