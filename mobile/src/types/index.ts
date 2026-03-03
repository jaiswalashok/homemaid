export interface Expense {
  id: string;
  vendor: string;
  vendorFullName?: string;
  type: string;
  amount: number;
  emoji?: string;
  discount?: number;
  displayDate?: string;
  date: string;
  address?: string;
  paymentMethod: string;
  items?: { name: string; price: number }[];
  source?: 'manual' | 'receipt' | 'telegram';
  userId: string;
  createdAt?: any;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  userId: string;
  createdAt?: any;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  imageUrl?: string;
  description?: string;
  cuisine?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  userId: string;
  createdAt?: any;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  isDaily: boolean;
  userId: string;
  createdAt?: any;
}

export interface DailyTaskTemplate {
  id: string;
  title: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  daysOfWeek?: number[];
  userId: string;
  createdAt?: any;
}
