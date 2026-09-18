import {
  LayoutDashboard, Package, RefreshCcw, Heart, Bell, MapPin, Star, Gift, Settings,
  BarChart3, Beef, Layers, Boxes, ShoppingCart, Users, Tag, MessageSquare, BookOpen,
  Inbox, SlidersHorizontal, ScrollText,
} from "lucide-react";

export const accountNav = [
  { href: "/account", key: "overview", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", key: "orders", label: "Orders", icon: Package },
  { href: "/account/subscriptions", key: "subscriptions", label: "Meat Box", icon: RefreshCcw },
  { href: "/account/wishlist", key: "wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/alerts", key: "alerts", label: "Stock Alerts", icon: Bell },
  { href: "/account/addresses", key: "addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reviews", key: "reviews", label: "My Reviews", icon: Star },
  { href: "/account/rewards", key: "rewards", label: "Rewards", icon: Gift },
  { href: "/account/settings", key: "settings", label: "Profile & Security", icon: Settings },
] as const;

export const adminNav = [
  { href: "/admin", key: "overview", label: "Overview", icon: BarChart3 },
  { href: "/admin/products", key: "products", label: "Products", icon: Beef },
  { href: "/admin/collections", key: "collections", label: "Collections", icon: Layers },
  { href: "/admin/inventory", key: "inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/orders", key: "orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", key: "customers", label: "Customers", icon: Users },
  { href: "/admin/discounts", key: "discounts", label: "Discounts", icon: Tag },
  { href: "/admin/reviews", key: "reviews", label: "Reviews & Q&A", icon: MessageSquare },
  { href: "/admin/recipes", key: "recipes", label: "Recipes", icon: BookOpen },
  { href: "/admin/inquiries", key: "inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/settings", key: "settings", label: "Settings", icon: SlidersHorizontal },
  { href: "/admin/audit-log", key: "auditLog", label: "Audit Log", icon: ScrollText },
] as const;
