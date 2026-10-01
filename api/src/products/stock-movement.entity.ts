import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum StockMovementType {
  ENTRY = 'entry',
  WITHDRAWAL = 'withdrawal',
  ADJUSTMENT = 'adjustment',
}

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column({ type: 'varchar' })
  type: StockMovementType;

  @Column()
  previousStock: number;

  @Column()
  currentStock: number;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}