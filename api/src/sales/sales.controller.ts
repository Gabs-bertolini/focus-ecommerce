import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles('user')
  create(
    @Body() createSaleDto: CreateSaleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.salesService.create(createSaleDto, request.user);
  }

  @Get('dashboard')
  @Roles('admin')
  getDashboard() {
    return this.salesService.getDashboard();
  }
}
