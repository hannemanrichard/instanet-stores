"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useProductPage, useProductItems, useUpdateProductPageWithRelations } from "../application";
import { useAuth } from "@/shared/hooks/use-auth";
import { useStoresList } from "@/features/stores";
import { MarkdownRenderer } from "@/shared/components/MarkdownRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Separator } from "@/shared/components/ui/separator";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { UploadArea } from "@/shared/components/ui/upload-area";
import { UploadAreaMultiple } from "@/shared/components/ui/upload-area-multiple";
import { cn } from "@/shared/utils/utils";

interface ProductPageEditorProps {
  slug: string;
}

const normalizeVariantColor = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export const ProductPageEditor = ({ slug }: ProductPageEditorProps) => {
  const t = useTranslations("dashboard.productPages");
  const tForm = useTranslations("dashboard.productPages.form");
  const router = useRouter();
  const pageQuery = useProductPage(slug);
  const page = pageQuery.data;
  const itemsQuery = useProductItems(page?.page.product_id ?? 0);
  const updateMutation = useUpdateProductPageWithRelations();
  const { isPlatformAdmin } = useAuth();
  const storesQuery = useStoresList(!isPlatformAdmin);

  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [description, setDescription] = useState("");
  const [slugValue, setSlugValue] = useState("");
  const [promoPoint, setPromoPoint] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageAlt, setHeroImageAlt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<string[]>([]);
  const [itemIds, setItemIds] = useState<number[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  useEffect(() => {
    if (page) {
      setHeadline(page.page.headline ?? "");
      setSubheadline(page.page.subheadline ?? "");
      setDescription(page.page.description ?? "");
      setSlugValue(page.page.slug ?? "");
      setPromoPoint(page.page.promo_point ?? 1);
      setIsActive(page.page.is_active ?? true);
      setIsFreeShipping(page.page.is_freeshipping ?? false);

      const heroMedia = page.page.hero_media?.[0];
      if (heroMedia) {
        if (typeof heroMedia === "string") {
          setHeroImageUrl(heroMedia);
        } else {
          setHeroImageUrl(heroMedia.url ?? "");
          setHeroImageAlt(heroMedia.alt_text ?? "");
        }
      }

      setVideoUrl(page.page.video_url ?? "");

      // Ensure we get all gallery images, sorted by id
      const galleryUrls = page.images
        ?.map((img) => img.url)
        .filter((url): url is string => Boolean(url)) ?? [];
      setGallery(galleryUrls);

      // Ensure we get all testimonial images, sorted by id
      const testimonialUrls = page.testimonials
        ?.map((img) => img.url)
        .filter((url): url is string => Boolean(url)) ?? [];
      setTestimonials(testimonialUrls);

      setItemIds(page.pageItems?.map((pi) => pi.item_id) ?? []);

      const seoMetadata = page.page.seo_metadata;
      if (seoMetadata && typeof seoMetadata === "object") {
        setSeoTitle((seoMetadata.title as string) ?? "");
        setSeoDescription((seoMetadata.description as string) ?? "");
        if (Array.isArray(seoMetadata.keywords)) {
          setSeoKeywords(seoMetadata.keywords.join(", "));
        } else if (typeof seoMetadata.keywords === "string") {
          setSeoKeywords(seoMetadata.keywords);
        }
      }
    }
  }, [page]);

  useEffect(() => {
    if (isPlatformAdmin || !page?.product.store_id || !storesQuery.data) return;
    const allowed = storesQuery.data.some(
      (store) => store.id === page.product.store_id
    );
    if (!allowed) {
      router.replace("/dashboard/product-pages");
    }
  }, [isPlatformAdmin, page, router, storesQuery.data]);

  const availableItems = useMemo(
    () =>
      (itemsQuery.data ?? []).filter(
        (item) => normalizeVariantColor(item.color) !== undefined
      ),
    [itemsQuery.data]
  );

  const heroImage = useMemo(() => {
    return heroImageUrl || page?.page.hero_media?.[0]?.url || page?.product.thumbnail || null;
  }, [heroImageUrl, page]);

  const isSaving = updateMutation.isPending;

  if (pageQuery.isLoading || itemsQuery.isLoading || !page) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[360px] w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!page || isSaving) {
      return;
    }

    const trimmedHeadline = headline.trim();
    if (!trimmedHeadline.length) {
      return;
    }

    const keywords = seoKeywords
      ?.split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const seoMetadataRaw = {
      title: seoTitle?.trim() || undefined,
      description: seoDescription?.trim() || undefined,
      keywords: keywords && keywords.length ? keywords : undefined,
    };

    const seoMetadata = Object.fromEntries(
      Object.entries(seoMetadataRaw).filter(
        ([, value]) =>
          value !== undefined &&
          (Array.isArray(value) ? value.length > 0 : true)
      )
    );

    const galleryUrls = gallery
      ?.map((url) => url.trim())
      .filter((url) => url.length > 0) ?? [];

    const testimonialUrls = testimonials
      ?.map((url) => url.trim())
      .filter((url) => url.length > 0) ?? [];

    const payload = {
      page: {
        slug: slugValue.trim(),
        headline: trimmedHeadline,
        subheadline: subheadline?.trim() || undefined,
        description: description?.trim() || undefined,
        promo_point: promoPoint,
        is_active: isActive,
        is_freeshipping: isFreeShipping,
        hero_media: heroImageUrl
          ? [
            {
              url: heroImageUrl.trim(),
              alt_text: heroImageAlt?.trim() || undefined,
              position: 0,
              is_primary: true,
            },
          ]
          : [],
        seo_metadata: Object.keys(seoMetadata).length ? seoMetadata : undefined,
        video_url: videoUrl.trim() || undefined,
      },
      itemIds: itemIds,
      gallery: galleryUrls,
      testimonials: testimonialUrls,
    };

    try {
      await updateMutation.mutateAsync({
        pageId: page.page.id,
        payload,
      });
      router.push("/dashboard/product-pages");
    } catch {
      // Mutation already surfaces error feedback via standardized toast
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden rounded-3xl border border-[#f0f0f0] shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
          <CardContent className="p-0">
            {heroImage ? (
              <div className="relative h-[360px] w-full">
                <Image
                  src={heroImage}
                  alt={page.page.headline}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-[360px] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                {tForm("noHero")}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {tForm("product")}
            </p>
            <h2 className="text-xl font-semibold text-[#222]">
              {page.product.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tForm("productFallback", { id: page.product.id })}
            </p>
          </div>
          <div className="rounded-2xl border border-[#f5f5f5] bg-[#fafafa] p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-[#222]">{tForm("previewDescription")}</p>
            <MarkdownRenderer content={description} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {itemsQuery.data?.slice(0, 3).map((item) => (
              <Badge key={item.id} variant="outline">
                {item.color} {item.size ? `· ${item.size}` : null}
              </Badge>
            ))}
            {itemsQuery.data && itemsQuery.data.length > 3 ? (
              <Badge variant="outline">
                {tForm("moreVariants", { count: itemsQuery.data.length - 3 })}
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <Card className="rounded-3xl border border-[#f0f0f0] shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
        <CardHeader>
          <CardTitle>{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">{tForm("slug")}</Label>
              <Input
                id="slug"
                value={slugValue}
                onChange={(event) => setSlugValue(event.target.value)}
                placeholder={tForm("slugPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-point">{tForm("promoPoint")}</Label>
              <Select
                value={promoPoint.toString()}
                onValueChange={(value) => setPromoPoint(Number(value))}
              >
                <SelectTrigger id="promo-point" aria-label={tForm("promoPoint")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{tForm("promo1")}</SelectItem>
                  <SelectItem value="2">{tForm("promo2")}</SelectItem>
                  <SelectItem value="3">{tForm("promo3")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">{tForm("published")}</Label>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {tForm("publishedHelp")}
              </p>
            </div>
            <div className="flex items-center justify-between border-t pt-4 mt-2">
              <Label htmlFor="is-free-shipping">{tForm("freeShipping")}</Label>
              <Switch
                id="is-free-shipping"
                checked={isFreeShipping}
                onCheckedChange={setIsFreeShipping}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">{tForm("headline")}</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder={tForm("headlinePlaceholder")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subheadline">{tForm("subheadline")}</Label>
              <Textarea
                id="subheadline"
                rows={2}
                value={subheadline ?? ""}
                onChange={(event) => setSubheadline(event.target.value)}
                placeholder={tForm("subheadlinePlaceholder")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">{tForm("pageDescription")}</Label>
              <p className="text-sm text-muted-foreground">
                {tForm("pageDescriptionHelp")}
              </p>
              <Textarea
                id="description"
                rows={4}
                value={description ?? ""}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={tForm("descriptionPlaceholder")}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>{tForm("gallery")}</Label>
                <p className="text-sm text-muted-foreground">
                  {tForm("galleryHelp")}
                </p>
              </div>
              <Badge variant="outline">
                {tForm("imagesCount", { count: gallery.length })}
              </Badge>
            </div>
            <UploadAreaMultiple
              endpoint="productLibrary"
              alt={tForm("gallery")}
              value={gallery}
              onChange={setGallery}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>{tForm("testimonials")}</Label>
                <p className="text-sm text-muted-foreground">
                  {tForm("testimonialsHelp")}
                </p>
              </div>
              <Badge variant="outline">
                {tForm("imagesCount", { count: testimonials.length })}
              </Badge>
            </div>
            <UploadAreaMultiple
              endpoint="productLibrary"
              alt={tForm("testimonials")}
              value={testimonials}
              onChange={setTestimonials}
            />
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hero-image">{tForm("heroImage")}</Label>
              <UploadArea
                endpoint="productImage"
                alt={tForm("heroImage")}
                value={heroImageUrl}
                onChange={setHeroImageUrl}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-image-alt">{tForm("heroAlt")}</Label>
              <Input
                id="hero-image-alt"
                value={heroImageAlt}
                onChange={(event) => setHeroImageAlt(event.target.value)}
                placeholder={tForm("heroAltPlaceholder")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="video-url">{tForm("videoUrl")}</Label>
              <UploadArea
                endpoint="productVideo"
                alt={tForm("videoUrl")}
                value={videoUrl}
                onChange={setVideoUrl}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-title">{tForm("seoTitle")}</Label>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder={tForm("seoTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-description">{tForm("seoDescription")}</Label>
              <Textarea
                id="seo-description"
                rows={2}
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                placeholder={tForm("seoDescriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="seo-keywords">{tForm("seoKeywords")}</Label>
              <Input
                id="seo-keywords"
                value={seoKeywords}
                onChange={(event) => setSeoKeywords(event.target.value)}
                placeholder={tForm("seoKeywordsPlaceholder")}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>{tForm("assignVariants")}</Label>
              </div>
              <Badge variant="outline">
                {tForm("selectedCount", { count: itemIds.length })}
              </Badge>
            </div>
            <div className="rounded-md border">
              {itemsQuery.isLoading ? (
                <Skeleton className="h-32 w-full rounded-md" />
              ) : availableItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {tForm("noVariants")}
                </div>
              ) : (
                <div className="divide-y">
                  {availableItems.map((item) => {
                    const checked = itemIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors",
                          "hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              if (isChecked) {
                                setItemIds([...itemIds, item.id]);
                              } else {
                                setItemIds(itemIds.filter((id) => id !== item.id));
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium">
                              {item.color}
                              {item.size ? ` · ${item.size}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tForm("inventory", { count: item.quantity ?? 0 })}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/product-pages">{tForm("cancel")}</Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? tForm("saving") : tForm("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
