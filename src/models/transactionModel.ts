import { Table, Column, Model, PrimaryKey, IsUUID, Default, DataType, ForeignKey } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from './walletModel';
import { ExternalAccount } from './externalAccountModel';


export enum paymentStatus{
    Pending = "Pending",
    Completed = "Completed",
    Failed = "Failed"
}

export enum paymentType{
    Credit = "Credit",
    Debit = "Debit",
}

@Table({
    tableName: 'transactionRecord',
    timestamps: true, // createdAt and updatedAt fields
})
export class TransactionRecord extends Model {
    @PrimaryKey
    @IsUUID(4)
    @Default(uuidv4)
    @Column({
        type: DataType.UUID,
    })
    id!: string;

    @ForeignKey(()=> Wallet)
    @IsUUID(4)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    walletAccountId!: string;

    @ForeignKey(()=> ExternalAccount)
    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    externalAccountId!: string;

    @Column({
        type: DataType.DECIMAL,
        allowNull: false,
    })
    amount!: number;

    @Column({
        type: DataType.ENUM(...Object.values(paymentType)),
        allowNull: false,
    })
    type!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    description!: string;

    @Default(paymentStatus.Pending)
    @Column({
        type: DataType.ENUM(...Object.values(paymentStatus)),
        allowNull: false,
    })
    status!: string;


}
