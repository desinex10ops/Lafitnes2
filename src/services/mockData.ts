import { Product, Supplier, Customer, StoreSettings, User, RegisterSession, Duplicata, BillToPay, Expense } from '../types';

export const initialSettings: StoreSettings = {
  storeName: 'LA FITNESS MODA ESPORTIVA',
  tradingName: 'LA FITNESS RETAIL',
  cnpj: '34.567.890/0001-12',
  ie: '123.456.789.110',
  phone: '(11) 98765-4321',
  email: 'contato@lafitness.com.br',
  address: 'Av. Paulista, 1000 - Loja 42, Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  receiptFooterMessage: 'Obrigado por treinar com estilo! Trocas em até 30 dias com etiqueta fixada.',
  printerType: '80mm',
  defaultMarkupPercent: 110,
  maxDiscountWithoutApproval: 10,
  enableBlindInventory: false,
  categories: ['Leggings', 'Tops', 'Shorts', 'Regatas', 'Conjuntos', 'Macacões', 'Acessórios'],
  sizes: ['PP', 'P', 'M', 'G', 'GG', 'U'],
  colors: ['Preto', 'Mescla', 'Rosa Neon', 'Azul Royal', 'Vinho', 'Branco', 'Verde Militar'],
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
  lastCloudBackupAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  lastCloseRegisterBackupAt: new Date(Date.now() - 86400 * 1000).toISOString()
};

