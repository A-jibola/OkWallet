import { Table, Column, Model, PrimaryKey, IsUUID, Default, DataType, ForeignKey } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './userModel';

@Table({
    tableName: 'wallet',
    timestamps: true, // createdAt and updatedAt fields
})
export class Wallet extends Model {
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

    @Column({
        type: DataType.DECIMAL,
        allowNull: false,
    })
    balance!: number;

}
