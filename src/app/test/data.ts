// data.ts
import { UserData, ProductData, OrderData, ReportData } from "./columns";

export const usersData: UserData[] = [
  { 
    id: "1", 
    name: "John Doe", 
    email: "john@example.com", 
    status: "Active", 
    role: "Admin",
    department: "Engineering"
  },
  { 
    id: "2", 
    name: "Jane Smith", 
    email: "jane@example.com", 
    status: "Inactive", 
    role: "User",
    department: "Marketing"
  },
  { 
    id: "3", 
    name: "Bob Johnson", 
    email: "bob@example.com", 
    status: "Active", 
    role: "Manager",
    department: "Sales"
  },
];

export const productsData: ProductData[] = [
  { 
    id: "1", 
    name: "MacBook Pro", 
    price: 1299.99, 
    category: "Electronics", 
    stock: 15,
    supplier: "Apple Inc."
  },
  { 
    id: "2", 
    name: "Wireless Mouse", 
    price: 29.99, 
    category: "Accessories", 
    stock: 5,
    supplier: "Logitech"
  },
  { 
    id: "3", 
    name: "USB-C Hub", 
    price: 79.99, 
    category: "Accessories", 
    stock: 0,
    supplier: "Anker"
  },
];

export const ordersData: OrderData[] = [
  { 
    id: "1", 
    name: "ORD-001", 
    customer: "Alice Cooper", 
    total: 1329.98, 
    status: "Delivered",
    date: "2025-06-08"
  },
  { 
    id: "2", 
    name: "ORD-002", 
    customer: "Charlie Brown", 
    total: 109.98, 
    status: "Shipped",
    date: "2025-06-09"
  },
];

export const reportsData: ReportData[] = [
  { 
    id: "1", 
    name: "Q2 Financial Report", 
    type: "Financial", 
    generatedBy: "Finance Team", 
    status: "Generated"
  },
  { 
    id: "2", 
    name: "Weekly Sales Summary", 
    type: "Sales", 
    generatedBy: "Sales Team", 
    status: "Pending"
  },
];
