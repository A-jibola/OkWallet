import { Table, Column, Model, PrimaryKey, IsUUID, Default, DataType, ForeignKey } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './userModel';

export enum accountType{
    OkWallet = "OkWallet",
    Bank = "Bank",
    Other = "Other"
}

@Table({
    tableName: 'externalAccount',
    timestamps: true, // createdAt and updatedAt fields
})
export class ExternalAccount extends Model {
    @PrimaryKey
    @IsUUID(4)
    @Default(uuidv4)
    @Column({
        type: DataType.UUID,
    })
    id!: string;

    @ForeignKey(()=> User)
    @IsUUID(4)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    userId!: string;

    @Default(accountType.Other)
    @Column({
        type: DataType.ENUM(...Object.values(accountType)),
        allowNull: false,
    })
    accountType!: string;

    // this would be unique but there are cases where people can have the same bank account number
    // but different banks and it will point to different accounts. So we will check this with institutionName
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    accountIdentifier!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    institutionName!: string;

}
