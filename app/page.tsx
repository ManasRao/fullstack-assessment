"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  retailPrice: number;
}

const PRODUCTS_PER_PAGE = 20;

export default function Home() {
  const urlParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(
    urlParams.get("search") ?? ""
  );
  const [search, setSearch] = useState(urlParams.get("search") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    urlParams.get("category") ?? undefined
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    string | undefined
  >(urlParams.get("subCategory") ?? undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [offset, setOffset] = useState(0);
  const fetchIdRef = useRef(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync filter state to URL so back navigation restores it
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSubCategory) params.set("subCategory", selectedSubCategory);
    const qs = params.toString();
    const newUrl = qs ? `/?${qs}` : "/";
    window.history.replaceState(null, "", newUrl);
  }, [search, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json();
      })
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetch(
        `/api/subcategories?category=${encodeURIComponent(selectedCategory)}`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch subcategories");
          return res.json();
        })
        .then((data) => setSubCategories(data.subCategories))
        .catch((err) =>
          console.error("Failed to load subcategories:", err)
        );
    } else {
      setSubCategories([]);
      setSelectedSubCategory(undefined);
    }
  }, [selectedCategory]);

  const fetchProducts = useCallback(
    (currentOffset: number, append: boolean) => {
      const currentFetchId = ++fetchIdRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSubCategory)
        params.append("subCategory", selectedSubCategory);
      params.append("limit", String(PRODUCTS_PER_PAGE));
      params.append("offset", String(currentOffset));

      fetch(`/api/products?${params}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch products");
          return res.json();
        })
        .then((data) => {
          if (currentFetchId !== fetchIdRef.current) return;
          if (append) {
            setProducts((prev) => [...prev, ...data.products]);
          } else {
            setProducts(data.products);
          }
          setTotal(data.total);
          setError(false);
        })
        .catch(() => {
          if (currentFetchId !== fetchIdRef.current) return;
          if (!append) {
            setError(true);
          }
        })
        .finally(() => {
          if (currentFetchId !== fetchIdRef.current) return;
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [search, selectedCategory, selectedSubCategory]
  );

  useEffect(() => {
    setOffset(0);
    fetchProducts(0, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    const newOffset = offset + PRODUCTS_PER_PAGE;
    setOffset(newOffset);
    fetchProducts(newOffset, true);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedCategory(undefined);
    setSelectedSubCategory(undefined);
  };

  const hasMore = products.length < total;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold mb-6">StackShop</h1>
          </Link>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
                aria-label="Search products"
              />
            </div>

            <Select
              value={selectedCategory ?? "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger
                className="w-full md:w-[200px]"
                aria-label="Filter by category"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 0 && (
              <Select
                value={selectedSubCategory ?? "all"}
                onValueChange={(value) =>
                  setSelectedSubCategory(
                    value === "all" ? undefined : value
                  )
                }
              >
                <SelectTrigger
                  className="w-full md:w-[200px]"
                  aria-label="Filter by subcategory"
                >
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(searchInput || selectedCategory || selectedSubCategory) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div>
            <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-full overflow-hidden pt-0">
                  <CardHeader className="p-0">
                    <div className="h-48 bg-muted animate-pulse" />
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg font-medium text-destructive">
              Failed to load products
            </p>
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please check your connection and try
              again.
            </p>
            <Button
              variant="outline"
              onClick={() => fetchProducts(0, false)}
            >
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
            {(searchInput || selectedCategory || selectedSubCategory) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {products.length} of {total} products
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.stacklineSku}
                  href={`/product/${product.stacklineSku}`}
                  className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden pt-0">
                    <CardHeader className="p-0">
                      <div className="relative h-48 w-full overflow-hidden bg-muted">
                        {product.imageUrls[0] && (
                          <Image
                            src={product.imageUrls[0]}
                            alt={product.title}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <CardTitle className="text-base line-clamp-2 mb-2">
                        {product.title}
                      </CardTitle>
                      <CardDescription className="flex gap-2 flex-wrap mb-3">
                        <Badge variant="secondary">
                          {product.categoryName}
                        </Badge>
                        <Badge variant="outline">
                          {product.subCategoryName}
                        </Badge>
                      </CardDescription>
                      {product.retailPrice != null && (
                        <p className="text-lg font-bold">
                          ${product.retailPrice.toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <span className="w-full flex items-center justify-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : `Load More Products`}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
