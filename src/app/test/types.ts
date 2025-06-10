import { TableData } from "@/lib/types";

// data.ts
export const usersData: TableData[] = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "Active", role: "Admin" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", status: "Inactive", role: "User" },
];

export const productsData: TableData[] = [
  { id: "1", name: "Laptop", email: "tech@store.com", status: "In Stock", role: "Electronics" },
  { id: "2", name: "Mouse", email: "accessories@store.com", status: "Low Stock", role: "Accessories" },
  { id: "3", name: "Mouse", email: "accessories@store.com", status: "Low Stock", role: "Accessories" },
];

export const ordersData: TableData[] = [
  { id: "1", name: "Order #001", email: "customer1@example.com", status: "Shipped", role: "Premium" },
  { id: "2", name: "Order #002", email: "customer2@example.com", status: "Processing", role: "Standard" },
];

export const reportsData: TableData[] = [
  { id: "1", name: "Monthly Report", email: "admin@company.com", status: "Generated", role: "Financial" },
  { id: "2", name: "Weekly Summary", email: "manager@company.com", status: "Pending", role: "Operational" },
];
