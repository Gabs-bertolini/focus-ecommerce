import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { jest } from '@jest/globals';
import { DataSource } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { StockMovement, StockMovementType } from './stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = { transaction: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('records a withdrawal and updates the product stock', async () => {
    const product = { id: 1, name: 'Produto', stock: 5 } as Product;
    const productsRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const movementInput = {
      productId: 1,
      productName: 'Produto',
      type: StockMovementType.WITHDRAWAL,
      previousStock: 5,
      currentStock: 3,
      note: 'Pedido separado',
    };
    const movement = { ...movementInput, id: 1 };
    const movementsRepository = {
      save: jest.fn().mockResolvedValue(movement),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Product ? productsRepository : movementsRepository,
      ),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    const result = await service.createStockMovement(1, {
      type: StockMovementType.WITHDRAWAL,
      quantity: 2,
      note: 'Pedido separado',
    } as CreateStockMovementDto);

    expect(product.stock).toBe(3);
    expect(movementsRepository.save).toHaveBeenCalledWith(movementInput);
    expect(result).toEqual(movement);
  });

  it('rejects a withdrawal greater than the available stock', async () => {
    const product = { id: 1, name: 'Produto', stock: 2 } as Product;
    const movementsRepository = { save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Product
          ? { findOne: jest.fn().mockResolvedValue(product) }
          : movementsRepository,
      ),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.createStockMovement(1, {
        type: StockMovementType.WITHDRAWAL,
        quantity: 3,
      } as CreateStockMovementDto),
    ).rejects.toThrow('Estoque insuficiente');

    expect(product.stock).toBe(2);
    expect(movementsRepository.save).not.toHaveBeenCalled();
  });

  it('records a stock adjustment through product updates', async () => {
    const product = { id: 1, name: 'Produto', stock: 4 } as Product;
    const productsRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      merge: jest.fn((entity, values) => Object.assign(entity, values)),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const movementsRepository = { save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Product ? productsRepository : movementsRepository,
      ),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await service.update(1, { stock: 9 });

    expect(movementsRepository.save).toHaveBeenCalledWith({
      productId: 1,
      productName: 'Produto',
      type: StockMovementType.ADJUSTMENT,
      previousStock: 4,
      currentStock: 9,
      note: 'Alteração manual do cadastro',
    });
  });
});
