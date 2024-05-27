import { Table, Column, Model, PrimaryKey, IsUUID, Default, DataType } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({
    tableName: 'users',
    timestamps: true, // createdAt and updatedAt fields
})
export class User extends Model {
    @PrimaryKey
    @IsUUID(4)
    @Default(uuidv4)
    @Column({
        type: DataType.UUID,
    })
    id!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    firstName!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    lastName!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    password!: string;
}
