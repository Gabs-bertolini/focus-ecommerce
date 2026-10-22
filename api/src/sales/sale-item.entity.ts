import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sales_order_item')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  saleId: number;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;
}