export const initialUsers: User[] = [
  {
    id: 'user-admin-1',
    name: 'Carlos Oliveira (Admin)',
    email: 'admin@lafitness.com.br',
    role: 'ADMINISTRADOR',
    active: true,
    maxDiscountPercent: 30,
    canCancelSales: true,
    canAdjustStock: true,
    canRestoreBackup: true,
    createdAt: '2026-01-10T08:00:00Z',
    passwordHash: 'admin123'
  },
  {
    id: 'user-gerente-1',
    name: 'Renata Vasconcelos',
    email: 'gerente@lafitness.com.br',
    role: 'GERENTE',
    active: true,
    maxDiscountPercent: 20,
    canCancelSales: true,
    canAdjustStock: true,
    canRestoreBackup: false,
    createdAt: '2026-01-15T09:00:00Z',
    passwordHash: 'gerente123'
  },
  {
    id: 'user-operador-1',
    name: 'Mariana Silva',
    email: 'caixa@lafitness.com.br',
    role: 'OPERADOR',
    active: true,
    maxDiscountPercent: 10,
    canCancelSales: false,
    canAdjustStock: false,
    canRestoreBackup: false,
    createdAt: '2026-02-01T10:00:00Z',
    passwordHash: 'caixa123'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    code: 101,
    corporateName: 'Confecções Fitness Brasil Têxtil Ltda',
    tradeName: 'FITNESS BRASIL',
    document: '12.345.678/0001-90',
    phone: '(19) 3456-7890',
    email: 'comercial@fitnessbrasil.com.br',
    address: 'Rua das Indústrias, 450 - Polo Têxtil',
    city: 'Americana',
    state: 'SP',
    paymentTerms: '28 / 56 dias',
    notes: 'Fornecedor principal de tecidos suplex e poliamida',
    active: true,
    createdAt: '2026-01-05T10:00:00Z'
  },
  {
    id: 'sup-2',
    code: 102,
    corporateName: 'Power Tech Tecidos & Elasticidade Eireli',
    tradeName: 'POWER TECH',
    document: '98.765.432/0001-10',
    phone: '(47) 3322-1100',
    email: 'pedidos@powertechfit.com.br',
    address: 'Rodovia SC-401, Km 12',
    city: 'Brusque',
    state: 'SC',
    paymentTerms: '30 dias direto',
    notes: 'Linha seamless sem costura e cirrê acetinado',
    active: true,
    createdAt: '2026-01-12T14:30:00Z'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    code: 1,
    name: 'CONSUMIDOR PADRÃO BALCÃO',
    document: '000.000.000-00',
    phone: '(11) 90000-0000',
    email: 'balcao@lafitness.com.br',
    address: 'Atendimento Local',
    city: 'São Paulo',
    state: 'SP',
    creditLimit: 0,
    creditUsed: 0,
    active: true,
    notes: 'Cliente padrão para vendas rápidas sem cadastro prévio',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'cust-2',
    code: 2,
    name: 'Camila Rodrigues Silva',
    document: '321.654.987-10',
    phone: '(11) 98111-2233',
    email: 'camila.rodrigues@email.com',
    address: 'Rua Bela Cintra, 890 - Ap 41, Consolação',
    city: 'São Paulo',
    state: 'SP',
    creditLimit: 1800,
    creditUsed: 239.80,
    active: true,
    notes: 'Professora de crossfit e personal trainer. Pagamento habitual via duplicata/pix.',
    createdAt: '2026-01-18T11:20:00Z'
  },
  {
    id: 'cust-3',
    code: 3,
    name: 'Juliana Mendes Andrade',
    document: '456.789.123-55',
    phone: '(11) 97222-3344',
    email: 'jumendes.fit@gmail.com',
    address: 'Alameda Santos, 1420 - Cerqueira César',
    city: 'São Paulo',
    state: 'SP',
    creditLimit: 2500,
    creditUsed: 0,
    active: true,
    notes: 'Cliente VIP, compra mensal de coleções completas.',
    createdAt: '2026-01-22T15:45:00Z'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    code: 1001,
    barcode: '7891001000010',
    name: 'LEGGING SUPLEX ALTA COMPRESSÃO ZERO TRANSPARÊNCIA',
    reference: 'LEG-SUP-01',
    category: 'Leggings',
    brand: 'LA FITNESS',
    description: 'Cós alto duplo anatômico de 12cm com sustentação e proteção UV50+.',
    unit: 'UN',
    costPrice: 42.00,
    sellingPrice: 119.90,
    markupPercent: 185.48,
    stock: 28,
    minStock: 8,
    supplierId: 'sup-1',
    supplierName: 'FITNESS BRASIL',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
    active: true,
    hasVariations: true,
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&auto=format&fit=crop&q=80',
    variations: [
      { id: 'var-1-1', productId: 'prod-1', sku: 'LEG01-PR-P', barcode: '7891001000119', color: 'Preto', size: 'P', stock: 6, minStock: 2, active: true },
      { id: 'var-1-2', productId: 'prod-1', sku: 'LEG01-PR-M', barcode: '7891001000126', color: 'Preto', size: 'M', stock: 8, minStock: 2, active: true },
      { id: 'var-1-3', productId: 'prod-1', sku: 'LEG01-PR-G', barcode: '7891001000133', color: 'Preto', size: 'G', stock: 5, minStock: 2, active: true },
      { id: 'var-1-4', productId: 'prod-1', sku: 'LEG01-VN-M', barcode: '7891001000140', color: 'Vinho', size: 'M', stock: 5, minStock: 1, active: true },
      { id: 'var-1-5', productId: 'prod-1', sku: 'LEG01-AZ-G', barcode: '7891001000157', color: 'Azul Royal', size: 'G', stock: 4, minStock: 1, active: true },
    ]
  },
  {
    id: 'prod-2',
    code: 1002,
    barcode: '7891002000017',
    name: 'TOP FITNESS NADADOR COM BOJO REMOVÍVEL ANATÔMICO',
    reference: 'TOP-NAD-02',
    category: 'Tops',
    brand: 'LA FITNESS',
    description: 'Top fitness de alta sustentação com elástico reforçado no cós.',
    unit: 'UN',
    costPrice: 22.50,
    sellingPrice: 69.90,
    markupPercent: 210.67,
    stock: 21,
    minStock: 6,
    supplierId: 'sup-1',
    supplierName: 'FITNESS BRASIL',
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-01-16T10:00:00Z',
    active: true,
    hasVariations: true,
    imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&auto=format&fit=crop&q=80',
    variations: [
      { id: 'var-2-1', productId: 'prod-2', sku: 'TOP02-PR-P', barcode: '7891002000215', color: 'Preto', size: 'P', stock: 7, minStock: 2, active: true },
      { id: 'var-2-2', productId: 'prod-2', sku: 'TOP02-PR-M', barcode: '7891002000222', color: 'Preto', size: 'M', stock: 8, minStock: 2, active: true },
      { id: 'var-2-3', productId: 'prod-2', sku: 'TOP02-RS-M', barcode: '7891002000239', color: 'Rosa Neon', size: 'M', stock: 3, minStock: 1, active: true },
      { id: 'var-2-4', productId: 'prod-2', sku: 'TOP02-BR-G', barcode: '7891002000246', color: 'Branco', size: 'G', stock: 3, minStock: 1, active: true },
    ]
  },
  {
    id: 'prod-3',
    code: 1003,
    barcode: '7891003000014',
    name: 'SHORT MEIA COXA EMPINA BUMBUM COM BOLSO LATERAL DUPLO',
    reference: 'SHT-BOL-03',
    category: 'Shorts',
    brand: 'POWER TECH',
    description: 'Short com bolso funcional para celular e recorte empina bumbum.',
    unit: 'UN',
    costPrice: 31.00,
    sellingPrice: 89.90,
    markupPercent: 190.00,
    stock: 16,
    minStock: 5,
    supplierId: 'sup-2',
    supplierName: 'POWER TECH',
    createdAt: '2026-01-18T14:00:00Z',
    updatedAt: '2026-01-18T14:00:00Z',
    active: true,
    hasVariations: true,
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&auto=format&fit=crop&q=80',
    variations: [
      { id: 'var-3-1', productId: 'prod-3', sku: 'SHT03-PR-P', barcode: '7891003000311', color: 'Preto', size: 'P', stock: 5, minStock: 2, active: true },
      { id: 'var-3-2', productId: 'prod-3', sku: 'SHT03-PR-M', barcode: '7891003000328', color: 'Preto', size: 'M', stock: 6, minStock: 2, active: true },
      { id: 'var-3-3', productId: 'prod-3', sku: 'SHT03-MC-G', barcode: '7891003000335', color: 'Mescla', size: 'G', stock: 3, minStock: 1, active: true },
      { id: 'var-3-4', productId: 'prod-3', sku: 'SHT03-VM-M', barcode: '7891003000342', color: 'Verde Militar', size: 'M', stock: 2, minStock: 1, active: true },
    ]
  },
  {
    id: 'prod-4',
    code: 1004,
    barcode: '7891004000011',
    name: 'REGATA CAVADA DRY FIT PERFORMANCE TRANSPIRÁVEL',
    reference: 'REG-DRY-04',
    category: 'Regatas',
    brand: 'LA FITNESS',
    description: 'Tecido micro perfurado dry-action de secagem ultra rápida.',
    unit: 'UN',
    costPrice: 18.00,
    sellingPrice: 54.90,
    markupPercent: 205.00,
    stock: 19,
    minStock: 4,
    supplierId: 'sup-1',
    supplierName: 'FITNESS BRASIL',
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z',
    active: true,
    hasVariations: true,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format&fit=crop&q=80',
    variations: [
      { id: 'var-4-1', productId: 'prod-4', sku: 'REG04-PR-M', barcode: '7891004000418', color: 'Preto', size: 'M', stock: 8, minStock: 2, active: true },
      { id: 'var-4-2', productId: 'prod-4', sku: 'REG04-BR-G', barcode: '7891004000425', color: 'Branco', size: 'G', stock: 6, minStock: 2, active: true },
      { id: 'var-4-3', productId: 'prod-4', sku: 'REG04-RS-P', barcode: '7891004000432', color: 'Rosa Neon', size: 'P', stock: 5, minStock: 1, active: true },
    ]
  },
  {
    id: 'prod-5',
    code: 1005,
    barcode: '7891005000018',
    name: 'MACACÃO FITNESS CIRRÊ BRILHOSO COM ZÍPER FRONTAL',
    reference: 'MC-CIR-05',
    category: 'Macacões',
    brand: 'POWER TECH',
    description: 'Design exclusivo modelador em cirrê premium com acabamento acetinado.',
    unit: 'UN',
    costPrice: 75.00,
    sellingPrice: 199.90,
    markupPercent: 166.53,
    stock: 7,
    minStock: 3,
    supplierId: 'sup-2',
    supplierName: 'POWER TECH',
    createdAt: '2026-01-25T15:00:00Z',
    updatedAt: '2026-01-25T15:00:00Z',
    active: true,
    hasVariations: true,
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80',
    variations: [
      { id: 'var-5-1', productId: 'prod-5', sku: 'MAC05-PR-P', barcode: '7891005000517', color: 'Preto', size: 'P', stock: 3, minStock: 1, active: true },
      { id: 'var-5-2', productId: 'prod-5', sku: 'MAC05-PR-M', barcode: '7891005000524', color: 'Preto', size: 'M', stock: 4, minStock: 1, active: true },
    ]
  },
  {
    id: 'prod-6',
    code: 1006,
    barcode: '7891006000015',
    name: 'GARRAFA TÉRMICA INOX FITNESS SPORT 750ML',
    reference: 'AC-GAR-06',
    category: 'Acessórios',
    brand: 'LA FITNESS',
    description: 'Mantém líquido gelado por até 24 horas. Parede dupla a vácuo com bico esportivo.',
    unit: 'UN',
    costPrice: 28.00,
    sellingPrice: 79.90,
    markupPercent: 185.36,
    stock: 12,
    minStock: 4,
    supplierId: 'sup-2',
    supplierName: 'POWER TECH',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    active: true,
    hasVariations: true,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80',
    variations: [
      { id: 'var-6-1', productId: 'prod-6', sku: 'GAR06-PR-U', barcode: '7891006000614', color: 'Preto', size: 'U', stock: 7, minStock: 2, active: true },
      { id: 'var-6-2', productId: 'prod-6', sku: 'GAR06-RS-U', barcode: '7891006000621', color: 'Rosa Neon', size: 'U', stock: 5, minStock: 2, active: true },
    ]
  }
];

