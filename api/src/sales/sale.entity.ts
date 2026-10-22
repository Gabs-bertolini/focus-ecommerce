import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sales_order')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  customerEmail: string;

  @Column({ type: 'varchar', default: 'completed' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
