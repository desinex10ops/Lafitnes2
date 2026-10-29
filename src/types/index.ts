// Tipos principais do Sistema PDV Fitness Profissional

export type UserRole = 'ADMINISTRADOR' | 'GERENTE' | 'OPERADOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  maxDiscountPercent: number; // Limite de desconto permitido
  canCancelSales: boolean;
  canAdjustStock: boolean;
  canRestoreBackup: boolean;
  createdAt: string;
  passwordHash?: string; // Simulado para local/auth
}

export interface StoreSettings {
  storeName: string;
  tradingName: string; // Nome fantasia
  cnpj: string;
  ie: string; // Inscrição Estadual
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  receiptFooterMessage: string;
  printerType: '80mm' | '58mm' | 'A4';
  defaultMarkupPercent: number;
  maxDiscountWithoutApproval: number;
  enableBlindInventory: boolean;
  categories: string[];
  sizes: string[];
  colors: string[];
  expenseCategories: string[];
  autoBackupOnCashClose: boolean; // Opção 1: Backup automático ao fechar o caixa
  autoBackupCloud: boolean; // Opção 2: Backup automático em nuvem
  autoBackupCloudHour: string; // Ex: '23:59'
  lastCloudBackupAt?: string;
  lastCloseRegisterBackupAt?: string;
}

export interface AutoBackupRecord {
  id: string;
  type: 'FECHAMENTO_CAIXA' | 'NUVEM_DIARIO' | 'MANUAL';
  filename: string;
  createdAt: string;
  operatorName: string;
  sizeBytes: number;
  dataJson: string;
  status: 'LOCAL_SALVO' | 'SINCRONIZADO_NUVEM';
}

export interface ProductVariation {
  id: string;
  productId: string;
  sku: string; // Código de referência interna
  barcode: string; // Código de barras
  color: string;
  size: string;
  stock: number;
  minStock: number;
  costPrice?: number; // Custo específico se diferir do produto
  sellingPrice?: number; // Preço específico se diferir
  active: boolean;
}

export interface Product {
  id: string;
  code: number; // Código interno sequencial automático
  barcode: string; // Código de barras padrão
  name: string;
  reference: string; // Ref. do fabricante
  category: string;
  brand: string;
  description: string;
  unit: string; // UN, PC, CJ, etc.
  costPrice: number;
  sellingPrice: number;
  markupPercent: number;
  stock: number; // Saldo consolidado das variações
  minStock: number;
  supplierId?: string;
  supplierName?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  hasVariations: boolean;
  imageUrl?: string; // Foto ou imagem do produto
  variations: ProductVariation[];
}

export type StockMovementType = 'ENTRADA_COMPRA' | 'SAIDA_VENDA' | 'AJUSTE_MANUAL' | 'AJUSTE_INVENTARIO' | 'DEVOLUCAO_CLIENTE' | 'DEVOLUCAO_FORNECEDOR';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  variationId?: string;
  color?: string;
  size?: string;
  type: StockMovementType;
  quantity: number; // positivo para entrada, negativo para saída
  previousStock: number;
  newStock: number;
  reason?: string;
  documentNumber?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO' | 'A_PRAZO' | 'DUPLICATA';

export interface SalePayment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  cardBrand?: string;
  installments?: number;
  receivedAmount?: number; // Para dinheiro (calcular troco)
  changeAmount?: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  variationId?: string;
  color?: string;
  size?: string;
  barcode: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
}

export type SaleStatus = 'CONCLUIDA' | 'CANCELADA' | 'SUSPENSA';

export interface Sale {
  id: string;
  saleNumber: number; // Número sequencial único
  registerSessionId: string; // Id da sessão do caixa
  operatorId: string;
  operatorName: string;
  customerId?: string;
  customerName?: string;
  customerDoc?: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  totalCost: number;
  status: SaleStatus;
  items: SaleItem[];
  payments: SalePayment[];
  notes?: string;
  cancelReason?: string;
  canceledBy?: string;
  canceledAt?: string;
  createdAt: string;
}

