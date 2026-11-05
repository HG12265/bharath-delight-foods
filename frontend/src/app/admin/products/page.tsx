"use client";

import React, { useState } from "react";
import { useMe } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { 
  useAdminProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useUpdateProductStatus 
} from "@/hooks/use-products";
import { useMediaAsset } from "@/hooks/use-media";
import mediaService from "@/services/media-service";
import { optimizeCloudinaryUrl } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Edit2, 
  Archive, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  X,
  Star,
  Globe,
  Tag,
  BookOpen,
  DollarSign
} from "lucide-react";
import { Product } from "@/types";

function ProductImage({ mediaId, className }: { mediaId?: string; className?: string }) {
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl ? mediaId : ((!isError && mediaRes?.success && mediaRes?.data?.public_url) ? mediaRes.data.public_url : "/images/product-placeholder.jpg");
  
  if (!mediaId) {
    return (
      <div className={`${className || "w-10 h-10"} bg-richCream/20 border border-burnishedGold/10 rounded flex items-center justify-center text-burnishedGold/40`}>
        <ImageIcon className="w-5 h-5" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizeCloudinaryUrl(url, 100) || "/images/product-placeholder.jpg"}
      alt="Product preview"
      className={className || "w-10 h-10 object-cover rounded border border-burnishedGold/15"}
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/images/product-placeholder.jpg";
      }}
    />
  );
}

