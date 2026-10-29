import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { jest } from '@jest/globals';
import { DataSource } from 'typeorm';
import { Product } from '../products/product.entity';
import { StockMovementType } from '../products/stock-movement.entity';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = { transaction: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(SaleItem), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('creates a sale using current product prices and decreases stock', async () => {
    const product: Product = {
      id: 4,
      name: 'Produto',
      price: '12.50',
      cost: '7.25',
      stock: 5,
      image: '',
    };
    const productsRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    const sale = { id: 23, userId: 7, customerEmail: 'cliente@example.com' };
    const saleRepository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(sale),
    };
    const saleItemRepository = {
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
      find: jest.fn().mockResolvedValue([{ saleId: 23 }]),
    };
    const stockMovementRepository = { save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Product) return productsRepository;
        if (entity === Sale) return saleRepository;
        if (entity === SaleItem) return saleItemRepository;
        return stockMovementRepository;
      }),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    const result = await service.create(
      {
        items: [
          { productId: 4, quantity: 1 },
          { productId: 4, quantity: 2 },
        ],
      },
      { userId: 7, email: 'cliente@example.com' },
    );

    expect(product.stock).toBe(2);
    expect(saleItemRepository.save).toHaveBeenCalledWith({
      saleId: 23,
      productId: 4,
      productName: 'Produto',
      quantity: 3,
      unitPrice: 12.5,
      unitCost: 7.25,
    });
    expect(stockMovementRepository.save).toHaveBeenCalledWith({
      productId: 4,
      productName: 'Produto',
      type: StockMovementType.WITHDRAWAL,
      previousStock: 5,
      currentStock: 2,
      note: 'Venda #23',
    });
    expect(result).toEqual({ ...sale, items: [{ saleId: 23 }] });
  });

  it('rejects orders that exceed available stock without creating a sale', async () => {
    const product: Product = {
      id: 4,
      name: 'Produto',
      price: 12,
      cost: 7,
      stock: 1,
      image: '',
    };
    const productsRepository = {
      findOne: jest.fn().mockResolvedValue(product),
    };
    const saleRepository = { create: jest.fn(), save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Product
          ? productsRepository
          : entity === Sale
            ? saleRepository
            : {},
      ),
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(
      service.create(
        { items: [{ productId: 4, quantity: 2 }] },
        { userId: 7, email: 'cliente@example.com' },
      ),
    ).rejects.toThrow('Estoque insuficiente');

    expect(saleRepository.save).not.toHaveBeenCalled();
    expect(product.stock).toBe(1);
  });

  it('quotes sale item aliases in PostgreSQL dashboard aggregates', async () => {
    const selections: string[] = [];
    const dailyQuery = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn((expression: string) => {
        selections.push(expression);
        return dailyQuery;
      }),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    const productQuery = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: '0', units: '0' }),
    };
    const salesRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const saleItemsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(dailyQuery),
      find: jest.fn(),
    };
    const productsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(productQuery),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: salesRepository },
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: saleItemsRepository,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    const dashboardService = module.get<SalesService>(SalesService);

    await dashboardService.getDashboard();

    expect(selections).toContain(
      'COALESCE(SUM("saleItem"."quantity" * "saleItem"."unitPrice"), 0)',
    );
    expect(selections).toContain(
      'COALESCE(SUM("saleItem"."quantity" * "saleItem"."unitCost"), 0)',
    );
  });
});
