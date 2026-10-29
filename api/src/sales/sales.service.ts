import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import {
  StockMovement,
  StockMovementType,
} from '../products/stock-movement.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';

const DASHBOARD_DAYS = 30;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  create(
    dto: CreateSaleDto,
    user: { userId: number; email: string },
  ): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const quantities = new Map<number, number>();
      for (const item of dto.items) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productsRepository = manager.getRepository(Product);
      const saleRepository = manager.getRepository(Sale);
      const saleItemsRepository = manager.getRepository(SaleItem);
      const movementsRepository = manager.getRepository(StockMovement);
      const items: Array<{
        product: Product;
        quantity: number;
      }> = [];

      for (const [productId, quantity] of [...quantities].sort(
        ([firstId], [secondId]) => firstId - secondId,
      )) {
        const product = await productsRepository.findOne({
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Produto #${productId} não encontrado`);
        }
        if (product.stock < quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}`,
          );
        }

        items.push({ product, quantity });
      }

      const sale = await saleRepository.save(
        saleRepository.create({
          userId: user.userId,
          customerEmail: user.email,
          status: 'completed',
        }),
      );

      for (const { product, quantity } of items) {
        const previousStock = product.stock;
        product.stock -= quantity;
        await productsRepository.save(product);
        await movementsRepository.save({
          productId: product.id,
          productName: product.name,
          type: StockMovementType.WITHDRAWAL,
          previousStock,
          currentStock: product.stock,
          note: `Venda #${sale.id}`,
        });
        await saleItemsRepository.save(
          saleItemsRepository.create({
            saleId: sale.id,
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: Number(product.price),
            unitCost: Number(product.cost),
          }),
        );
      }

      const saleItems = await saleItemsRepository.find({
        where: { saleId: sale.id },
      });
      return { ...sale, items: saleItems };
    });
  }

  async getDashboard() {
    const startDate = new Date(
      Date.now() - (DASHBOARD_DAYS - 1) * DAY_IN_MILLISECONDS,
    );
    startDate.setUTCHours(0, 0, 0, 0);

    const [dailyRows, recentSales, productStats] = await Promise.all([
      this.saleItemsRepository
        .createQueryBuilder('saleItem')
        .innerJoin(Sale, 'sale', 'sale.id = saleItem.saleId')
        .select('DATE(sale."createdAt")', 'date')
        .addSelect('COUNT(DISTINCT sale.id)', 'orders')
        .addSelect(
          'COALESCE(SUM("saleItem"."quantity" * "saleItem"."unitPrice"), 0)',
          'revenue',
        )
        .addSelect(
          'COALESCE(SUM("saleItem"."quantity" * "saleItem"."unitCost"), 0)',
          'costs',
        )
        .where('sale."createdAt" >= :startDate', { startDate })
        .groupBy('DATE(sale."createdAt")')
        .orderBy('DATE(sale."createdAt")', 'ASC')
        .getRawMany<{
          date: string;
          orders: string;
          revenue: string;
          costs: string;
        }>(),
      this.salesRepository.find({ order: { createdAt: 'DESC' }, take: 8 }),
      this.productsRepository
        .createQueryBuilder('product')
        .select('COUNT(product.id)', 'count')
        .addSelect('COALESCE(SUM(product.stock), 0)', 'units')
        .getRawOne<{ count: string; units: string }>(),
    ]);
    const recentItems = recentSales.length
      ? await this.saleItemsRepository.find({
          where: { saleId: In(recentSales.map((sale) => sale.id)) },
        })
      : [];
    const itemsBySale = new Map<number, SaleItem[]>();
    for (const item of recentItems) {
      const saleItems = itemsBySale.get(item.saleId) ?? [];
      saleItems.push(item);
      itemsBySale.set(item.saleId, saleItems);
    }

    const rowsByDate = new Map(
      dailyRows.map((row) => [
        new Date(row.date).toISOString().slice(0, 10),
        row,
      ]),
    );
    const daily = Array.from({ length: DASHBOARD_DAYS }, (_, index) => {
      const date = new Date(startDate.getTime() + index * DAY_IN_MILLISECONDS);
      const key = date.toISOString().slice(0, 10);
      const row = rowsByDate.get(key);
      return {
        date: key,
        orders: Number(row?.orders ?? 0),
        revenue: Number(row?.revenue ?? 0),
        costs: Number(row?.costs ?? 0),
      };
    });
    const totals = daily.reduce(
      (result, day) => ({
        orders: result.orders + day.orders,
        revenue: result.revenue + day.revenue,
        costs: result.costs + day.costs,
      }),
      { orders: 0, revenue: 0, costs: 0 },
    );

    return {
      periodDays: DASHBOARD_DAYS,
      ...totals,
      profit: totals.revenue - totals.costs,
      productCount: Number(productStats?.count ?? 0),
      stockUnits: Number(productStats?.units ?? 0),
      daily,
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        customerEmail: sale.customerEmail,
        createdAt: sale.createdAt,
        status: sale.status,
        total: (itemsBySale.get(sale.id) ?? []).reduce(
          (sum, item) => sum + Number(item.unitPrice) * item.quantity,
          0,
        ),
        costs: (itemsBySale.get(sale.id) ?? []).reduce(
          (sum, item) => sum + Number(item.unitCost) * item.quantity,
          0,
        ),
      })),
    };
  }
}
