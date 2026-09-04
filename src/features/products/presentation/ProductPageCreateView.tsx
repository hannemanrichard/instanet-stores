"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/utils";
import { UploadArea } from "@/shared/components/ui/upload-area";
import { UploadAreaMultiple } from "@/shared/components/ui/upload-area-multiple";
import {
  useAdminProducts,
  useCreateProductPage,
  useProductItems,
} from "@/features/products/application";

const normalizeVariantColor = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type TranslationFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

const createFormSchema = (t: TranslationFn) =>
  z.object({
    productId: z.coerce.number().int().min(1, t("validation.selectProduct")),
    promoPoint: z.coerce
      .number()
      .int()
      .min(1, t("validation.promoMin"))
      .max(3, t("validation.promoMax")),
    slug: z
      .string()
      .trim()
      .min(1, t("validation.slugRequired"))
      .regex(slugRegex, t("validation.slugFormat")),
    headline: z.string().trim().min(1, t("validation.headlineRequired")),
    subheadline: z.string().trim().optional(),
    description: z.string().trim().optional(),
    heroImageUrl: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^https?:\/\//i.test(val), t("validation.validUrl")),
    heroImageAlt: z.string().trim().optional(),
    videoUrl: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^https?:\/\//i.test(val), t("validation.validUrl")),
    isActive: z.boolean().default(true),
    isFreeShipping: z.boolean().default(false),
    seoTitle: z.string().trim().optional(),
    seoDescription: z.string().trim().optional(),
    seoKeywords: z.string().trim().optional(),
    itemIds: z.array(z.number()).min(1, t("validation.selectVariant")),
    gallery: z
      .array(z.string().trim().url(t("validation.validImageUrl")))
      .default([]),
    testimonials: z
      .array(z.string().trim().url(t("validation.validImageUrl")))
      .default([]),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const defaultValues: FormValues = {
  productId: 0,
  promoPoint: 1,
  slug: "",
  headline: "",
  subheadline: "",
  description: "",
  heroImageUrl: "",
  heroImageAlt: "",
  videoUrl: "",
  isActive: true,
  isFreeShipping: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  itemIds: [],
  gallery: [],
  testimonials: [],
};

export const ProductPageCreateView = () => {
  const router = useRouter();
  const t = useTranslations("dashboard.productPages.form");
  const createPageMutation = useCreateProductPage();
  const productsQuery = useAdminProducts();
  const products = productsQuery.data ?? [];

  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    watch,
    setValue,
    formState: { isSubmitting, isValid, isDirty },
    handleSubmit,
    reset,
  } = form;

  const selectedProductId = watch("productId");
  const slugValue = watch("slug");

  const { data: productItemsData, isLoading: itemsLoading } = useProductItems(
    selectedProductId > 0 ? selectedProductId : 0
  );

  const availableItems = useMemo(
    () =>
      (productItemsData ?? []).filter(
        (item) => normalizeVariantColor(item.color) !== undefined
      ),
    [productItemsData]
  );

  useEffect(() => {
    if (!selectedProductId) {
      setValue("itemIds", []);
    }
  }, [selectedProductId, setValue]);

  const handleGenerateSlug = useCallback(() => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    const generated = product.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", generated, { shouldValidate: true, shouldDirty: true });
    if (!slugValue) {
      setValue("headline", product.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [products, selectedProductId, setValue, slugValue]);

  const onSubmit = (values: FormValues) => {
    const keywords = values.seoKeywords
      ?.split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const seoMetadataRaw = {
      title: values.seoTitle?.trim() || undefined,
      description: values.seoDescription?.trim() || undefined,
      keywords: keywords && keywords.length ? keywords : undefined,
    };

    const seoMetadata = Object.fromEntries(
      Object.entries(seoMetadataRaw).filter(
        ([, value]) =>
          value !== undefined &&
          (Array.isArray(value) ? value.length > 0 : true)
      )
    );

    const galleryUrls =
      values.gallery
        ?.map((url) => url.trim())
        .filter((url) => url.length > 0) ?? [];

    const testimonialUrls =
      values.testimonials
        ?.map((url) => url.trim())
        .filter((url) => url.length > 0) ?? [];

    const payload = {
      page: {
        product_id: values.productId,
        promo_point: values.promoPoint,
        slug: values.slug.trim(),
        headline: values.headline.trim(),
        subheadline: values.subheadline?.trim() || undefined,
        description: values.description?.trim() || undefined,
        hero_media: values.heroImageUrl
          ? [
            {
              url: values.heroImageUrl.trim(),
              alt_text: values.heroImageAlt?.trim() || undefined,
              position: 0,
              is_primary: true,
            },
          ]
          : [],
        seo_metadata: Object.keys(seoMetadata).length ? seoMetadata : undefined,
        is_active: values.isActive,
        is_freeshipping: values.isFreeShipping,
        video_url: values.videoUrl?.trim() || undefined,
      },
      itemIds: values.itemIds,
      gallery: galleryUrls,
      testimonials: testimonialUrls,
    };

    createPageMutation.mutate(payload, {
      onSuccess: () => {
        reset(defaultValues);
        router.push("/dashboard/product-pages");
      },
    });
  };

  const disableSubmit =
    isSubmitting || createPageMutation.isPending || !isValid || !isDirty;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("createCardTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("product")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? field.value.toString() : ""}
                      disabled={productsQuery.isLoading}
                    >
                      <SelectTrigger aria-label={t("chooseProduct")}>
                        <SelectValue placeholder={t("chooseProduct")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promoPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("promoPoint")}</FormLabel>
                    <FormDescription>{t("promoPointHelp")}</FormDescription>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? field.value.toString() : "1"}
                    >
                      <FormControl>
                        <SelectTrigger aria-label={t("promoPoint")}>
                          <SelectValue placeholder={t("promoPoint")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{t("promo1")}</SelectItem>
                        <SelectItem value="2">{t("promo2")}</SelectItem>
                        <SelectItem value="3">{t("promo3")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">{t("published")}</Label>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="!mt-0 flex flex-row items-center justify-between gap-2">
                        <FormLabel className="sr-only">
                          {t("publishPage")}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            id="is-active"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("publishedHelp")}
                </p>
              </div>
              <FormField
                control={form.control}
                name="isFreeShipping"
                render={({ field }) => (
                  <div className="flex items-center justify-between border-t pt-4 mt-2">
                    <Label htmlFor="is-free-shipping">{t("freeShipping")}</Label>
                    <FormItem className="!mt-0 flex flex-row items-center justify-between gap-2">
                      <FormLabel className="sr-only">
                        {t("enableFreeShipping")}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="is-free-shipping"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>{t("slug")}</FormLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateSlug}
                        disabled={!selectedProductId}
                      >
                        {t("generateFromProduct")}
                      </Button>
                    </div>
                    <FormControl>
                      <Input placeholder={t("slugPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("headline")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("headlinePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subheadline"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("subheadline")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t("subheadlinePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("pageDescription")}</FormLabel>
                    <FormDescription>{t("pageDescriptionHelp")}</FormDescription>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={t("descriptionPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="gallery"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold leading-none">
                        {t("gallery")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("galleryHelp")}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {t("imagesCount", { count: (field.value ?? []).length })}
                    </Badge>
                  </div>
                  <FormControl>
                    <input
                      ref={field.ref}
                      type="hidden"
                      value={(field.value ?? []).join("|")}
                      onChange={() => undefined}
                    />
                  </FormControl>
                  <UploadAreaMultiple
                    endpoint="productLibrary"
                    alt={t("gallery")}
                    value={field.value ?? []}
                    onChange={(urls) => field.onChange(urls)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="testimonials"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold leading-none">
                        {t("testimonials")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("testimonialsHelp")}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {t("imagesCount", { count: (field.value ?? []).length })}
                    </Badge>
                  </div>
                  <FormControl>
                    <input
                      ref={field.ref}
                      type="hidden"
                      value={(field.value ?? []).join("|")}
                      onChange={() => undefined}
                    />
                  </FormControl>
                  <UploadAreaMultiple
                    endpoint="productLibrary"
                    alt={t("testimonials")}
                    value={field.value ?? []}
                    onChange={(urls) => field.onChange(urls)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="heroImageUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("heroImage")}</FormLabel>
                    <FormControl>
                      <input
                        ref={field.ref}
                        type="hidden"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <UploadArea
                      endpoint="productImage"
                      alt={t("heroImage")}
                      value={field.value ?? ""}
                      onChange={(url) => field.onChange(url)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heroImageAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("heroAlt")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("heroAltPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("videoUrl")}</FormLabel>
                    <FormControl>
                      <input
                        ref={field.ref}
                        type="hidden"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <UploadArea
                      endpoint="productVideo"
                      alt={t("videoUrl")}
                      value={field.value ?? ""}
                      onChange={(url) => field.onChange(url)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seoTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seoTitle")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("seoTitlePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seoDescription")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t("seoDescriptionPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seoKeywords"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("seoKeywords")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("seoKeywordsPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t("assignVariants")}</h3>
                </div>
                <Badge variant="outline">
                  {t("selectedCount", { count: form.watch("itemIds").length })}
                </Badge>
              </div>
              <FormField
                control={form.control}
                name="itemIds"
                render={({ field }) => (
                  <FormItem>
                    <FormMessage />
                    <div className="rounded-md border">
                      {itemsLoading ? (
                        <Skeleton className="h-32 w-full rounded-md" />
                      ) : availableItems.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          {selectedProductId
                            ? t("noVariants")
                            : t("selectProductFirst")}
                        </div>
                      ) : (
                        <div className="divide-y">
                          {availableItems.map((item) => {
                            const checked =
                              field.value?.includes(item.id) ?? false;
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
                                        field.onChange([
                                          ...(field.value ?? []),
                                          item.id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          (field.value ?? []).filter(
                                            (id) => id !== item.id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <div>
                                    <p className="font-medium">
                                      {item.color}
                                      {item.size ? ` · ${item.size}` : ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {t("inventory", {
                                        count: item.quantity ?? 0,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset(defaultValues);
                  router.push("/dashboard/product-pages");
                }}
                disabled={createPageMutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={disableSubmit}>
                {createPageMutation.isPending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
