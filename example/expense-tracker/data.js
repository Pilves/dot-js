/**
 * Sample expense data for initial state
 */
export const sampleExpenses = [
  {
    id: '1',
    description: 'Groceries',
    amount: 85.50,
    category: 'food',
    paymentMethod: 'card',
    date: '2026-01-20',
    isRecurring: false,
    isPaid: true,
    receiptEmail: ''
  },
  {
    id: '2',
    description: 'Electric bill',
    amount: 120.00,
    category: 'utilities',
    paymentMethod: 'transfer',
    date: '2026-01-15',
    isRecurring: true,
    isPaid: true,
    receiptEmail: ''
  },
  {
    id: '3',
    description: 'Coffee shop',
    amount: 12.75,
    category: 'food',
    paymentMethod: 'card',
    date: '2026-01-22',
    isRecurring: false,
    isPaid: true,
    receiptEmail: ''
  },
  {
    id: '4',
    description: 'Bus pass',
    amount: 50.00,
    category: 'transport',
    paymentMethod: 'card',
    date: '2026-01-01',
    isRecurring: true,
    isPaid: true,
    receiptEmail: ''
  },
  {
    id: '5',
    description: 'Netflix',
    amount: 15.99,
    category: 'entertainment',
    paymentMethod: 'card',
    date: '2026-01-10',
    isRecurring: true,
    isPaid: true,
    receiptEmail: ''
  },
  {
    id: '6',
    description: 'Lunch with team',
    amount: 45.00,
    category: 'food',
    paymentMethod: 'cash',
    date: '2026-01-18',
    isRecurring: false,
    isPaid: false,
    receiptEmail: ''
  },
  {
    id: '7',
    description: 'Phone bill',
    amount: 65.00,
    category: 'utilities',
    paymentMethod: 'transfer',
    date: '2026-01-05',
    isRecurring: true,
    isPaid: true,
    receiptEmail: ''
  },
  {
    id: '8',
    description: 'Book purchase',
    amount: 24.99,
    category: 'shopping',
    paymentMethod: 'card',
    date: '2026-01-12',
    isRecurring: false,
    isPaid: true,
    receiptEmail: ''
  }
]

export const categories = [
  { id: 'food', label: 'Food & Dining', color: '#e74c3c' },
  { id: 'utilities', label: 'Utilities', color: '#3498db' },
  { id: 'transport', label: 'Transport', color: '#2ecc71' },
  { id: 'entertainment', label: 'Entertainment', color: '#9b59b6' },
  { id: 'shopping', label: 'Shopping', color: '#f39c12' },
  { id: 'health', label: 'Health', color: '#1abc9c' },
  { id: 'other', label: 'Other', color: '#95a5a6' }
]

export const paymentMethods = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Transfer' }
]