export const initialActiveRegister: RegisterSession = {
  id: 'reg-session-1',
  registerNumber: 1,
  operatorId: 'user-operador-1',
  operatorName: 'Mariana Silva',
  openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  status: 'ABERTO',
  initialCash: 200.00,
  totalCashSales: 119.90,
  totalPixSales: 159.80,
  totalDebitSales: 89.90,
  totalCreditSales: 219.80,
  totalDuplicataSales: 239.80,
  totalCashInflows: 50.00, // Suprimento de R$ 50 para troco
  totalCashOutflows: 25.00, // Despesa de fita adesiva / caixa
  expectedCash: 344.90, // 200 + 119.90 + 50 - 25 = 344.90
  movements: [
    {
      id: 'reg-mov-1',
      registerSessionId: 'reg-session-1',
      type: 'SUPRIMENTO',
      amount: 50.00,
      method: 'DINHEIRO',
      description: 'Reforço de moedas e notas de R$ 2 e R$ 5 para troco',
      userId: 'user-gerente-1',
      userName: 'Renata Vasconcelos',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      id: 'reg-mov-2',
      registerSessionId: 'reg-session-1',
      type: 'DESPESA',
      amount: 25.00,
      method: 'DINHEIRO',
      description: 'Compra de fita adesiva larga e papel higiênico para a loja',
      userId: 'user-operador-1',
      userName: 'Mariana Silva',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    }
  ]
};

