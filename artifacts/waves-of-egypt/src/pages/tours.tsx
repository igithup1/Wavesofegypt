import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  useListTours,
  useListCategories,
  ListToursSortBy
} from '@workspace/api-client-react';
import Layout from '@/components/layout/Layout';
import { TourCard } from '@/components/ui/TourCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Waves,
  Anchor, Wind, Compass, Car, Landmark, Mountain, Star, Check,
  Clock, Users, Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CAT_ICONS: Record<string, React.ReactNode> = {
  'sea-island': <Waves className="w-4 h-4" />,
  'diving': <Anchor className="w-4 h-4" />,
  'water-sports': <Wind className="w-4 h-4" />,
  'desert-safari': <Compass className="w-4 h-4" />,
  'city-experiences': <Landmark className="w-4 h-4" />,
  'transfers': <Car className="w-4 h-4" />,
  'historical-day-trips': <Mountain className="w-4 h-4" />,
};

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 font-semibold text-sm text-foreground"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function Tours() {
  const [location] = useLocation();

  // Parse URL params
  const getParams = () => {
    const p = new URLSearchParams(window.location.search);
    return {
      search: p.get('search') || '',
      categoryId: p.get('categoryId') || 'all',
      sortBy: (p.get('sortBy') as ListToursSortBy) || 'best_seller',
      isPrivate: p.get('isPrivate') === 'true' ? true : undefined,
      isFamilyFriendly: p.get('isFamilyFriendly') === 'true' ? true : undefined,
    };
  };

  const initial = getParams();

  const [search, setSearch] = useState(initial.search);
  const [categoryId, setCategoryId] = useState<string>(initial.categoryId);
  const [sortBy, setSortBy] = useState<ListToursSortBy>(initial.sortBy);
  const [isPrivate, setIsPrivate] = useState<boolean | undefined>(initial.isPrivate);
  const [isFamilyFriendly, setIsFamilyFriendly] = useState<boolean | undefined>(initial.isFamilyFriendly);
  const [hasHotelPickup, setHasHotelPickup] = useState<boolean | undefined>(undefined);
  const [freeCancellation, setFreeCancellation] = useState<boolean | undefined>(undefined);
  const [instantConfirmation, setInstantConfirmation] = useState<boolean | undefined>(undefined);
  const [isBestSeller, setIsBestSeller] = useState<boolean | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 24]);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Offset / pagination
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const queryParams = {
    search: search || undefined,
    categoryId: categoryId !== 'all' ? parseInt(categoryId) : undefined,
    sortBy,
    isPrivate,
    isFamilyFriendly,
    hasHotelPickup,
    freeCancellation,
    instantConfirmation,
    isBestSeller,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
    minDuration: durationRange[0] > 0 ? durationRange[0] : undefined,
    maxDuration: durationRange[1] < 24 ? durationRange[1] : undefined,
    minRating: minRating,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const { data: toursData, isLoading } = useListTours(queryParams as any);
  const { data: categories } = useListCategories();

  const totalPages = Math.ceil((toursData?.total || 0) / PAGE_SIZE);

  const resetFilters = () => {
    setSearch('');
    setCategoryId('all');
    setSortBy('best_seller');
    setIsPrivate(undefined);
    setIsFamilyFriendly(undefined);
    setHasHotelPickup(undefined);
    setFreeCancellation(undefined);
    setInstantConfirmation(undefined);
    setIsBestSeller(undefined);
    setPriceRange([0, 500]);
    setDurationRange([0, 24]);
    setMinRating(undefined);
    setPage(0);
  };

  const activeFilterCount = [
    isPrivate, isFamilyFriendly, hasHotelPickup, freeCancellation, instantConfirmation, isBestSeller,
    priceRange[0] > 0, priceRange[1] < 500, durationRange[0] > 0, durationRange[1] < 24, minRating,
    categoryId !== 'all'
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-1">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Categories */}
      <FilterSection title="Activity Type">
        <div className="space-y-2">
          <button
            onClick={() => setCategoryId('all')}
            className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left", categoryId === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
          >
            <Waves className="w-4 h-4" /> All Activities
          </button>
          {categories?.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id.toString())}
              className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left", categoryId === cat.id.toString() ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              {CAT_ICONS[cat.slug] || <Compass className="w-4 h-4" />}
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price (USD per person)">
        <div className="space-y-4">
          <Slider
            min={0} max={500} step={5}
            value={priceRange}
            onValueChange={(v: number[]) => setPriceRange([v[0], v[1]])}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>{priceRange[1] >= 500 ? '$500+' : `$${priceRange[1]}`}</span>
          </div>
        </div>
      </FilterSection>

      {/* Duration */}
      <FilterSection title="Duration (hours)" defaultOpen={false}>
        <div className="space-y-4">
          <Slider
            min={0} max={24} step={1}
            value={durationRange}
            onValueChange={(v: number[]) => setDurationRange([v[0], v[1]])}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{durationRange[0]}h</span>
            <span>{durationRange[1] >= 24 ? '24h+' : `${durationRange[1]}h`}</span>
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating" defaultOpen={false}>
        <div className="flex gap-2 flex-wrap">
          {[undefined, 4.5, 4.7, 4.9].map((r) => (
            <button
              key={r ?? 'any'}
              onClick={() => setMinRating(r)}
              className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors", minRating === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50')}
            >
              <Star className="w-3 h-3 fill-current" />
              {r ? `${r}+` : 'Any'}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Checkboxes */}
      <FilterSection title="Tour Features">
        {[
          { id: 'bestSeller', label: 'Best Seller', icon: <Star className="w-3.5 h-3.5 text-accent" />, value: isBestSeller, set: (v: boolean) => setIsBestSeller(v || undefined) },
          { id: 'private', label: 'Private Tour', icon: <Users className="w-3.5 h-3.5 text-primary" />, value: isPrivate, set: (v: boolean) => setIsPrivate(v || undefined) },
          { id: 'family', label: 'Family Friendly', icon: <Check className="w-3.5 h-3.5 text-green-500" />, value: isFamilyFriendly, set: (v: boolean) => setIsFamilyFriendly(v || undefined) },
          { id: 'pickup', label: 'Hotel Pickup', icon: <Car className="w-3.5 h-3.5 text-blue-500" />, value: hasHotelPickup, set: (v: boolean) => setHasHotelPickup(v || undefined) },
          { id: 'cancel', label: 'Free Cancellation', icon: <Shield className="w-3.5 h-3.5 text-green-500" />, value: freeCancellation, set: (v: boolean) => setFreeCancellation(v || undefined) },
          { id: 'instant', label: 'Instant Confirmation', icon: <Zap className="w-3.5 h-3.5 text-yellow-500" />, value: instantConfirmation, set: (v: boolean) => setInstantConfirmation(v || undefined) },
        ].map(({ id, label, icon, value, set }) => (
          <div key={id} className="flex items-center gap-2.5 py-2">
            <Checkbox
              id={id}
              checked={value === true}
              onCheckedChange={(checked) => set(!!checked)}
            />
            <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer text-sm font-normal">
              {icon} {label}
            </Label>
          </div>
        ))}
      </FilterSection>
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-blue-900 pt-28 pb-10 text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">
            Hurghada Experiences
          </h1>
          <p className="text-primary-foreground/70 mb-6">
            {toursData?.total ? `${toursData.total} experiences available` : '230+ experiences in Hurghada'}
          </p>

          {/* Search bar */}
          <div className="bg-background rounded-2xl p-3 shadow-xl text-foreground flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder='Search "dolphin", "quad bike", "Luxor"…'
                className="pl-10 h-12 border-0 text-base focus-visible:ring-0"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <Select value={sortBy} onValueChange={(v: ListToursSortBy) => { setSortBy(v); setPage(0); }}>
              <SelectTrigger className="h-12 w-full sm:w-52 border-0 bg-muted/50">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best_seller">Best Sellers First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price_asc">Price: Low → High</SelectItem>
                <SelectItem value="price_desc">Price: High → Low</SelectItem>
                <SelectItem value="duration_asc">Duration: Short → Long</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {isPrivate && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setIsPrivate(undefined)}>Private <X className="w-3 h-3" /></Badge>}
              {isFamilyFriendly && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setIsFamilyFriendly(undefined)}>Family Friendly <X className="w-3 h-3" /></Badge>}
              {hasHotelPickup && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setHasHotelPickup(undefined)}>Hotel Pickup <X className="w-3 h-3" /></Badge>}
              {freeCancellation && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFreeCancellation(undefined)}>Free Cancellation <X className="w-3 h-3" /></Badge>}
              {instantConfirmation && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setInstantConfirmation(undefined)}>Instant Confirmation <X className="w-3 h-3" /></Badge>}
              {isBestSeller && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setIsBestSeller(undefined)}>Best Seller <X className="w-3 h-3" /></Badge>}
              {categoryId !== 'all' && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCategoryId('all')}>{categories?.find(c => c.id.toString() === categoryId)?.name} <X className="w-3 h-3" /></Badge>}
              <button onClick={resetFilters} className="text-xs text-primary-foreground/70 hover:text-primary-foreground underline">Clear all</button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filter toggle */}
          <div className="lg:hidden w-full">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium mb-6"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && <Badge className="ml-1">{activeFilterCount}</Badge>}
            </button>
            {mobileFilterOpen && (
              <div className="mb-6">
                <FilterPanel />
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground text-sm">
                {isLoading ? 'Loading…' : `${toursData?.total ?? 0} experiences found`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : toursData?.tours && toursData.tours.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {toursData.tours.map((tour, i) => (
                    <TourCard key={tour.id} tour={tour} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-muted-foreground px-4">Page {page + 1} of {totalPages}</span>
                    <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 bg-muted/30 rounded-2xl border border-border">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No experiences found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">Try adjusting your search or removing some filters.</p>
                <Button variant="outline" onClick={resetFilters}>Clear all filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
