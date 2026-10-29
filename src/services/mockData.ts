import { Product, Supplier, Customer, StoreSettings, User, RegisterSession, Duplicata, BillToPay, Expense } from '../types';

export const initialSettings: StoreSettings = {
  storeName: 'LA FITNESS MODA ESPORTIVA',
  tradingName: 'LA FITNESS',
  cnpj: '',
  ie: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  receiptFooterMessage: 'Obrigado pela preferência! Trocas em até 30 dias com etiqueta fixada.',
  printerType: '80mm',
  defaultMarkupPercent: 100,
  maxDiscountWithoutApproval: 10,
  enableBlindInventory: false,
  categories: ['Leggings', 'Tops', 'Shorts', 'Regatas', 'Conjuntos', 'Macacões', 'Acessórios'],
  sizes: ['PP', 'P', 'M', 'G', 'GG', 'U'],
  colors: ['Preto', 'Branco', 'Cinza Mescla', 'Azul Marinho', 'Vinho', 'Rosa', 'Verde Militar'],
  expenseCategories: [
    'Aluguel do Ponto',
    'Energia Elétrica',
    'Água e Saneamento',
    'Internet e Telefonia',
    'Salários e Comissões',
    'Fornecedores Têxteis',
    'Marketing e Redes',
    'Embalagens e Sacolas',
    'Manutenção e Limpeza'
  ],
  autoBackupOnCashClose: true,
  autoBackupCloud: true,
  autoBackupCloudHour: '23:59',
  lastCloudBackupAt: '',
  lastCloseRegisterBackupAt: ''
};

export const initialUsers: User[] = [
  {
    id: 'user-admin-1',
    name: 'Layne (Administradora)',
    email: 'admin@lafitness.com.br',
    role: 'ADMINISTRADOR',
    active: true,
    maxDiscountPercent: 100,
    canCancelSales: true,
    canAdjustStock: true,
    canRestoreBackup: true,
    createdAt: new Date().toISOString(),
    passwordHash: 'admin123'
  },
  {
    id: 'user-gerente-1',
    name: 'Gerente da Loja',
    email: 'gerente@lafitness.com.br',
    role: 'GERENTE',
    active: true,
    maxDiscountPercent: 25,
    canCancelSales: true,
    canAdjustStock: true,
    canRestoreBackup: false,
    createdAt: new Date().toISOString(),
    passwordHash: 'gerente123'
  },
  {
    id: 'user-operador-1',
    name: 'Operador de Caixa',
    email: 'caixa@lafitness.com.br',
    role: 'OPERADOR',
    active: true,
    maxDiscountPercent: 10,
    canCancelSales: false,
    canAdjustStock: false,
    canRestoreBackup: false,
    createdAt: new Date().toISOString(),
    passwordHash: 'caixa123'
  }
];

export const initialSuppliers: Supplier[] = [];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    code: 1,
    name: 'CONSUMIDOR PADRÃO BALCÃO',
    document: '000.000.000-00',
    phone: '',
    email: '',
    address: 'Atendimento Local',
    city: '',
    state: '',
    creditLimit: 0,
    creditUsed: 0,
    active: true,
    notes: 'Cliente padrão para vendas rápidas de balcão sem cadastro prévio',
    createdAt: new Date().toISOString()
  }
];

export const initialProducts: Product[] = [];

export const initialActiveRegister: RegisterSession | null = null;

export const initialDuplicatas: Duplicata[] = [];

export const initialBillsToPay: BillToPay[] = [];

export const initialExpenses: Expense[] = [];
