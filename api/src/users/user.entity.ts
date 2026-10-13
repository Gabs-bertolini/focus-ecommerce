import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity()
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ default: false })
  isAdmin: boolean;

  @Index('UQ_user_googleId', { unique: true })
  @Column({ type: 'varchar', nullable: true })
  googleId: string | null;
}
