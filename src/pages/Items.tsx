import React, { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppData } from "@/contexts/AppDataContext";
import { Item } from "@/types";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Filter,
  Package,
  Edit,
  MoreVertical,
  Upload,
  X,
  ImageIcon,
  Power,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export default function Items() {
  const { items, upsertItem, categories } = useAppData();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nameBn && item.nameBn.includes(searchQuery));

      const matchesCategory =
        selectedCategory === "all" || item.categoryId === selectedCategory;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && item.stockQty <= 10) ||
        (stockFilter === "available" && item.stockQty > 10) ||
        (stockFilter === "out" && item.stockQty === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, searchQuery, selectedCategory, stockFilter]);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const generateSKU = (name: string, categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    const categoryPrefix = category?.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3) || "ITM";
    const namePrefix = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${categoryPrefix}${namePrefix}${random}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, JPEG, WEBP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Store locally for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);

    toast({
      title: 'Image selected',
      description: 'Image will be saved with the item.',
    });

    // Reset file input
    e.target.value = '';
  };

  const removeImage = () => {
    setImagePreview("");
    setSelectedFile(null);
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const isPackaged = formData.get("isPackaged") === "true";
    
    // Use image preview (base64) or empty string
    let imageUrl = imagePreview || undefined;
    
    // TODO: When backend media API is ready, upload file here:
    // if (selectedFile) {
    //   const response = await mediaApi.upload(selectedFile, "item");
    //   imageUrl = response.file_url;
    // }
    
    const baseItem: Item = {
      id: isEditMode && selectedItem ? selectedItem.id : `ITEM-${Date.now()}`,
      name,
      nameBn: (formData.get("nameBn") as string) || undefined,
      sku: isEditMode && selectedItem?.sku ? selectedItem.sku : generateSKU(name, categoryId),
      categoryId,
      price: parseFloat(formData.get("price") as string),
      cost: parseFloat(formData.get("cost") as string),
      stockQty: isPackaged ? parseFloat(formData.get("stockQty") as string) : 9999,
      unit: formData.get("unit") as Item["unit"],
      imageUrl: imageUrl || selectedItem?.imageUrl,
      isActive: isEditMode ? selectedItem?.isActive ?? true : true,
      isPackaged,
      vatRate: formData.get("vatRate") ? parseFloat(formData.get("vatRate") as string) : undefined,
      createdAt: isEditMode && selectedItem ? selectedItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await upsertItem(baseItem, selectedFile);
      setIsAddModalOpen(false);
      setIsEditMode(false);
      setSelectedItem(null);
      setImagePreview("");
      setSelectedFile(null);
      (e.target as HTMLFormElement).reset();
      toast({
        title: isEditMode ? "Item updated!" : "Item created!",
        description: `${baseItem.name} has been ${isEditMode ? "updated" : "added"} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStockBadge = (item: Item) => {
    if (!item.isPackaged) return <Badge variant="outline">Cooked • No stock limit</Badge>;
    if (item.stockQty === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (item.stockQty <= 10) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setStockInput(item.stockQty);
    setIsEditMode(true);
    setIsAddModalOpen(true);
    setImagePreview(item.imageUrl || "");
    setSelectedFile(null);
  };

  const handleToggleActive = async (item: Item) => {
    const updated = { ...item, isActive: !item.isActive };
    await upsertItem(updated, null);
    toast({
      title: updated.isActive ? "Item reactivated" : "Item deactivated",
      description: `${item.name} is now ${updated.isActive ? "active" : "inactive"}.`,
    });
  };

  const handleOpenStock = (item: Item) => {
    if (!item.isPackaged) return; // cooked items do not track stock
    setSelectedItem(item);
    setStockInput(item.stockQty);
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async () => {
    if (!selectedItem) return;
    const updated = { ...selectedItem, stockQty: stockInput };
    await upsertItem(updated);
    setIsStockModalOpen(false);
    setSelectedItem(null);
    toast({ title: "Stock updated", description: `${updated.name}: ${updated.stockQty} ${updated.unit}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Items</h1>
          <p className="text-muted-foreground">আইটেম ও মেনু ম্যানেজমেন্ট • Menu Management</p>
        </div>
        <Button 
          variant="glow" 
          className="w-full sm:w-auto"
          onClick={() => {
            setIsAddModalOpen(true);
            setImagePreview("");
            setSelectedFile(null);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters Bar */}
      <GlassCard className="p-4 animate-fade-in stagger-1">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] bg-muted/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="available">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-8 w-8"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Items Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <GlassCard
              key={item.id}
              hover
              glow="primary"
              className="overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Image */}
              <div className="relative h-40 bg-muted/30">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStockBadge(item)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  {item.nameBn && (
                    <p className="text-sm text-muted-foreground font-bengali">{item.nameBn}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{getCategoryName(item.categoryId)}</span>
                  <span className="text-muted-foreground">SKU: {item.sku}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xl font-display font-bold text-primary">
                    {formatCurrency(item.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.isPackaged ? `Stock: ${item.stockQty} ${item.unit}` : "Cooked • No stock limit"}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(item)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.isPackaged && (
                        <DropdownMenuItem onClick={() => handleOpenStock(item)}>Update Stock</DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleToggleActive(item)}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {item.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="overflow-hidden animate-fade-in stagger-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium">Item</th>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-right p-4 font-medium">Price</th>
                  <th className="text-right p-4 font-medium">Cost</th>
                  <th className="text-right p-4 font-medium">Stock</th>
                  <th className="text-center p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 table-row-hover">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.nameBn && (
                            <p className="text-sm text-muted-foreground font-bengali">{item.nameBn}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{item.sku}</td>
                    <td className="p-4 text-muted-foreground">{getCategoryName(item.categoryId)}</td>
                    <td className="p-4 text-right font-medium text-primary">{formatCurrency(item.price)}</td>
                    <td className="p-4 text-right text-muted-foreground">{formatCurrency(item.cost)}</td>
                    <td className="p-4 text-right">
                      {item.isPackaged ? `${item.stockQty} ${item.unit}` : "Cooked • No stock limit"}
                    </td>
                    <td className="p-4 text-center">{getStockBadge(item)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.isPackaged && (
                              <DropdownMenuItem onClick={() => handleOpenStock(item)}>Update Stock</DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleToggleActive(item)}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              {item.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <GlassCard className="p-12 text-center animate-fade-in">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-display font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            কোনো আইটেম পাওয়া যায়নি • Try adjusting your filters
          </p>
          <Button 
            variant="glow"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>
        </GlassCard>
      )}

      {/* Add Item Modal */}
      <Dialog 
        open={isAddModalOpen} 
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setIsEditMode(false);
            setSelectedItem(null);
            setImagePreview("");
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {isEditMode ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update existing menu item" : "নতুন আইটেম যোগ করুন • Create a new menu item"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItem} className="space-y-4" key={selectedItem?.id || "new-item"}>
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item Image</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden group">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 cursor-pointer"
                  >
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to upload or drag and drop
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Kacchi Biriyani"
                  required
                  defaultValue={selectedItem?.name}
                  className="bg-muted/50"
                />
              </div>

              {/* Bengali Name */}
              <div className="space-y-2">
                <Label htmlFor="nameBn">Bengali Name (Optional)</Label>
                <Input
                  id="nameBn"
                  name="nameBn"
                  placeholder="e.g. কাচ্চি বিরিয়ানি"
                  defaultValue={selectedItem?.nameBn}
                  className="bg-muted/50 font-bengali"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select name="categoryId" required defaultValue={selectedItem?.categoryId}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select name="unit" required defaultValue={selectedItem?.unit}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plate">Plate</SelectItem>
                    <SelectItem value="bowl">Bowl</SelectItem>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="litre">Litre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price (৳) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="350"
                  required
                  defaultValue={selectedItem?.price}
                  className="bg-muted/50"
                />
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price (৳) *</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="180"
                  required
                  defaultValue={selectedItem?.cost}
                  className="bg-muted/50"
                />
              </div>

              {/* VAT Rate */}
              <div className="space-y-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  name="vatRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="5"
                  defaultValue={selectedItem?.vatRate ?? ""}
                  className="bg-muted/50"
                />
              </div>

              {/* Stock Quantity (only for packaged items) */}
              <div className="space-y-2">
                <Label htmlFor="stockQty">Initial Stock</Label>
                <Input
                  id="stockQty"
                  name="stockQty"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={selectedItem?.stockQty ?? 0}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Only required for packaged items
                </p>
              </div>
            </div>

            {/* Is Packaged Switch */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="isPackaged" className="text-base font-medium">
                  Packaged Item
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable stock tracking for packaged items (ice cream, coke, etc.)
                  <br />
                  Disable for cooked items (biryani, curry, etc.) - made instantly
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="hidden"
                  name="isPackaged"
                  id="isPackaged-hidden"
                  value={selectedItem?.isPackaged ? "true" : "false"}
                />
                <Switch
                  id="isPackaged"
                  defaultChecked={selectedItem?.isPackaged ?? false}
                  onCheckedChange={(checked) => {
                    const hiddenInput = document.getElementById("isPackaged-hidden") as HTMLInputElement;
                    if (hiddenInput) {
                      hiddenInput.value = checked ? "true" : "false";
                    }
                    const input = document.getElementById("stockQty") as HTMLInputElement;
                    if (input) {
                      input.required = checked;
                      if (!checked) {
                        input.value = "0";
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditMode(false);
                  setSelectedItem(null);
                  setImagePreview("");
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="glow" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                {isEditMode ? "Save Changes" : "Create Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Update Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Update Stock</DialogTitle>
            <DialogDescription>
              {selectedItem ? selectedItem.name : "Select item"} • Packaged item stock update
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stockUpdate">Stock Quantity</Label>
                <Input
                  id="stockUpdate"
                  type="number"
                  min={0}
                  value={stockInput}
                  onChange={(e) => setStockInput(parseInt(e.target.value || "0"))}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Units: {selectedItem.unit}. Packaged items enforce stock.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleSaveStock}>
                  Save Stock
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
