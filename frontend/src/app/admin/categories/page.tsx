"use client";

import React, { useState } from "react";
import { useMe } from "@/hooks/use-auth";
import { 
  useAdminCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useUpdateCategoryStatus
} from "@/hooks/use-categories";
import { useMediaAsset } from "@/hooks/use-media";
import mediaService from "@/services/media-service";
import { 
  Plus, 
  Search, 
  Edit2, 
  Archive, 
  ChevronDown, 
  ChevronRight, 
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  X,
  FolderTree,
  List,
  ArrowRight,
  GitFork
} from "lucide-react";
import { Category } from "@/types";

interface TreeNode extends Category {
  children: TreeNode[];
}

function CategoryImage({ mediaId, className }: { mediaId?: string; className?: string }) {
  const isUrl = mediaId && (mediaId.startsWith("http://") || mediaId.startsWith("https://") || mediaId.startsWith("/"));
  const { data: mediaRes, isError } = useMediaAsset(isUrl ? "" : (mediaId || ""), { enabled: !!mediaId && !isUrl });
  const url = isUrl ? mediaId : ((!isError && mediaRes?.success && mediaRes?.data?.public_url) ? mediaRes.data.public_url : "/images/product-placeholder.jpg");
  
  if (!mediaId) {
    return (
      <div className={`${className || "w-8 h-8"} bg-richCream/20 border border-burnishedGold/10 rounded flex items-center justify-center text-burnishedGold/40`}>
        <ImageIcon className="w-4 h-4" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url || "/images/product-placeholder.jpg"}
      alt="Category preview"
      className={className || "w-8 h-8 object-cover rounded border border-burnishedGold/15"}
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/images/product-placeholder.jpg";
      }}
    />
  );
}

