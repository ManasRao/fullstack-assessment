import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const MAX_LIMIT = 100;
  const MAX_PARAM_LENGTH = 200;

  const parsedLimit = parseInt(searchParams.get('limit') ?? '');
  const parsedOffset = parseInt(searchParams.get('offset') ?? '');

  const rawSearch = searchParams.get('search') || undefined;
  const rawCategory = searchParams.get('category') || undefined;
  const rawSubCategory = searchParams.get('subCategory') || undefined;

  const filters = {
    category: rawCategory?.slice(0, MAX_PARAM_LENGTH),
    subCategory: rawSubCategory?.slice(0, MAX_PARAM_LENGTH),
    search: rawSearch?.slice(0, MAX_PARAM_LENGTH),
    limit: Math.min(Number.isNaN(parsedLimit) ? 20 : Math.max(0, parsedLimit), MAX_LIMIT),
    offset: Number.isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset),
  };

  const products = productService.getAll(filters);
  const total = productService.getTotalCount({
    category: filters.category,
    subCategory: filters.subCategory,
    search: filters.search,
  });

  return NextResponse.json({
    products,
    total,
    limit: filters.limit,
    offset: filters.offset,
  });
}
