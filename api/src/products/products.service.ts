import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovement, StockMovementType } from './stock-movement.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private stockMovementsRepository: Repository<StockMovement>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  findOne(id: number): Promise<Product> {
    return this.productsRepository.findOneOrFail({ where: { id } });
  }

  findStockMovements(): Promise<StockMovement[]> {
    return this.stockMovementsRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  create(createProductDto: Omit<Product, 'id'>): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const productsRepository = manager.getRepository(Product);
      const product = await productsRepository.save(
        productsRepository.create(createProductDto),
      );

      if (product.stock > 0) {
        await manager.getRepository(StockMovement).save({
          productId: product.id,
          productName: product.name,
          type: StockMovementType.ENTRY,
          previousStock: 0,
          currentStock: product.stock,
          note: 'Estoque inicial',
        });
      }

      return product;
    });
  }

  update(id: number, updateProductDto: Partial<Product>): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      if (updateProductDto.stock !== undefined && updateProductDto.stock < 0) {
        throw new BadRequestException('O estoque não pode ser negativo');
      }

      const productsRepository = manager.getRepository(Product);
      const product = await productsRepository.findOne({
        where: { id },
        ...(updateProductDto.stock !== undefined
          ? { lock: { mode: 'pessimistic_write' as const } }
          : {}),
      });

      if (!product) {
        throw new NotFoundException(`Product #${id} not found`);
      }

      const previousStock = product.stock;
      productsRepository.merge(product, updateProductDto);
      const updatedProduct = await productsRepository.save(product);

      if (
        updateProductDto.stock !== undefined &&
        updateProductDto.stock !== previousStock
      ) {
        await manager.getRepository(StockMovement).save({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          type: StockMovementType.ADJUSTMENT,
          previousStock,
          currentStock: updatedProduct.stock,
          note: 'Alteração manual do cadastro',
        });
      }

      return updatedProduct;
    });
  }

  createStockMovement(
    id: number,
    movementDto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    return this.dataSource.transaction(async (manager) => {
      const productsRepository = manager.getRepository(Product);
      const product = await productsRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Product #${id} not found`);
      }

      if (movementDto.type !== StockMovementType.ADJUSTMENT && movementDto.quantity < 1) {
        throw new BadRequestException('A quantidade deve ser maior que zero');
      }

      const previousStock = product.stock;
      const currentStock =
        movementDto.type === StockMovementType.ENTRY
          ? previousStock + movementDto.quantity
          : movementDto.type === StockMovementType.WITHDRAWAL
            ? previousStock - movementDto.quantity
            : movementDto.quantity;

      if (currentStock < 0) {
        throw new BadRequestException('Estoque insuficiente para esta baixa');
      }
      if (currentStock === previousStock) {
        throw new BadRequestException('O novo estoque deve ser diferente do atual');
      }

      product.stock = currentStock;
      await productsRepository.save(product);

      return manager.getRepository(StockMovement).save({
        productId: product.id,
        productName: product.name,
        type: movementDto.type,
        previousStock,
        currentStock,
        note: movementDto.note?.trim() || null,
      });
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product #${id} not found`);
    }
  }
}