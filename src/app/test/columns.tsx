// columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MarksDBType } from "@/zod";

// Base interface that all data types will extend
export interface BaseTableData {
  id: string;
  name: string;
}

// Specific interfaces for each table type
export interface UserData extends BaseTableData {
  email: string;
  status: string;
  role: string;
  department?: string;
}

export interface ProductData extends BaseTableData {
  price: number;
  category: string;
  stock: number;
  supplier?: string;
}

export interface OrderData extends BaseTableData {
  customer: string;
  total: number;
  status: string;
  date: string;
}

export interface ReportData extends BaseTableData {
  type: string;
  generatedBy: string;
  status: string;
}

// Column definitions for Users (5 columns)
export const userColumns: ColumnDef<UserData>[] = [
  {
    accessorKey: "name",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email Address",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "Active" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];

// Column definitions for Products (6 columns)
export const productColumns: ColumnDef<ProductData>[] = [
  {
    accessorKey: "name",
    header: "Product Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return `$${price.toFixed(2)}`;
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <Badge variant={stock > 10 ? "default" : "destructive"}>
          {stock} units
        </Badge>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
  },
  {
    accessorKey: "status",
    header: "Availability",
    cell: ({ row }) => {
      const stock = row.original.stock;
      const status = stock > 0 ? "In Stock" : "Out of Stock";
      return (
        <Badge variant={stock > 0 ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];

// Column definitions for Orders (4 columns)
export const orderColumns: ColumnDef<OrderData>[] = [
  {
    accessorKey: "name",
    header: "Order ID",
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    accessorKey: "total",
    header: "Total Amount",
    cell: ({ row }) => {
      const total = row.getValue("total") as number;
      return `$${total.toFixed(2)}`;
    },
  },
  {
    accessorKey: "status",
    header: "Order Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = status === "Delivered" ? "default" : 
                    status === "Shipped" ? "outline" : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
];

// Column definitions for Reports (3 columns)
export const reportColumns: ColumnDef<ReportData>[] = [
  {
    accessorKey: "name",
    header: "Report Name",
  },
  {
    accessorKey: "type",
    header: "Report Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "Generated" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];

// Column definitions for Marks 
export const marksColumns: ColumnDef<MarksDBType>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "type",
    header: "Report Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "Generated" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];