export type DuplicataStatus = 'ABERTA' | 'PARCIAL' | 'PAGA' | 'VENCIDA' | 'CANCELADA';

export interface DuplicataParcela {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO';
  paidAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface Duplicata {
  id: string;
  documentNumber: string; // Ex: DUP-1002
  saleId: string;
  saleNumber: number;
  customerId: string;
  customerName: string;
  customerDoc: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  installmentsCount: number;
  installments: DuplicataParcela[];
  status: DuplicataStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: number;
  name: string;
  document: string; // CPF ou CNPJ
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  creditLimit: number;
  creditUsed: number;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: number;
  corporateName: string; // Razão Social
  tradeName: string; // Nome Fantasia
  document: string; // CNPJ ou CPF
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  paymentTerms: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export type RegisterStatus = 'ABERTO' | 'FECHADO';

export interface RegisterMovement {
  id: string;
  registerSessionId: string;
  type: 'SUPRIMENTO' | 'SANGRIA' | 'DESPESA' | 'RECEBIMENTO_DUPLICATA' | 'VENDA';
  amount: number;
  method: PaymentMethod;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface RegisterSession {
  id: string;
  registerNumber: number;
  operatorId: string;
  operatorName: string;
  openedAt: string;
  closedAt?: string;
  status: RegisterStatus;
  initialCash: number; // Fundo de troco inicial
  
  // Totais apurados pelo sistema no fechamento
  totalCashSales: number;
  totalPixSales: number;
  totalDebitSales: number;
  totalCreditSales: number;
  totalDuplicataSales: number;
  totalCashInflows: number; // Suprimentos + Recebimentos de duplicata em dinheiro
  totalCashOutflows: number; // Sangrias + Despesas do caixa
  expectedCash: number; // Saldo em dinheiro esperado no gaveteiro
  
  // Conferência física do operador
  countedCash?: number;
  cashDifference?: number; // countedCash - expectedCash (quebra/sobra)
  notes?: string;
  movements: RegisterMovement[];
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  dueDate?: string;
  paidFromRegister: boolean;
  registerSessionId?: string;
  paymentMethod?: PaymentMethod;
  isPaid: boolean;
  paidAt?: string;
  responsibleName: string;
  notes?: string;
  createdAt: string;
}

export type BillStatus = 'PENDENTE' | 'PARCIAL' | 'PAGA' | 'VENCIDA' | 'CANCELADA';

export interface BillToPay {
  id: string;
  documentNumber: string;
  description: string;
  supplierId?: string;
  supplierName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: BillStatus;
  notes?: string;
  category?: string;
  createdAt: string;
  history: {
    id: string;
    paidAmount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    operatorName: string;
  }[];
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  variationId?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: number;
  invoiceNumber: string; // Número da NF
  accessKey?: string; // Chave de 44 dígitos da NFe
  supplierId: string;
  supplierName: string;
  issueDate: string;
  entryDate: string;
  subtotal: number;
  discountAmount: number;
  freightAmount: number;
  otherExpenses: number;
  totalAmount: number;
  paymentTerms: string;
  installmentsCount: number;
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
  status: 'CONFIRMADA' | 'CANCELADA';
}

export type InventoryStatus = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  variationId?: string;
  color?: string;
  size?: string;
  barcode: string;
  systemStock: number;
  countedStock: number;
  difference: number;
  isCounted: boolean;
  notes?: string;
}

export interface Inventory {
  id: string;
  inventoryNumber: number;
  title: string;
  filterCategory?: string;
  isBlindCount: boolean; // Se oculta a quantidade do sistema na contagem
  status: InventoryStatus;
  startedAt: string;
  finishedAt?: string;
  responsibleName: string;
  totalItems: number;
  itemsWithDivergence: number;
  items: InventoryItem[];
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}