export default function AdminCategoriesPage() {
  const { data: meData } = useMe();
  const isAdmin = meData?.data?.role === "admin";

  const { data: categoriesRes, isPending: loadingCategories, error: categoriesError, refetch: refetchCategories } = useAdminCategories();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const updateStatusMutation = useUpdateCategoryStatus();

  // Search, Filtering & View State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // View States: 'list' | 'create' | 'edit'
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formImageId, setFormImageId] = useState<string | null>(null);
  const [formIsActive, setFormIsActive] = useState(true);

  // Form validation/general errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formGeneralError, setFormGeneralError] = useState("");

  // Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Cascade Delete Warning State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const toggleNodeExpand = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartCreate = (parentId: string = "") => {
    if (!isAdmin) return;
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormParentId(parentId);
    setFormSortOrder(0);
    setFormImageId(null);
    setFormIsActive(true);
    setFormErrors({});
    setFormGeneralError("");
    setView("create");
  };

  const handleStartEdit = (category: Category) => {
    if (!isAdmin) return;
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description || "");
    setFormParentId(category.parent_id || "");
    setFormSortOrder(category.sort_order);
    setFormImageId(category.image_id || null);
    setFormIsActive(category.is_active);
    setFormErrors({});
    setFormGeneralError("");
    setView("edit");
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
      // TODO: Replace with asset_type "category_image" once backend media rules support category images.
      const uploadedMedia = await mediaService.uploadFile(file, "product_image");
      setFormImageId(uploadedMedia.id);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload category image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormImageId(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Category Name is required.";
    if (formSlug && !/^[a-z0-9-]+$/.test(formSlug)) {
      errors.slug = "Slug must contain only lower-case letters, numbers, and hyphens.";
    }
    
    // Prevent selecting itself as parent
    if (view === "edit" && editingCategory && formParentId === editingCategory.id) {
      errors.parent_id = "A category cannot be its own parent.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!validateForm()) return;

    setFormGeneralError("");
    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim() || undefined,
      parent_id: formParentId || null,
      sort_order: Number(formSortOrder),
      image_id: formImageId || null,
      is_active: formIsActive
    };

    try {
      if (view === "create") {
        await createCategoryMutation.mutateAsync(payload);
      } else if (view === "edit" && editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, payload });
      }
      refetchCategories();
      setView("list");
    } catch (err: any) {
      setFormGeneralError(err.response?.data?.message || err.message || "Failed to save category parameters.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin || !deletingCategory) return;
    try {
      // Cascading soft-delete triggered via backend API
      await deleteCategoryMutation.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
      refetchCategories();
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const handleStatusToggle = async (category: Category, is_active: boolean) => {
    if (!isAdmin) return;
    try {
      await updateStatusMutation.mutateAsync({ id: category.id, is_active });
      refetchCategories();
    } catch (err: any) {
      alert("Failed to update category status: " + err.message);
    }
  };

  const categories = categoriesRes?.data || [];

  // Helper to build recursive Tree hierarchy from flat list
  const buildTree = (list: Category[]): TreeNode[] => {
    const map: Record<string, TreeNode> = {};
    const roots: TreeNode[] = [];
    
    list.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });
    
    list.forEach(item => {
      const node = map[item.id];
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });
    
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.sort_order - b.sort_order);
      nodes.forEach(node => sortNodes(node.children));
    };
    
    roots.sort((a, b) => a.sort_order - b.sort_order);
    sortNodes(roots);
    
    return roots;
  };

  // Build tree using all loaded categories
  const fullTree = buildTree(categories);

  // Recursive Tree Filtering for Search & Status
  const filterTreeNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .map(node => {
        const matchesSearch = !searchQuery.trim() || 
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          node.slug.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || 
          (statusFilter === "active" && node.is_active) || 
          (statusFilter === "inactive" && !node.is_active);

        const filteredChildren = filterTreeNodes(node.children);
        
        if ((matchesSearch && matchesStatus) || filteredChildren.length > 0) {
          // If a child matches search, parent is automatically kept to maintain hierarchy structure
          return {
            ...node,
            children: filteredChildren
          };
        }
        return null;
      })
      .filter((n): n is TreeNode => n !== null);
  };

  const filteredTree = filterTreeNodes(fullTree);

  // Flatten the filtered tree recursively to render rows in Table correctly with level indentation
  const flattenTreeRows = (nodes: TreeNode[], depth = 0): TreeNode[] => {
    const result: TreeNode[] = [];
    const traverse = (list: TreeNode[]) => {
      list.forEach(node => {
        result.push(node);
        const isNodeExpanded = expandedNodes[node.id] !== false; // default to expanded if not modified
        if (node.children && node.children.length > 0 && isNodeExpanded) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  // Filter Flat List categories directly
  const filteredFlatList = categories.filter(c => {
    const matchesSearch = !searchQuery.trim() || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && c.is_active) || 
      (statusFilter === "inactive" && !c.is_active);

    return matchesSearch && matchesStatus;
  });

  const getParentName = (parentId?: string) => {
    if (!parentId) return "None (Root)";
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : "Unknown Parent";
  };

  if (loadingCategories) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-burnishedGold" />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Failed to fetch categories. Please verify connection and administrator authorization.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-burnishedGold/10 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-deodharForest">
            Category Taxonomy Management
          </h1>
          <p className="text-xs sm:text-sm text-indianInk/60 mt-1">
            Group, classify, and sort products in hierarchical navigation tree lines.
          </p>
        </div>
        {view === "list" && isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartCreate("")}
              className="bg-deodharForest hover:bg-deodharForest/95 text-richCream font-bold uppercase tracking-widest text-xs px-4 py-2.5 rounded transition shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Root Category
            </button>
          </div>
        )}
      </div>

      {view === "list" ? (
        <div className="space-y-4">
          
          {/* Quick Filters Top Menu & View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF9F6] p-2 border border-burnishedGold/15 rounded">
            
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                  statusFilter === "all"
                    ? "bg-deodharForest text-richCream border-transparent"
                    : "bg-white text-indianInk/70 border-burnishedGold/20 hover:border-burnishedGold/40"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                  statusFilter === "active"
                    ? "bg-green-700 text-white border-transparent"
                    : "bg-white text-green-700/80 border-green-200 hover:border-green-300"
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition ${
                  statusFilter === "inactive"
                    ? "bg-amber-700 text-white border-transparent"
                    : "bg-white text-amber-700/80 border-amber-200 hover:border-amber-300"
                }`}
              >
                Inactive Only
              </button>
            </div>

            {/* View Mode toggler */}
            <div className="flex items-center border border-burnishedGold/25 rounded bg-white overflow-hidden p-0.5 self-start sm:self-auto shadow-sm">
              <button
                onClick={() => setViewMode("tree")}
                className={`p-1.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition ${
                  viewMode === "tree"
                    ? "bg-deodharForest text-richCream"
                    : "text-indianInk/60 hover:text-indianInk"
                }`}
                title="Hierarchical Tree View"
              >
                <FolderTree className="w-3.5 h-3.5" /> Tree View
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition ${
                  viewMode === "list"
                    ? "bg-deodharForest text-richCream"
                    : "text-indianInk/60 hover:text-indianInk"
                }`}
                title="Flat Table List"
              >
                <List className="w-3.5 h-3.5" /> Flat List
              </button>
            </div>

          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indianInk/40">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories by Name or Slug..."
              className="w-full text-xs border border-burnishedGold/30 rounded pl-9 pr-3 py-2.5 focus:border-burnishedGold focus:outline-none placeholder-indianInk/40 bg-white"
            />
          </div>

          {/* Categories Table */}
          <div className="bg-white border border-burnishedGold/15 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-sans text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-burnishedGold/10 text-indianInk/60">
                    <th className="px-4 py-3 font-bold uppercase tracking-wider w-16">Image</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Category Hierarchy</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Slug</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Parent Node</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Sort Order</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burnishedGold/10">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-indianInk/40 italic">
                        No categories have been created yet.
                      </td>
                    </tr>
                  ) : viewMode === "tree" && filteredTree.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-indianInk/40 italic">
                        No categories match the active filter or search keywords.
                      </td>
                    </tr>
                  ) : viewMode === "list" && filteredFlatList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-indianInk/40 italic">
                        No categories match the active filter or search keywords.
                      </td>
                    </tr>
                  ) : (
                    (viewMode === "tree" ? flattenTreeRows(filteredTree) : (filteredFlatList as TreeNode[])).map((node) => {
                      const hasChildren = node.children && node.children.length > 0;
                      const isExpanded = expandedNodes[node.id] !== false; // default expanded
                      const indentLevel = viewMode === "tree" ? node.level : 0;
                      
                      return (
                        <tr key={node.id} className="hover:bg-richCream/5 transition-colors">
                          <td className="px-4 py-2.5">
                            <CategoryImage mediaId={node.image_id} />
                          </td>
                          <td className="px-4 py-2.5">
                            <div 
                              className="flex items-center gap-1.5"
                              style={{ paddingLeft: `${indentLevel * 24}px` }}
                            >
                              {viewMode === "tree" && hasChildren ? (
                                <button 
                                  onClick={() => toggleNodeExpand(node.id)}
                                  className="p-0.5 hover:bg-richCream/20 rounded text-burnishedGold outline-none"
                                >
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                              ) : viewMode === "tree" ? (
                                <span className="w-4.5 h-4.5 shrink-0 block" /> // spacing placeholder
                              ) : null}
                              
                              <span className="font-bold text-deodharForest">{node.name}</span>
                              
                              {hasChildren && (
                                <span className="text-[9px] text-indianInk/40 font-semibold uppercase tracking-wider">
                                  ({node.children.length} child{node.children.length !== 1 && "ren"})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-indianInk/70 font-mono text-[10px]">
                            {node.slug}
                          </td>
                          <td className="px-4 py-2.5 text-indianInk/60">
                            {getParentName(node.parent_id)}
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            {node.sort_order}
                          </td>
                          <td className="px-4 py-2.5 text-indianInk/50">
                            Level {node.level}
                          </td>
                          <td className="px-4 py-2.5">
                            {node.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-100 text-green-800 border border-green-200">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {isAdmin ? (
                              <div className="flex justify-end items-center gap-1.5">
                                
                                {viewMode === "tree" && (
                                  <button
                                    onClick={() => handleStartCreate(node.id)}
                                    className="bg-white hover:bg-richCream/10 border border-burnishedGold/25 text-burnishedGold font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition flex items-center gap-0.5 shadow-sm"
                                    title="Create Child Category"
                                  >
                                    <GitFork className="w-3 h-3 text-burnishedGold" /> Add Child
                                  </button>
                                )}

                                <button
                                  onClick={() => handleStartEdit(node)}
                                  className="bg-deodharForest hover:bg-deodharForest/95 text-richCream font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition flex items-center gap-1 shadow-sm"
                                  title="Edit Parameters"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>

                                {node.is_active ? (
                                  <button
                                    onClick={() => handleStatusToggle(node, false)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition"
                                    title="Set Inactive"
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusToggle(node, true)}
                                    className="bg-green-700 hover:bg-green-800 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition"
                                    title="Set Active"
                                  >
                                    Activate
                                  </button>
                                )}

                                <button
                                  onClick={() => setDeletingCategory(node)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition flex items-center gap-1"
                                  title="Soft Delete Branch"
                                >
                                  <Archive className="w-3 h-3" /> Archive
                                </button>

                              </div>
                            ) : (
                              <span className="text-[10px] text-indianInk/40 italic">Read-only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        
        /* CREATE / EDIT FORM VIEW */
        <div className="bg-white border border-burnishedGold/15 rounded shadow-sm overflow-hidden font-sans max-w-xl mx-auto">
          
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-burnishedGold/10 bg-[#FAF9F6] flex justify-between items-center">
            <h2 className="font-serif text-base font-bold text-deodharForest">
              {view === "create" ? "Create Category Node" : `Edit Category: ${editingCategory?.name}`}
            </h2>
            <button
              onClick={() => setView("list")}
              className="text-indianInk/60 hover:text-indianInk text-xs uppercase font-bold tracking-widest flex items-center gap-1 outline-none"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
            
            {formGeneralError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formGeneralError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Category Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Organic Ghee"
                className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.name ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
              />
              {formErrors.name && <p className="text-[10px] font-semibold text-red-600">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Slug (URL-safe, generated if empty)</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. organic-ghee"
                className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.slug ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
              />
              {formErrors.slug && <p className="text-[10px] font-semibold text-red-600">{formErrors.slug}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Parent Category</label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className={`w-full text-xs border rounded p-2 focus:outline-none focus:border-burnishedGold ${formErrors.parent_id ? "border-red-500 bg-red-50/10" : "border-burnishedGold/30"}`}
              >
                <option value="">None (Top-Level Root Category)</option>
                {categories
                  .filter(c => {
                    // Prevent selecting itself as parent
                    if (view === "edit" && editingCategory) {
                      return c.id !== editingCategory.id;
                    }
                    return true;
                  })
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {"— ".repeat(c.level)}{c.name}
                    </option>
                  ))}
              </select>
              {formErrors.parent_id && <p className="text-[10px] font-semibold text-red-600">{formErrors.parent_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Sort Order</label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  placeholder="e.g. 0"
                  className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="activeCheckbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-deodharForest border-burnishedGold/30 focus:ring-0 outline-none cursor-pointer"
                />
                <label htmlFor="activeCheckbox" className="text-xs font-bold uppercase tracking-wider text-indianInk/60 cursor-pointer select-none">
                  Active Status
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indianInk/60">Description details</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description of this product classification group..."
                rows={3}
                className="w-full text-xs border border-burnishedGold/30 rounded p-2 focus:outline-none focus:border-burnishedGold"
              />
            </div>

            {/* Image upload section */}
            <div className="space-y-2 border border-burnishedGold/10 rounded p-4 bg-[#FAF9F6]/20">
              <label className="text-[10px] font-bold uppercase tracking-wider text-deodharForest block">Category Image Icon (optional)</label>
              
              {formImageId ? (
                <div className="flex items-center gap-4 bg-white p-2 border border-burnishedGold/15 rounded">
                  <CategoryImage mediaId={formImageId} className="w-16 h-16 object-cover rounded border" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-indianInk/50">Media ID: #{formImageId.slice(-8)}</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-red-50 text-red-700 hover:bg-red-100 font-bold uppercase text-[9px] px-2 py-1 rounded border border-red-200 w-fit outline-none"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-burnishedGold/20 rounded p-6 text-center flex flex-col items-center justify-center gap-2 bg-white">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploadingImage ? (
                    <div className="flex items-center gap-1.5 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-burnishedGold" />
                      <span className="text-xs text-indianInk/60">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-burnishedGold/50" />
                      <span className="text-[10px] font-bold text-deodharForest underline">Upload Image File</span>
                      <span className="text-[8px] text-indianInk/40">PNG, JPG, or WEBP under 5MB</span>
                    </>
                  )}
                </div>
              )}

              {uploadError && (
                <p className="text-[10px] font-semibold text-red-600 mt-1">{uploadError}</p>
              )}
            </div>

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
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="flex-1 py-2.5 text-center font-sans text-xs font-bold uppercase tracking-widest bg-deodharForest text-richCream hover:bg-deodharForest/95 rounded transition shadow-md flex items-center justify-center gap-1 outline-none"
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Category Node
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Soft Cascade Delete Warning Modal overlay */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white border border-burnishedGold/20 rounded shadow-lg p-6 max-w-sm w-full space-y-4 animate-fade-up font-sans">
            <h3 className="font-serif text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Archive Category
            </h3>
            
            <p className="text-xs text-indianInk/70 leading-relaxed">
              Are you sure you want to archive category <strong>{deletingCategory.name}</strong>?
            </p>

            <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs leading-relaxed font-semibold">
              ⚠️ Deleting this category will also hide all child categories.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-2 text-center font-sans text-xs font-bold uppercase tracking-wider border border-burnishedGold/30 hover:bg-richCream/5 text-indianInk rounded transition outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteCategoryMutation.isPending}
                className="flex-1 py-2 text-center font-sans text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded transition shadow-sm outline-none"
              >
                {deleteCategoryMutation.isPending ? "Archiving..." : "Archive Node"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