export const initialDuplicatas: Duplicata[] = [
  {
    id: 'dup-1',
    documentNumber: 'DUP-2026-0001',
    saleId: 'sale-mock-1',
    saleNumber: 1001,
    customerId: 'cust-2',
    customerName: 'Camila Rodrigues Silva',
    customerDoc: '321.654.987-10',
    issueDate: new Date(Date.now() - 5 * 86400 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400 * 1000).toISOString().split('T')[0],
    totalAmount: 239.80,
    paidAmount: 0.00,
    balance: 239.80,
    installmentsCount: 2,
    installments: [
      {
        installmentNumber: 1,
        dueDate: new Date(Date.now() + 5 * 86400 * 1000).toISOString().split('T')[0],
        amount: 119.90,
        paidAmount: 0,
        balance: 119.90,
        status: 'PENDENTE'
      },
      {
        installmentNumber: 2,
        dueDate: new Date(Date.now() + 35 * 86400 * 1000).toISOString().split('T')[0],
        amount: 119.90,
        paidAmount: 0,
        balance: 119.90,
        status: 'PENDENTE'
      }
    ],
    status: 'ABERTA',
    notes: 'Venda a prazo autorizada pela gerência com 2 parcelas mensais.',
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  }
];

export const initialBillsToPay: BillToPay[] = [
  {
    id: 'bill-1',
    documentNumber: 'NF-8921',
    description: 'Compra de Tecidos e Linha Suplex - Pedido 45',
    supplierId: 'sup-1',
    supplierName: 'FITNESS BRASIL',
    issueDate: '2026-02-15',
    dueDate: new Date(Date.now() + 4 * 86400 * 1000).toISOString().split('T')[0],
    totalAmount: 1450.00,
    paidAmount: 0.00,
    balance: 1450.00,
    status: 'PENDENTE',
    category: 'Fornecedores Têxteis',
    notes: 'Boleto referente à reposição de leggings e tops',
    createdAt: '2026-02-15T10:00:00Z',
    history: []
  },
  {
    id: 'bill-2',
    documentNumber: 'ALUG-02',
    description: 'Aluguel do Salão Comercial - Loja 42',
    supplierName: 'Imobiliária Central Paulista',
    issueDate: '2026-02-01',
    dueDate: new Date(Date.now() + 8 * 86400 * 1000).toISOString().split('T')[0],
    totalAmount: 3200.00,
    paidAmount: 0.00,
    balance: 3200.00,
    status: 'PENDENTE',
    category: 'Aluguel do Ponto',
    notes: 'Vencimento todo dia 10 do mês',
    createdAt: '2026-02-01T09:00:00Z',
    history: []
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    description: 'Compra de fita adesiva e materiais de limpeza',
    category: 'Manutenção e Limpeza',
    amount: 25.00,
    date: new Date().toISOString().split('T')[0],
    paidFromRegister: true,
    registerSessionId: 'reg-session-1',
    paymentMethod: 'DINHEIRO',
    isPaid: true,
    paidAt: new Date().toISOString(),
    responsibleName: 'Mariana Silva',
    notes: 'Pago diretamente com dinheiro do caixa em espécie',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exp-2',
    description: 'Anúncios Instagram e Meta Ads Linha Fitness',
    category: 'Marketing e Redes',
    amount: 350.00,
    date: new Date(Date.now() - 3 * 86400 * 1000).toISOString().split('T')[0],
    paidFromRegister: false,
    paymentMethod: 'CREDITO',
    isPaid: true,
    paidAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    responsibleName: 'Carlos Oliveira (Admin)',
    notes: 'Campanha de lançamento da coleção de verão',
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString()
  }
];
