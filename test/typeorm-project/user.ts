import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  userId: string;

  @Index()
  @Column()
  userName: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'char', length: 32 })
  passwordMD5?: string;

  @Column()
  age: number;

  @Column({ type: "bigint" })
  avatarId: number;

  @Column()
  signupAt?: Date;

  field: string;
}
