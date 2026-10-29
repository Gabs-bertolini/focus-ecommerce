import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { StockMovement } from '../products/stock-movement.entity';
import { SaleItem } from './sale-item.entity';
import { Sale } from './sale.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Product, StockMovement])],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
