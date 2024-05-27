require('dotenv').config();
import express from 'express';
import { Sequelize } from 'sequelize-typescript';
import { User } from './models/userModel';
import { ExternalAccount } from './models/externalAccountModel';
import { Wallet } from './models/walletModel';
import { TransactionRecord } from './models/transactionModel';
import userRouter from './routes/userRoutes';
import walletRouter from './routes/walletRoutes';

const app = express();
app.use(express.json());

// add the routes in
app.use('/user', userRouter)
app.use('/wallet', walletRouter)

const sequelize = new Sequelize({
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    ssl: true,
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
          }
    },
    models:[User, ExternalAccount, Wallet, TransactionRecord]
  });

app.listen(process.env.PORT, async()=>{
    await sequelize.authenticate()
    .then(()=> console.log('Connected to PostgreSQL'))
    .catch((err)=> console.log('Unable to Connect to PostgreSQL Database: ', err));

    //await sequelize.sync({ force: true });
    console.log('Server is listening on:', process.env.PORT);
})