const generateSku = (productName: string, volumeWeight: string) => {
  if (!productName.trim() || !volumeWeight.trim()) return "";
  
  // Clean product name: remove generic words to keep SKU short and clean
  const cleanProduct = productName
    .toLowerCase()
    .replace(/\b(mr|bharath|delight|foods|ghee|pure|organic|natural|a2|cow)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map(word => word.toUpperCase())
    .filter(Boolean)
    .join("-");
    
  let productCode = cleanProduct;
  if (!productCode) {
    productCode = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Clean volume/weight, e.g. "250ml Glass Jar" -> "250ML"
  const volumeMatch = volumeWeight.match(/^(\d+(?:ml|g|l|kg|ml|liter|kg|oz|ib|gm|kilogram|packet|box)?)/i);
  const cleanVolume = (volumeMatch ? volumeMatch[1] : volumeWeight)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return `MBF-${productCode}-${cleanVolume}`;
};

export default function AdminProductsPage() {
  const { data: meData } = useMe();
  const isAdmin = meData?.data?.role === "admin";

  const { data: productsRes, isPending: loadingProducts, error: productsError, refetch: refetchProducts } = useAdminProducts();
  const { data: categoriesRes, isPending: loadingCategories } = useCategories();

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const updateStatusMutation = useUpdateProductStatus();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived" | "featured">("all");
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  // View States: 'list' | 'create' | 'edit'
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formMediaIds, setFormMediaIds] = useState<string[]>([]);
  const [formTags, setFormTags] = useState("");
  const [formSearchKeywords, setFormSearchKeywords] = useState("");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formStatus, setFormStatus] = useState<"draft" | "active" | "archived">("draft");
  
  // Sourcing & SEO
  const [formSourcingRegion, setFormSourcingRegion] = useState("Tamil Nadu");
  const [formSourcingStory, setFormSourcingStory] = useState("Locally sourced and carefully packaged for premium freshness.");
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDesc, setFormSeoDesc] = useState("");
  const [formSeoKeywords, setFormSeoKeywords] = useState("");

  // Variants
  interface VariantInput {
    variant_id?: string;
    sku: string;
    title: string;
    volume_weight: string;
    price: string;
    stock_status: "in_stock" | "out_of_stock";
    is_active: boolean;
  }
  const [formVariants, setFormVariants] = useState<VariantInput[]>([
    { sku: "", title: "", volume_weight: "", price: "", stock_status: "in_stock", is_active: true }
  ]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formGeneralError, setFormGeneralError] = useState("");

  // Media Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Confirmation Modal
  const [archivingProduct, setArchivingProduct] = useState<Product | null>(null);

  // Active form Tab: 'basic' | 'variants' | 'seo' | 'media'
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "variants" | "seo" | "media">("basic");

  // Auto-generate SKUs for new variants when product name or variant volume changes
  const volumeWeightsStr = formVariants.map(v => v.volume_weight).join(",");
  React.useEffect(() => {
    setFormVariants(prev => {
      let changed = false;
      const updated = prev.map(v => {
        if (!v.sku) {
          const expectedSku = generateSku(formName, v.volume_weight);
          if (expectedSku) {
            changed = true;
            return { ...v, sku: expectedSku };
          }
        }
        return v;
      });
      return changed ? updated : prev;
    });
  }, [formName, volumeWeightsStr]);

  // Handlers
  const toggleProductExpand = (id: string) => {
    setExpandedProductIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartCreate = () => {
    if (!isAdmin) return;
    setEditingProduct(null);
    setFormName("");
    setFormSlug("");
    setFormShortDesc("");
    setFormDescription("");
    setFormCategoryId(categoriesRes?.data?.[0]?.id || "");
    setFormMediaIds([]);
    setFormTags("");
    setFormSearchKeywords("");
    setFormIsFeatured(false);
    setFormStatus("draft");
    setFormSourcingRegion("Tamil Nadu");
    setFormSourcingStory("Locally sourced and carefully packaged for premium freshness.");
    setFormSeoTitle("");
    setFormSeoDesc("");
    setFormSeoKeywords("");
    setFormVariants([
      { sku: "", title: "Standard Pack", volume_weight: "500g", price: "", stock_status: "in_stock", is_active: true }
    ]);
    setFormErrors({});
    setFormGeneralError("");
    setActiveFormTab("basic");
    setView("create");
  };

  const handleStartEdit = (product: Product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormShortDesc(product.short_description);
    setFormDescription(product.description);
    setFormCategoryId(product.category_id);
    setFormMediaIds(product.media_ids || []);
    setFormTags(product.tags?.join(", ") || "");
    setFormSearchKeywords(product.search_keywords?.join(", ") || "");
    setFormIsFeatured(product.is_featured);
    setFormStatus(product.status);
    setFormSourcingRegion(product.sourcing?.region || "Tamil Nadu");
    setFormSourcingStory(product.sourcing?.story || "Locally sourced and carefully packaged for premium freshness.");
    setFormSeoTitle(product.seo?.meta_title || "");
    setFormSeoDesc(product.seo?.meta_description || "");
    setFormSeoKeywords(product.seo?.meta_keywords?.join(", ") || "");
    
    // Map variants
    const mappedVariants = product.variants.map(v => ({
      variant_id: v.variant_id,
      sku: v.sku,
      title: v.title,
      volume_weight: v.volume_weight,
      price: v.price.toString(),
      stock_status: v.stock_status,
      is_active: v.is_active
    }));
    setFormVariants(mappedVariants.length > 0 ? mappedVariants : [
      { sku: "", title: "", volume_weight: "", price: "", stock_status: "in_stock", is_active: true }
    ]);
    setFormErrors({});
    setFormGeneralError("");
    setActiveFormTab("basic");
    setView("edit");
  };

  const handleAddVariant = () => {
    setFormVariants(prev => [
      ...prev,
      { sku: "", title: "", volume_weight: "", price: "", stock_status: "in_stock", is_active: true }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (formVariants.length <= 1) return;
    setFormVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantInput, value: any) => {
    setFormVariants(prev => {
      const updated = [...prev];
      const current = updated[index];
      let newSku = current.sku;
      if (field === "volume_weight") {
        const oldExpected = generateSku(formName, current.volume_weight);
        if (!current.sku || current.sku === oldExpected) {
          newSku = generateSku(formName, value);
        }
      }
      updated[index] = {
        ...current,
        [field]: value,
        ...(field === "volume_weight" ? { sku: newSku } : {})
      };
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WEBP files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB.");
      return;
    }

    setUploadError("");
    setUploadingImage(true);

    try {
      const uploadedMedia = await mediaService.uploadFile(file, "product_image");
      setFormMediaIds(prev => [...prev, uploadedMedia.id]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveMediaId = (mediaId: string) => {
    setFormMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Product Name is required.";
    if (!formShortDesc.trim() || formShortDesc.length < 5) {
      errors.short_description = "Short Description must be at least 5 characters.";
    }
    if (!formDescription.trim() || formDescription.length < 10) {
      errors.description = "Full Description must be at least 10 characters.";
    }
    if (!formCategoryId) errors.category_id = "Please select a category.";
    if (!formSourcingRegion.trim()) errors.sourcing_region = "Sourcing Region is required.";
    if (!formSourcingStory.trim() || formSourcingStory.length < 10) {
      errors.sourcing_story = "Sourcing story must be at least 10 characters.";
    }

    if (formSlug && !/^[a-z0-9-]+$/.test(formSlug)) {
      errors.slug = "Slug must contain only lower-case letters, numbers, and hyphens.";
    }

    // Validate variants
    if (formVariants.length === 0) {
      errors.variants = "At least one variant must be created.";
    } else {
      const skusSeen = new Set<string>();
      formVariants.forEach((v, idx) => {
        if (!v.sku.trim()) {
          errors[`variant_${idx}_sku`] = "SKU is required.";
        } else {
          const skuUpper = v.sku.trim().toUpperCase();
          if (skusSeen.has(skuUpper)) {
            errors[`variant_${idx}_sku`] = "Duplicate SKU in form.";
          }
          skusSeen.add(skuUpper);
        }

        if (!v.title.trim()) {
          errors[`variant_${idx}_title`] = "Title is required.";
        }
        if (!v.volume_weight.trim()) {
          errors[`variant_${idx}_volume`] = "Volume/Weight is required.";
        }
        if (!v.price.trim() || parseFloat(v.price) <= 0 || isNaN(parseFloat(v.price))) {
          errors[`variant_${idx}_price`] = "Price must be greater than 0.";
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!validateForm()) {
      setFormGeneralError("Please review all tabs and fix input errors.");
      return;
    }

    setFormGeneralError("");
    const parsedVariants = formVariants.map(v => ({
      sku: v.sku.trim().toUpperCase(),
      title: v.title.trim(),
      volume_weight: v.volume_weight.trim(),
      price: parseFloat(v.price),
      stock_status: v.stock_status,
      is_active: v.is_active
    }));

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      short_description: formShortDesc.trim(),
      description: formDescription.trim(),
      category_id: formCategoryId,
      media_ids: formMediaIds.filter(id => /^[a-fA-F0-9]{24}$/.test(id)),
      sourcing: {
        region: formSourcingRegion.trim(),
        story: formSourcingStory.trim()
      },
      attributes: [],
      variants: parsedVariants,
      seo: formSeoTitle.trim() || formSeoDesc.trim() || formSeoKeywords.trim() ? {
        meta_title: formSeoTitle.trim() || undefined,
        meta_description: formSeoDesc.trim() || undefined,
        meta_keywords: formSeoKeywords.trim() ? formSeoKeywords.split(",").map(k => k.trim()) : []
      } : undefined,
      tags: formTags.trim() ? formTags.split(",").map(t => t.trim()) : [],
      search_keywords: formSearchKeywords.trim() ? formSearchKeywords.split(",").map(k => k.trim()) : [],
      is_featured: formIsFeatured,
      status: formStatus
    };

    try {
      if (view === "create") {
        await createProductMutation.mutateAsync(payload);
      } else if (view === "edit" && editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, payload });
      }
      refetchProducts();
      setView("list");
    } catch (err: any) {
      setFormGeneralError(err.response?.data?.message || err.message || "Failed to save product catalog changes.");
    }
  };

  const handleConfirmArchive = async () => {
    if (!isAdmin || !archivingProduct) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: archivingProduct.id,
        status: "archived"
      });
      setArchivingProduct(null);
      refetchProducts();
    } catch (err: any) {
      alert("Failed to archive product: " + err.message);
    }
  };

  const handleStatusQuickToggle = async (product: Product, newStatus: "active" | "draft" | "archived") => {
    if (!isAdmin) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: product.id,
        status: newStatus
      });
      refetchProducts();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Listings helper
  const products = productsRes?.data || [];
  const categories = categoriesRes?.data || [];

  // Filter products locally based on SearchQuery & Category & Status
  const filteredProducts = products.filter(p => {
    // 1. Search filter: Name, Slug, or SKU
    const matchQuery = searchQuery.trim().toLowerCase();
    let matchesSearch = true;
    if (matchQuery) {
      const nameMatch = p.name.toLowerCase().includes(matchQuery);
      const slugMatch = p.slug.toLowerCase().includes(matchQuery);
      const skuMatch = p.variants?.some(v => v.sku.toLowerCase().includes(matchQuery)) || false;
      matchesSearch = nameMatch || slugMatch || skuMatch;
    }

    // 2. Category filter
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;

    // 3. Status filter
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = p.status === "active";
    else if (statusFilter === "draft") matchesStatus = p.status === "draft";
    else if (statusFilter === "archived") matchesStatus = p.status === "archived";
    else if (statusFilter === "featured") matchesStatus = p.is_featured === true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryName = (catId: string) => {
    const category = categories.find(c => c.id === catId);
    return category ? category.name : "Unassigned";
  };

  const formatPriceRange = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return "₹0.00";
    const prices = product.variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `₹${min.toFixed(2)}`;
    return `₹${min.toFixed(2)} - ₹${max.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">Active</span>;
      case "draft":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">Draft</span>;
      case "archived":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">Archived</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  if (loadingProducts || loadingCategories) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Failed to fetch product catalog. Verify connection and credentials.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-burnishedGold/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
            Product Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-indianInk/60 mt-1">
            Create, moderate, archive, and manage variants and pricing lists.
          </p>
        </div>
        {view === "list" && isAdmin && categories.length > 0 && (
          <button
            onClick={handleStartCreate}
            className="bg-deodharForest hover:bg-deodharForest/95 text-richCream font-bold uppercase tracking-widest text-xs px-4 py-2.5 rounded transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-6 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-serif text-base font-bold">No Categories Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            Create categories first before adding products.
          </p>
        </div>
      ) : view === "list" ? (
        <div className="space-y-4">
          
          {/* Quick Filters Top Chips */}
          <div className="flex flex-wrap gap-2 items-center bg-[#FAF9F6] p-2 border border-burnishedGold/15 rounded">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                statusFilter === "all"
                  ? "bg-deodharForest text-richCream border-transparent"
                  : "bg-white text-indianInk/70 border-burnishedGold/20 hover:border-burnishedGold/40"
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                statusFilter === "active"
                  ? "bg-green-700 text-white border-transparent"
                  : "bg-white text-green-700/80 border-green-200 hover:border-green-300"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                statusFilter === "draft"
                  ? "bg-amber-700 text-white border-transparent"
                  : "bg-white text-amber-700/80 border-amber-200 hover:border-amber-300"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter("archived")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                statusFilter === "archived"
                  ? "bg-red-700 text-white border-transparent"
                  : "bg-white text-red-700/80 border-red-200 hover:border-red-300"
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => setStatusFilter("featured")}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition flex items-center gap-1 ${
                statusFilter === "featured"
                  ? "bg-gheeGold text-deodharForest border-transparent"
                  : "bg-white text-gheeGold border-gheeGold/30 hover:border-gheeGold"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" /> Featured
            </button>
          </div>

          {/* Search and Category Select Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-8 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indianInk/40">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by Name, Slug, or SKU..."
                className="w-full text-xs border border-burnishedGold/30 rounded pl-9 pr-3 py-2.5 focus:border-burnishedGold focus:outline-none placeholder-indianInk/40 bg-white"
              />
            </div>
            
            <div className="md:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs border border-burnishedGold/30 rounded px-3 py-2.5 focus:border-burnishedGold focus:outline-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-burnishedGold/15 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-sans text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-burnishedGold/10 text-indianInk/60">
                    <th className="px-4 py-3 font-bold uppercase tracking-wider w-16">Image</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Product Info</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Slug</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Price Range</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Variants</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burnishedGold/10">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const hasVariants = p.variants && p.variants.length > 0;
                      const isExpanded = !!expandedProductIds[p.id];
                      return (
                        <React.Fragment key={p.id}>
                          <tr className="hover:bg-richCream/5 transition-colors">
                            <td className="px-4 py-3.5">
                              <ProductImage mediaId={p.media_urls?.[0] || p.media_ids?.[0]} />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-deodharForest">{p.name}</div>
                              {p.is_featured && (
                                <span className="inline-flex items-center gap-0.5 bg-gheeGold/10 text-gheeGold border border-gheeGold/20 rounded px-1.5 py-0.5 text-[8px] font-black uppercase mt-1">
                                  <Star className="w-2.5 h-2.5 fill-current" /> Featured
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-indianInk/70 font-mono text-[10px]">
                              {p.slug}
                            </td>
                            <td className="px-4 py-3.5 text-indianInk/80">
                              {getCategoryName(p.category_id)}
                            </td>
                            <td className="px-4 py-3.5">
                              {getStatusBadge(p.status)}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-indianInk">
                              {formatPriceRange(p)}
                            </td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => toggleProductExpand(p.id)}
                                className="inline-flex items-center gap-1 bg-white hover:bg-richCream/10 border border-burnishedGold/25 px-2 py-1 rounded text-[10px] font-bold text-burnishedGold uppercase tracking-widest transition"
                              >
                                {p.variants?.length || 0} Size{p.variants?.length !== 1 && "s"}
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isAdmin ? (
                                <div className="flex justify-end items-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEdit(p)}
                                    className="bg-deodharForest hover:bg-deodharForest/95 text-richCream font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition flex items-center gap-1 shadow-sm"
                                    title="Edit Product"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>

                                  {p.status === "active" ? (
                                    <button
                                      onClick={() => handleStatusQuickToggle(p, "draft")}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition"
                                      title="Switch to Draft"
                                    >
                                      Draft
                                    </button>
                                  ) : p.status === "draft" ? (
                                    <button
                                      onClick={() => handleStatusQuickToggle(p, "active")}
                                      className="bg-green-700 hover:bg-green-800 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition"
                                      title="Publish to Shop"
                                    >
                                      Publish
                                    </button>
                                  ) : null}

                                  {p.status !== "archived" && (
                                    <button
                                      onClick={() => setArchivingProduct(p)}
                                      className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition flex items-center gap-1"
                                      title="Archive Product"
                                    >
                                      <Archive className="w-3 h-3" /> Archive
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-indianInk/40 italic">Read-only</span>
                              )}
                            </td>
                          </tr>

                          {/* Expandable Variants Row */}
                          {isExpanded && hasVariants && (
                            <tr>
                              <td colSpan={8} className="bg-[#FAF9F6]/80 p-4 border-b border-burnishedGold/10">
                                <div className="text-[10px] font-bold text-deodharForest uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <span>SKU & Volume Inventory Pricing:</span>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                  {p.variants.map((v) => (
                                    <div 
                                      key={v.variant_id} 
                                      className="bg-white border border-burnishedGold/15 rounded p-2 text-[11px] text-indianInk flex flex-col gap-1 min-w-[140px] shadow-sm relative overflow-hidden"
                                    >
                                      <div className="font-bold text-deodharForest text-xs flex justify-between gap-2">
                                        <span>{v.title}</span>
                                        <span className={`w-2 h-2 rounded-full mt-1 ${v.is_active ? "bg-green-500" : "bg-red-500"}`} />
                                      </div>
                                      <div className="text-indianInk/60 font-mono text-[9px]">{v.sku}</div>
                                      <div className="flex justify-between items-center mt-1 border-t border-burnishedGold/5 pt-1">
                                        <span className="bg-richCream/20 border border-burnishedGold/10 px-1 py-0.5 rounded text-[9px]">{v.volume_weight}</span>
                                        <span className="font-black text-gheeGold">₹{Number(v.price).toFixed(2)}</span>
                                      </div>
                                      {v.stock_status === "out_of_stock" && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                          <span className="bg-red-100 text-red-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-red-200">OUT OF STOCK</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-indianInk/40 italic">
                        Not enough data yet. Metrics will appear after orders are recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        
        /* CREATE / EDIT FORM VIEW */
        <div className="bg-white border border-burnishedGold/15 rounded shadow-sm overflow-hidden font-sans">
          
          {/* Header section */}
          <div className="px-6 py-4 border-b border-burnishedGold/10 bg-[#FAF9F6] flex justify-between items-center">
            <h2 className="font-serif text-base font-bold text-deodharForest">
              {view === "create" ? "Create Product Node" : `Edit Product Catalog: ${editingProduct?.name}`}
            </h2>
            <button
              onClick={() => setView("list")}
              className="text-indianInk/60 hover:text-indianInk text-xs uppercase font-bold tracking-widest flex items-center gap-1 outline-none"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-burnishedGold/10 bg-[#FAF9F6]/50">
            <button
              onClick={() => setActiveFormTab("basic")}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 outline-none flex items-center gap-1.5 transition ${
                activeFormTab === "basic"
                  ? "border-deodharForest text-deodharForest bg-white"
                  : "border-transparent text-indianInk/60 hover:text-indianInk"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Basic Info
            </button>
            <button
              onClick={() => setActiveFormTab("variants")}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 outline-none flex items-center gap-1.5 transition ${
                activeFormTab === "variants"
                  ? "border-deodharForest text-deodharForest bg-white"
                  : "border-transparent text-indianInk/60 hover:text-indianInk"
              }`}
            >
              <DollarSign className="w-4 h-4" /> Variants ({formVariants.length})
            </button>
            <button
              onClick={() => setActiveFormTab("seo")}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 outline-none flex items-center gap-1.5 transition ${
                activeFormTab === "seo"
                  ? "border-deodharForest text-deodharForest bg-white"
                  : "border-transparent text-indianInk/60 hover:text-indianInk"
              }`}
            >
              <Globe className="w-4 h-4" /> Sourcing & SEO
            </button>
            <button
              onClick={() => setActiveFormTab("media")}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 outline-none flex items-center gap-1.5 transition ${
                activeFormTab === "media"
                  ? "border-deodharForest text-deodharForest bg-white"
                  : "border-transparent text-indianInk/60 hover:text-indianInk"
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Media Images ({formMediaIds.length})
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
            
            {/* Form general warning */}
            {formGeneralError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formGeneralError}</span>
              </div>
            )}

            {/* TAB: Basic Info */}
            {activeFormTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Product Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Pure Cow Ghee"
                    className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.name ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                  />
                  {formErrors.name && <p className="text-[10px] font-semibold text-red-600">{formErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Custom Slug (optional)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. pure-cow-ghee"
                    className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.slug ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                  />
                  {formErrors.slug && <p className="text-[10px] font-semibold text-red-600">{formErrors.slug}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Category Taxonomy *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.category_id ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category_id && <p className="text-[10px] font-semibold text-red-600">{formErrors.category_id}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                  >
                    <option value="draft">Draft (hidden from public storefront)</option>
                    <option value="active">Active (available in public shop)</option>
                    <option value="archived">Archived (disables catalog visibility)</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Short Description * (5 - 300 chars)</label>
                  <input
                    type="text"
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    placeholder="Short summary highlighting quality parameters..."
                    className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.short_description ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                  />
                  {formErrors.short_description && <p className="text-[10px] font-semibold text-red-600">{formErrors.short_description}</p>}
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Full Description * (10 - 2000 chars)</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide a comprehensive product description details..."
                    rows={6}
                    className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.description ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                  />
                  {formErrors.description && <p className="text-[10px] font-semibold text-red-600">{formErrors.description}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="ghee, organic, pure, fresh"
                    className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Search Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={formSearchKeywords}
                    onChange={(e) => setFormSearchKeywords(e.target.value)}
                    placeholder="cow ghee, pure ghee, ney, ghee 500ml"
                    className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-2 bg-[#FAF9F6] p-3 border border-burnishedGold/15 rounded">
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-deodharForest border-burnishedGold/30 focus:ring-0 outline-none"
                  />
                  <label htmlFor="featuredCheckbox" className="text-xs font-bold uppercase tracking-wider text-deodharForest flex items-center gap-1 cursor-pointer select-none">
                    <Star className="w-3.5 h-3.5 fill-current text-gheeGold" /> Featured Product (pin to home page slider section)
                  </label>
                </div>

              </div>
            )}

            {/* TAB: Variants */}
            {activeFormTab === "variants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-burnishedGold/10 pb-2">
                  <h3 className="font-serif text-sm font-bold text-deodharForest">Manage Volume SKU Pricing Variants</h3>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-white hover:bg-richCream/10 border border-burnishedGold/35 text-deodharForest text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition flex items-center gap-1 outline-none shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>

                {formErrors.variants && (
                  <p className="text-[10px] font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">{formErrors.variants}</p>
                )}

                <div className="space-y-4">
                  {formVariants.map((v, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 border border-burnishedGold/15 rounded bg-[#FAF9F6]/30 flex flex-col gap-3 relative font-sans"
                    >
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {formVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="text-red-600 hover:text-red-700 font-bold uppercase text-[9px] tracking-wider border border-red-200 hover:bg-red-50/50 px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="text-xs font-bold text-deodharForest uppercase tracking-wider pb-1.5 border-b border-burnishedGold/5 w-fit">
                        Variant #{idx + 1}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-indianInk/60">SKU Code *</label>
                            <button
                              type="button"
                              onClick={() => {
                                const auto = generateSku(formName, v.volume_weight);
                                if (auto) handleVariantChange(idx, "sku", auto);
                              }}
                              className="text-[9px] text-deodharForest hover:underline font-bold uppercase tracking-wider"
                              title="Auto-generate SKU from name and volume"
                            >
                              Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(idx, "sku", e.target.value.toUpperCase())}
                            placeholder="e.g. MBF-RASIPURAM-425ML"
                            className={`w-full text-xs border rounded p-1.5 focus:outline-none focus:border-burnishedGold uppercase font-mono ${formErrors[`variant_${idx}_sku`] ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                          />
                          {formErrors[`variant_${idx}_sku`] && <p className="text-[9px] font-semibold text-red-600">{formErrors[`variant_${idx}_sku`]}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-indianInk/60">Variant Title *</label>
                          <input
                            type="text"
                            value={v.title}
                            onChange={(e) => handleVariantChange(idx, "title", e.target.value)}
                            placeholder="e.g. 500ml Glass Jar"
                            className={`w-full text-xs border rounded p-1.5 focus:outline-none focus:border-burnishedGold ${formErrors[`variant_${idx}_title`] ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                          />
                          {formErrors[`variant_${idx}_title`] && <p className="text-[9px] font-semibold text-red-600">{formErrors[`variant_${idx}_title`]}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-indianInk/60">Volume / Weight *</label>
                          <input
                            type="text"
                            value={v.volume_weight}
                            onChange={(e) => handleVariantChange(idx, "volume_weight", e.target.value)}
                            placeholder="e.g. 500ml or 1 Liter"
                            className={`w-full text-xs border rounded p-1.5 focus:outline-none focus:border-burnishedGold ${formErrors[`variant_${idx}_volume`] ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                          />
                          {formErrors[`variant_${idx}_volume`] && <p className="text-[9px] font-semibold text-red-600">{formErrors[`variant_${idx}_volume`]}</p>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-indianInk/60">Selling Price (INR) *</label>
                          <input
                            type="text"
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                            placeholder="e.g. 450"
                            className={`w-full text-xs border rounded p-1.5 focus:outline-none focus:border-burnishedGold ${formErrors[`variant_${idx}_price`] ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                          />
                          {formErrors[`variant_${idx}_price`] && <p className="text-[9px] font-semibold text-red-600">{formErrors[`variant_${idx}_price`]}</p>}
                        </div>


                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-indianInk/60">Stock Status</label>
                          <select
                            value={v.stock_status}
                            onChange={(e) => handleVariantChange(idx, "stock_status", e.target.value)}
                            className="w-full text-xs border border-burnishedGold/30 rounded p-1.5 focus:outline-none focus:border-burnishedGold bg-white"
                          >
                            <option value="in_stock">In Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`activeVar_${idx}`}
                            checked={v.is_active}
                            onChange={(e) => handleVariantChange(idx, "is_active", e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-deodharForest border-burnishedGold/30 focus:ring-0 outline-none"
                          />
                          <label htmlFor={`activeVar_${idx}`} className="text-[10px] font-bold uppercase tracking-wider text-indianInk/65 cursor-pointer">
                            Variant Active
                          </label>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Sourcing & SEO */}
            {activeFormTab === "seo" && (
              <div className="space-y-6">
                
                {/* Sourcing details section */}
                <div className="bg-[#FAF9F6]/40 p-4 border border-burnishedGold/15 rounded space-y-4">
                  <h3 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-burnishedGold" /> Origin & Sourcing
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Region of Origin *</label>
                      <input
                        type="text"
                        value={formSourcingRegion}
                        onChange={(e) => setFormSourcingRegion(e.target.value)}
                        placeholder="e.g. Tamil Nadu or Kangeyam"
                        className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.sourcing_region ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                      />
                      {formErrors.sourcing_region && <p className="text-[10px] font-semibold text-red-600">{formErrors.sourcing_region}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Sourcing Story Description * (Min 10 characters)</label>
                      <textarea
                        value={formSourcingStory}
                        onChange={(e) => setFormSourcingStory(e.target.value)}
                        placeholder="Detail the region farm story, processing methods, or cow breed info..."
                        rows={3}
                        className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.sourcing_story ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
                      />
                      {formErrors.sourcing_story && <p className="text-[10px] font-semibold text-red-600">{formErrors.sourcing_story}</p>}
                    </div>
                  </div>
                </div>

                {/* SEO Optimization section */}
                <div className="bg-[#FAF9F6]/40 p-4 border border-burnishedGold/15 rounded space-y-4">
                  <h3 className="font-serif text-sm font-bold text-deodharForest flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-burnishedGold" /> SEO Metadata Optimization (optional)
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">SEO Page Meta Title</label>
                      <input
                        type="text"
                        value={formSeoTitle}
                        onChange={(e) => setFormSeoTitle(e.target.value)}
                        placeholder="e.g. Buy Premium Organic Cow Ghee | Bharath Delight Foods"
                        className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">SEO Page Meta Description</label>
                      <textarea
                        value={formSeoDesc}
                        onChange={(e) => setFormSeoDesc(e.target.value)}
                        placeholder="Brief summary matching search results listing card copy..."
                        rows={2}
                        className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">SEO Meta Keywords (comma separated)</label>
                      <input
                        type="text"
                        value={formSeoKeywords}
                        onChange={(e) => setFormSeoKeywords(e.target.value)}
                        placeholder="organic ghee, pure cow ghee, buy cow ghee online"
                        className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Media upload */}
            {activeFormTab === "media" && (
              <div className="space-y-6">
                
                <div className="space-y-1.5">
                  <h3 className="font-serif text-sm font-bold text-deodharForest">Product Images Upload</h3>
                  <p className="text-[10px] text-indianInk/50">Upload JPG, PNG, or WEBP catalog images under 5MB. The first image will be set as the main display thumbnail.</p>
                </div>

                {/* Upload drag box */}
                <div className="border-2 border-dashed border-burnishedGold/20 rounded p-8 bg-[#FAF9F6]/20 text-center flex flex-col items-center justify-center gap-3 relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
                      <p className="text-xs text-indianInk/60">Uploading media asset to cloud storage...</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-burnishedGold/50" />
                      <div className="text-xs">
                        <span className="font-bold text-deodharForest underline">Click to choose image</span> or drag it into this area
                      </div>
                    </>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[10px] font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">{uploadError}</p>
                )}

                {/* Thumbnail lists */}
                {formMediaIds.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-indianInk/50">Attached Media IDs ({formMediaIds.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {formMediaIds.map((id, index) => (
                        <div 
                          key={id} 
                          className="bg-white border border-burnishedGold/15 rounded p-2 flex flex-col items-center gap-2 relative shadow-sm"
                        >
                          <ProductImage mediaId={id} className="w-full h-20 object-cover rounded border" />
                          <div className="text-[8px] font-mono text-indianInk/50 truncate max-w-full">#{id.slice(-6)}</div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaId(id)}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 border border-white hover:bg-red-700 shadow outline-none"
                            title="Remove attachment"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-2 left-2 bg-deodharForest text-richCream text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-burnishedGold/20">Main</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-4 pt-4 border-t border-burnishedGold/10">
              <button
                type="button"
                onClick={() => setView("list")}
                className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-widest border border-burnishedGold/30 hover:bg-richCream/5 text-indianInk rounded transition outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-widest bg-deodharForest text-richCream hover:bg-deodharForest/95 rounded transition shadow-md flex items-center justify-center gap-1 outline-none"
              >
                {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Product Node
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Archive Product Confirmation Modal overlay */}
      {archivingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white border border-burnishedGold/20 rounded shadow-lg p-6 max-w-sm w-full space-y-4 animate-fade-up font-sans">
            <h3 className="font-serif text-lg font-bold text-red-700 flex items-center gap-2">
              <Archive className="w-5 h-5" /> Archive Product Node
            </h3>
            
            <p className="text-xs text-indianInk/70 leading-relaxed">
              Are you sure you want to archive product <strong>{archivingProduct.name}</strong>? 
              This will safely hide it from the storefront catalog but preserve its document ID for old orders database references.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setArchivingProduct(null)}
                className="flex-1 py-2 text-center font-sans text-xs font-bold uppercase tracking-wider border border-burnishedGold/30 hover:bg-richCream/5 text-indianInk rounded transition outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                disabled={updateStatusMutation.isPending}
                className="flex-1 py-2 text-center font-sans text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded transition shadow-sm outline-none"
              >
                {updateStatusMutation.isPending ? "Archiving..." : "Archive Node"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
