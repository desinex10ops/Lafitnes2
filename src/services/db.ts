import {
  Product,
  StockMovement,
  Sale,
  Customer,
  Supplier,
  RegisterSession,
  RegisterMovement,
  Duplicata,
  BillToPay,
  Expense,
  Purchase,
  Inventory,
  User,
  StoreSettings,
  AuditLog,
  PaymentMethod,
  AutoBackupRecord
} from '../types';

import { supabase, isSupabaseConfigured } from './supabase';

import {
  initialProducts,
  initialSuppliers,
  initialCustomers,
  initialSettings,
  initialUsers,
  initialActiveRegister,
  initialDuplicatas,
  initialBillsToPay,
  initialExpenses
} from './mockData';

// Chaves para persistência segura
const STORAGE_KEYS = {
  SETTINGS: 'lafitness_settings',
  USERS: 'lafitness_users',
  CURRENT_USER: 'lafitness_current_user',
  PRODUCTS: 'lafitness_products',
  CUSTOMERS: 'lafitness_customers',
  SUPPLIERS: 'lafitness_suppliers',
  SALES: 'lafitness_sales',
  STOCK_MOVEMENTS: 'lafitness_stock_movements',
  REGISTERS: 'lafitness_registers',
  ACTIVE_REGISTER: 'lafitness_active_register',
  DUPLICATAS: 'lafitness_duplicatas',
  BILLS_TO_PAY: 'lafitness_bills_to_pay',
  EXPENSES: 'lafitness_expenses',
  PURCHASES: 'lafitness_purchases',
  INVENTORIES: 'lafitness_inventories',
  AUDIT_LOGS: 'lafitness_audit_logs',
  HIDE_BALANCES: 'lafitness_hide_balances',
  AUTO_BACKUPS: 'lafitness_auto_backups',
};

// Funções utilitárias de leitura e gravação
function load<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Erro ao carregar chave ${key}:`, err);
    return defaultValue;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erro ao salvar chave ${key}:`, err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage_error', { detail: { key, error: err } }));
    }
  }
}

export class DatabaseService {
  // Inicialização do banco com dados padrão se estiver vazio
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      save(STORAGE_KEYS.SETTINGS, initialSettings);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      save(STORAGE_KEYS.USERS, initialUsers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      save(STORAGE_KEYS.PRODUCTS, initialProducts);
    } else {
      // Sincroniza imagens nos produtos existentes caso ainda não tenham
      const existingProds = load<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      let updated = false;
      existingProds.forEach(p => {
        if (!p.imageUrl) {
          const match = initialProducts.find(ip => ip.id === p.id || ip.code === p.code);
          if (match?.imageUrl) {
            p.imageUrl = match.imageUrl;
            updated = true;
          }
        }
      });
      if (updated) {
        save(STORAGE_KEYS.PRODUCTS, existingProds);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      save(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      save(STORAGE_KEYS.SUPPLIERS, initialSuppliers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_REGISTER)) {
      save(STORAGE_KEYS.ACTIVE_REGISTER, initialActiveRegister);
      save(STORAGE_KEYS.REGISTERS, [initialActiveRegister]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DUPLICATAS)) {
      save(STORAGE_KEYS.DUPLICATAS, initialDuplicatas);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BILLS_TO_PAY)) {
      save(STORAGE_KEYS.BILLS_TO_PAY, initialBillsToPay);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      save(STORAGE_KEYS.EXPENSES, initialExpenses);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      save(STORAGE_KEYS.CURRENT_USER, initialUsers[0]); // Inicia como Admin por padrão
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      // Cria uma venda de exemplo para alimentar os relatórios de saída
      const sampleSale: Sale = {
        id: 'sale-init-1',
        saleNumber: 1001,
        registerSessionId: 'reg-session-1',
        operatorId: 'user-operador-1',
        operatorName: 'Mariana Silva',
        customerId: 'cust-2',
        customerName: 'Camila Rodrigues Silva',
        customerDoc: '321.654.987-10',
        subtotal: 239.80,
        discountAmount: 0,
        total: 239.80,
        totalCost: 84.00,
        status: 'CONCLUIDA',
        createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        items: [
          {
            id: 'item-1',
            saleId: 'sale-init-1',
            productId: 'prod-1',
            productName: 'LEGGING SUPLEX ALTA COMPRESSÃO ZERO TRANSPARÊNCIA',
            variationId: 'var-1-2',
            color: 'Preto',
            size: 'M',
            barcode: '7891001000126',
            quantity: 2,
            unitPrice: 119.90,
            costPrice: 42.00,
            discountPercent: 0,
            discountAmount: 0,
            totalPrice: 239.80
          }
        ],
        payments: [
          {
            id: 'pay-1',
            saleId: 'sale-init-1',
            method: 'DUPLICATA',
            amount: 239.80,
            installments: 2
          }
        ]
      };
      save(STORAGE_KEYS.SALES, [sampleSale]);
    }
  }

  // --- AUTENTICAÇÃO E USUÁRIOS ---
  public static getCurrentUser(): User | null {
    return load<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public static setCurrentUser(user: User | null): void {
    save(STORAGE_KEYS.CURRENT_USER, user);
  }

  // --- PRIVACIDADE DE SALDO (MODO APP DE BANCO) ---
  public static getHideBalances(): boolean {
    return load<boolean>(STORAGE_KEYS.HIDE_BALANCES, false);
  }

  public static setHideBalances(hide: boolean): void {
    save(STORAGE_KEYS.HIDE_BALANCES, hide);
    window.dispatchEvent(new CustomEvent('balance_privacy_changed', { detail: hide }));
  }

  public static getUsers(): User[] {
    return load<User[]>(STORAGE_KEYS.USERS, []);
  }

  public static saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    save(STORAGE_KEYS.USERS, users);
    this.logAudit('SALVAR_USUARIO', 'USUÁRIOS', `Usuário ${user.name} (${user.role}) salvo.`);
  }

  // --- CONFIGURAÇÕES ---
  public static getSettings(): StoreSettings {
    return load<StoreSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  }

  public static saveSettings(settings: StoreSettings): void {
    save(STORAGE_KEYS.SETTINGS, settings);
    this.logAudit('ATUALIZAR_CONFIGURACOES', 'CONFIGURAÇÕES', 'Configurações gerais da loja atualizadas.');
  }

  // --- PRODUTOS E VARIAÇÕES ---
  public static getProducts(): Product[] {
    return load<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  public static saveProduct(product: Product): void {
    const products = this.getProducts();
    // Recalcula estoque total do produto como a soma das variações ativas
    if (product.variations && product.variations.length > 0) {
      product.stock = product.variations
        .filter(v => v.active)
        .reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    product.updatedAt = new Date().toISOString();

    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      products[idx] = product;
    } else {
      // Gera próximo código sequencial se novo
      if (!product.code) {
        const maxCode = products.reduce((max, p) => p.code > max ? p.code : max, 1000);
        product.code = maxCode + 1;
      }
      product.createdAt = new Date().toISOString();
      products.push(product);
    }
    save(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit('SALVAR_PRODUTO', 'ESTOQUE', `Produto ${product.name} (Cód: ${product.code}) salvo.`);
  }

  public static deleteProduct(id: string): { success: boolean; message: string } {
    const sales = this.getSales();
    const isUsedInSales = sales.some(s => s.items.some(i => i.productId === id));
    if (isUsedInSales) {
      // Requisito 7: Impedir exclusão física de produtos com histórico
      const products = this.getProducts();
      const p = products.find(item => item.id === id);
      if (p) {
        p.active = false;
        save(STORAGE_KEYS.PRODUCTS, products);
        return { success: true, message: 'Produto possui histórico e foi INATIVADO com sucesso.' };
      }
      return { success: false, message: 'Produto não encontrado.' };
    }

    const products = this.getProducts().filter(p => p.id !== id);
    save(STORAGE_KEYS.PRODUCTS, products);
    return { success: true, message: 'Produto excluído permanentemente.' };
  }

  // --- CLIENTES ---
  public static getCustomers(): Customer[] {
    return load<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  public static saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
    } else {
      if (!customer.code) {
        const maxCode = customers.reduce((max, c) => c.code > max ? c.code : max, 0);
        customer.code = maxCode + 1;
      }
      customer.createdAt = new Date().toISOString();
      customers.push(customer);
    }
    save(STORAGE_KEYS.CUSTOMERS, customers);
    this.logAudit('SALVAR_CLIENTE', 'CLIENTES', `Cliente ${customer.name} salvo.`);
  }

  // --- FORNECEDORES ---
  public static getSuppliers(): Supplier[] {
    return load<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  }

  public static saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
    } else {
      if (!supplier.code) {
        const maxCode = suppliers.reduce((max, s) => s.code > max ? s.code : max, 100);
        supplier.code = maxCode + 1;
      }
      supplier.createdAt = new Date().toISOString();
      suppliers.push(supplier);
    }
    save(STORAGE_KEYS.SUPPLIERS, suppliers);
    this.logAudit('SALVAR_FORNECEDOR', 'FORNECEDORES', `Fornecedor ${supplier.tradeName} salvo.`);
  }

  // --- CAIXA ---
  public static getActiveRegister(): RegisterSession | null {
    return load<RegisterSession | null>(STORAGE_KEYS.ACTIVE_REGISTER, null);
  }

  public static getRegisters(): RegisterSession[] {
    return load<RegisterSession[]>(STORAGE_KEYS.REGISTERS, []);
  }

  public static syncActiveRegister(active: RegisterSession | null): void {
    save(STORAGE_KEYS.ACTIVE_REGISTER, active);
    if (active) {
      const registers = this.getRegisters();
      const idx = registers.findIndex(r => r.id === active.id);
      if (idx >= 0) {
        registers[idx] = active;
      } else {
        registers.push(active);
      }
      save(STORAGE_KEYS.REGISTERS, registers);
    }
  }

  public static openRegister(operatorId: string, operatorName: string, initialCash: number): { success: boolean; message: string; session?: RegisterSession } {
    const current = this.getActiveRegister();
    if (current && current.status === 'ABERTO') {
      return { success: false, message: `Já existe um caixa aberto para ${current.operatorName}. Feche o caixa anterior antes de abrir outro.` };
    }

    const registers = this.getRegisters();
    const newSession: RegisterSession = {
      id: `reg-${Date.now()}`,
      registerNumber: 1,
      operatorId,
      operatorName,
      openedAt: new Date().toISOString(),
      status: 'ABERTO',
      initialCash: Number(initialCash) || 0,
      totalCashSales: 0,
      totalPixSales: 0,
      totalDebitSales: 0,
      totalCreditSales: 0,
      totalDuplicataSales: 0,
      totalCashInflows: 0,
      totalCashOutflows: 0,
      expectedCash: Number(initialCash) || 0,
      movements: [
        {
          id: `mov-${Date.now()}`,
          registerSessionId: `reg-${Date.now()}`,
          type: 'SUPRIMENTO',
          amount: Number(initialCash) || 0,
          method: 'DINHEIRO',
          description: 'Abertura de Caixa — Fundo de Troco Inicial',
          userId: operatorId,
          userName: operatorName,
          createdAt: new Date().toISOString()
        }
      ]
    };

    save(STORAGE_KEYS.ACTIVE_REGISTER, newSession);
    registers.push(newSession);
    save(STORAGE_KEYS.REGISTERS, registers);
    this.logAudit('ABERTURA_CAIXA', 'CAIXA', `Caixa aberto por ${operatorName} com R$ ${Number(initialCash).toFixed(2)}.`);
    return { success: true, message: 'Caixa aberto com sucesso!', session: newSession };
  }

  public static addRegisterMovement(type: 'SUPRIMENTO' | 'SANGRIA' | 'DESPESA', amount: number, description: string): { success: boolean; message: string } {
    const active = this.getActiveRegister();
    if (!active || active.status !== 'ABERTO') {
      return { success: false, message: 'Não há caixa aberto no momento.' };
    }

    const user = this.getCurrentUser();
    const movAmount = Number(amount);

    if (type === 'SANGRIA' || type === 'DESPESA') {
      if (movAmount > active.expectedCash) {
        return { success: false, message: `Saldo em dinheiro insuficiente no caixa. Saldo atual: R$ ${active.expectedCash.toFixed(2)}.` };
      }
      active.totalCashOutflows += movAmount;
      active.expectedCash -= movAmount;
    } else {
      active.totalCashInflows += movAmount;
      active.expectedCash += movAmount;
    }

    const movement: RegisterMovement = {
      id: `mov-${Date.now()}`,
      registerSessionId: active.id,
      type,
      amount: movAmount,
      method: 'DINHEIRO',
      description,
      userId: user?.id || active.operatorId,
      userName: user?.name || active.operatorName,
      createdAt: new Date().toISOString()
    };

    active.movements.push(movement);
    this.syncActiveRegister(active);

    this.logAudit('MOVIMENTACAO_CAIXA', 'CAIXA', `${type} de R$ ${movAmount.toFixed(2)}: ${description}`);
    return { success: true, message: `${type} registrada com sucesso.` };
  }

  public static closeRegister(countedCash: number, notes?: string): {
    success: boolean;
    message: string;
    session?: RegisterSession;
    backupData?: { filename: string; json: string; sizeBytes: number };
  } {
    const active = this.getActiveRegister();
    if (!active || active.status !== 'ABERTO') {
      return { success: false, message: 'Nenhum caixa aberto para fechar.' };
    }

    active.closedAt = new Date().toISOString();
    active.status = 'FECHADO';
    active.countedCash = Number(countedCash);
    active.cashDifference = active.countedCash - active.expectedCash;
    active.notes = notes;

    const registers = this.getRegisters();
    const idx = registers.findIndex(r => r.id === active.id);
    if (idx >= 0) {
      registers[idx] = active;
    } else {
      registers.push(active);
    }
    save(STORAGE_KEYS.REGISTERS, registers);
    save(STORAGE_KEYS.ACTIVE_REGISTER, null);

    this.logAudit('FECHAMENTO_CAIXA', 'CAIXA', `Caixa fechado. Esperado: R$ ${active.expectedCash.toFixed(2)}, Contado: R$ ${active.countedCash.toFixed(2)}, Dif: R$ ${active.cashDifference.toFixed(2)}`);

    // --- OPÇÃO 1 & 2: BACKUP AUTOMÁTICO NO FECHAMENTO DO CAIXA & NUVEM ---
    let autoBackupData: { filename: string; json: string; sizeBytes: number } | undefined;
    const settings = this.getSettings();
    if (settings.autoBackupOnCashClose !== false) {
      const backupJson = this.exportBackup();
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `backup_lafitness_${dateStr}_fechamento_${timeStr}.json`;
      const sizeBytes = new Blob([backupJson]).size;

      const autoRecord: AutoBackupRecord = {
        id: `autobackup-${Date.now()}`,
        type: 'FECHAMENTO_CAIXA',
        filename,
        createdAt: now.toISOString(),
        operatorName: active.operatorName,
        sizeBytes,
        dataJson: backupJson,
        status: settings.autoBackupCloud ? 'SINCRONIZADO_NUVEM' : 'LOCAL_SALVO'
      };
      this.saveAutoBackup(autoRecord);

      settings.lastCloseRegisterBackupAt = now.toISOString();
      if (settings.autoBackupCloud) {
        settings.lastCloudBackupAt = now.toISOString();
      }
      this.saveSettings(settings);

      autoBackupData = { filename, json: backupJson, sizeBytes };
      this.logAudit('BACKUP_AUTOMATICO_CAIXA', 'BACKUP', `Backup automático gerado no fechamento de caixa: ${filename}.`);
    }

    return {
      success: true,
      message: 'Caixa fechado com sucesso!',
      session: active,
      backupData: autoBackupData
    };
  }

  // --- VENDAS (PDV TRANSACIONAL) ---
  public static getSales(): Sale[] {
    return load<Sale[]>(STORAGE_KEYS.SALES, []);
  }

  public static finalizeSale(saleData: Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'status'>, duplicataConfig?: { installmentsCount: number; firstDueDate: string; notes?: string }): { success: boolean; message: string; sale?: Sale } {
    const activeRegister = this.getActiveRegister();
    if (!activeRegister || activeRegister.status !== 'ABERTO') {
      return { success: false, message: 'OPERACAO NEGADA: O Caixa precisa estar ABERTO para concluir vendas.' };
    }

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();
    const currentUser = this.getCurrentUser();

    // 1. Validar itens e estoque antes de processar qualquer alteração (Atomicidade)
    for (const item of saleData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return { success: false, message: `Produto não encontrado: ${item.productName}` };
      }

      if (item.variationId) {
        const variation = product.variations.find(v => v.id === item.variationId);
        if (!variation) {
          return { success: false, message: `Variação de ${product.name} (${item.color}/${item.size}) não encontrada.` };
        }
        if (variation.stock < item.quantity) {
          return {
            success: false,
            message: `Estoque insuficiente para ${product.name} - ${item.color}/${item.size}! Solicitado: ${item.quantity}, Disponível: ${variation.stock}.`
          };
        }
      } else {
        if (product.stock < item.quantity) {
          return {
            success: false,
            message: `Estoque insuficiente para ${product.name}! Solicitado: ${item.quantity}, Disponível: ${product.stock}.`
          };
        }
      }
    }

    // 2. Validar pagamentos
    const totalPayments = saleData.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPayments - saleData.total) > 0.05) {
      return {
        success: false,
        message: `Soma dos pagamentos (R$ ${totalPayments.toFixed(2)}) difere do total da venda (R$ ${saleData.total.toFixed(2)}).`
      };
    }

    // 3. Validar se DUPLICATA exige cliente
    const hasDuplicata = saleData.payments.some(p => p.method === 'DUPLICATA' || p.method === 'A_PRAZO');
    if (hasDuplicata) {
      if (!saleData.customerId || saleData.customerName === 'CONSUMIDOR PADRÃO BALCÃO') {
        return {
          success: false,
          message: 'DUPLICATA OBRIGATÓRIA: Para venda a prazo / duplicata, é obrigatório selecionar um cliente cadastrado com CPF/CNPJ.'
        };
      }
    }

    // 4. Executar baixa do estoque de forma atômica
    const nowStr = new Date().toISOString();
    for (const item of saleData.items) {
      const product = products.find(p => p.id === item.productId)!;
      let prevStock = product.stock;
      let newStock = product.stock - item.quantity;

      if (item.variationId) {
        const variation = product.variations.find(v => v.id === item.variationId)!;
        prevStock = variation.stock;
        newStock = variation.stock - item.quantity;
        variation.stock = newStock;
        // Recalcula consolidado
        product.stock = product.variations.filter(v => v.active).reduce((acc, v) => acc + v.stock, 0);
      } else {
        product.stock = newStock;
      }

      // Registrar movimento de estoque
      const movement: StockMovement = {
        id: `mov-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        productName: product.name,
        variationId: item.variationId,
        color: item.color,
        size: item.size,
        type: 'SAIDA_VENDA',
        quantity: -item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        reason: `Venda no Caixa`,
        userId: currentUser?.id || activeRegister.operatorId,
        userName: currentUser?.name || activeRegister.operatorName,
        createdAt: nowStr
      };
      stockMovements.push(movement);
    }

    // 5. Gerar número de venda sequencial
    const sales = this.getSales();
    const nextSaleNumber = sales.reduce((max, s) => s.saleNumber > max ? s.saleNumber : max, 1000) + 1;

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      saleNumber: nextSaleNumber,
      registerSessionId: activeRegister.id,
      operatorId: activeRegister.operatorId,
      operatorName: activeRegister.operatorName,
      status: 'CONCLUIDA',
      createdAt: nowStr
    };

    // 6. Atualizar Sessão de Caixa
    for (const pay of newSale.payments) {
      if (pay.method === 'DINHEIRO') {
        activeRegister.totalCashSales += pay.amount;
        activeRegister.expectedCash += pay.amount;
      } else if (pay.method === 'PIX') {
        activeRegister.totalPixSales += pay.amount;
      } else if (pay.method === 'DEBITO') {
        activeRegister.totalDebitSales += pay.amount;
      } else if (pay.method === 'CREDITO') {
        activeRegister.totalCreditSales += pay.amount;
      } else if (pay.method === 'DUPLICATA' || pay.method === 'A_PRAZO') {
        activeRegister.totalDuplicataSales += pay.amount;
      }
    }

    // 7. Se houver DUPLICATA, registrar na tabela de Duplicatas e Contas a Receber
    const duplicataPayment = newSale.payments.find(p => p.method === 'DUPLICATA' || p.method === 'A_PRAZO');
    if (duplicataPayment && saleData.customerId) {
      const duplicatas = this.getDuplicatas();
      const count = duplicataConfig?.installmentsCount || 1;
      const baseDueDate = duplicataConfig?.firstDueDate ? new Date(duplicataConfig.firstDueDate) : new Date(Date.now() + 30 * 86400 * 1000);
      const installmentAmount = Number((duplicataPayment.amount / count).toFixed(2));
      const installments = [];

      for (let i = 1; i <= count; i++) {
        const dueDate = new Date(baseDueDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        installments.push({
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: i === count ? duplicataPayment.amount - (installmentAmount * (count - 1)) : installmentAmount,
          paidAmount: 0,
          balance: i === count ? duplicataPayment.amount - (installmentAmount * (count - 1)) : installmentAmount,
          status: 'PENDENTE' as const
        });
      }

      const newDuplicata: Duplicata = {
        id: `dup-${Date.now()}`,
        documentNumber: `DUP-${newSale.saleNumber}`,
        saleId: newSale.id,
        saleNumber: newSale.saleNumber,
        customerId: saleData.customerId,
        customerName: saleData.customerName || 'Cliente',
        customerDoc: saleData.customerDoc || '',
        issueDate: nowStr.split('T')[0],
        dueDate: installments[installments.length - 1].dueDate,
        totalAmount: duplicataPayment.amount,
        paidAmount: 0,
        balance: duplicataPayment.amount,
        installmentsCount: count,
        installments,
        status: 'ABERTA',
        notes: duplicataConfig?.notes || `Duplicata gerada da Venda nº ${newSale.saleNumber}`,
        createdAt: nowStr,
        updatedAt: nowStr
      };

      duplicatas.push(newDuplicata);
      save(STORAGE_KEYS.DUPLICATAS, duplicatas);

      // Atualiza crédito usado do cliente
      const customers = this.getCustomers();
      const cust = customers.find(c => c.id === saleData.customerId);
      if (cust) {
        cust.creditUsed += duplicataPayment.amount;
        save(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    // Salvar todas as alterações (Commit transacional)
    save(STORAGE_KEYS.PRODUCTS, products);
    save(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);
    sales.push(newSale);
    save(STORAGE_KEYS.SALES, sales);
    this.syncActiveRegister(activeRegister);

    this.logAudit('FINALIZAR_VENDA', 'VENDAS', `Venda nº ${newSale.saleNumber} finalizada com sucesso. Total: R$ ${newSale.total.toFixed(2)}.`);
    return { success: true, message: 'Venda finalizada com sucesso!', sale: newSale };
  }

  public static cancelSale(saleId: string, reason: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.canCancelSales && currentUser?.role !== 'ADMINISTRADOR') {
      return { success: false, message: 'PERMISSÃO NEGADA: Apenas administradores ou operadores autorizados podem cancelar vendas.' };
    }

    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { success: false, message: 'Venda não encontrada.' };
    if (sale.status === 'CANCELADA') return { success: false, message: 'Esta venda já está cancelada.' };

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();
    const nowStr = new Date().toISOString();

    // 1. Estorno de Estoque compensatório
    for (const item of sale.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        let prevStock = product.stock;
        let newStock = product.stock + item.quantity;

        if (item.variationId) {
          const variation = product.variations.find(v => v.id === item.variationId);
          if (variation) {
            prevStock = variation.stock;
            newStock = variation.stock + item.quantity;
            variation.stock = newStock;
            product.stock = product.variations.filter(v => v.active).reduce((sum, v) => sum + v.stock, 0);
          }
        } else {
          product.stock = newStock;
        }

        const movement: StockMovement = {
          id: `mov-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: product.id,
          productName: product.name,
          variationId: item.variationId,
          color: item.color,
          size: item.size,
          type: 'DEVOLUCAO_CLIENTE',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `Estorno de Venda nº ${sale.saleNumber}: ${reason}`,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: nowStr
        };
        stockMovements.push(movement);
      }
    }

    // 2. Se tinha Duplicata, cancela duplicata e estorna crédito
    const duplicatas = this.getDuplicatas();
    const dup = duplicatas.find(d => d.saleId === sale.id);
    if (dup) {
      dup.status = 'CANCELADA';
      dup.updatedAt = nowStr;
      save(STORAGE_KEYS.DUPLICATAS, duplicatas);

      if (dup.customerId) {
        const customers = this.getCustomers();
        const cust = customers.find(c => c.id === dup.customerId);
        if (cust) {
          cust.creditUsed = Math.max(0, cust.creditUsed - dup.balance);
          save(STORAGE_KEYS.CUSTOMERS, customers);
        }
      }
    }

    // 3. Estorno financeiro no caixa ativo para todas as formas de pagamento
    const activeRegister = this.getActiveRegister();
    if (activeRegister && activeRegister.id === sale.registerSessionId) {
      let totalCashRefund = 0;
      for (const pay of sale.payments) {
        if (pay.method === 'DINHEIRO') {
          activeRegister.totalCashSales = Math.max(0, activeRegister.totalCashSales - pay.amount);
          activeRegister.expectedCash = Math.max(0, activeRegister.expectedCash - pay.amount);
          totalCashRefund += pay.amount;
        } else if (pay.method === 'PIX') {
          activeRegister.totalPixSales = Math.max(0, activeRegister.totalPixSales - pay.amount);
        } else if (pay.method === 'DEBITO') {
          activeRegister.totalDebitSales = Math.max(0, activeRegister.totalDebitSales - pay.amount);
        } else if (pay.method === 'CREDITO') {
          activeRegister.totalCreditSales = Math.max(0, activeRegister.totalCreditSales - pay.amount);
        } else if (pay.method === 'DUPLICATA' || pay.method === 'A_PRAZO') {
          activeRegister.totalDuplicataSales = Math.max(0, activeRegister.totalDuplicataSales - pay.amount);
        }
      }

      if (totalCashRefund > 0) {
        activeRegister.movements.push({
          id: `mov-${Date.now()}`,
          registerSessionId: activeRegister.id,
          type: 'SANGRIA',
          amount: totalCashRefund,
          method: 'DINHEIRO',
          description: `Estorno de Venda Cancelada nº ${sale.saleNumber} (${reason})`,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: nowStr
        });
      }

      this.syncActiveRegister(activeRegister);
    }

    // 4. Marca venda como cancelada com auditoria
    sale.status = 'CANCELADA';
    sale.cancelReason = reason;
    sale.canceledBy = currentUser.name;
    sale.canceledAt = nowStr;

    save(STORAGE_KEYS.SALES, sales);
    save(STORAGE_KEYS.PRODUCTS, products);
    save(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);

    this.logAudit('CANCELAR_VENDA', 'VENDAS', `Venda nº ${sale.saleNumber} cancelada por ${currentUser.name}. Motivo: ${reason}`);
    return { success: true, message: `Venda nº ${sale.saleNumber} cancelada com sucesso e estoque estornado.` };
  }

  // --- DUPLICATAS E CONTAS A RECEBER ---
  public static getDuplicatas(): Duplicata[] {
    return load<Duplicata[]>(STORAGE_KEYS.DUPLICATAS, []);
  }

  public static payDuplicata(duplicataId: string, installmentNumber: number, paymentMethod: PaymentMethod): { success: boolean; message: string } {
    const duplicatas = this.getDuplicatas();
    const dup = duplicatas.find(d => d.id === duplicataId);
    if (!dup) return { success: false, message: 'Duplicata não encontrada.' };

    const installment = dup.installments.find(i => i.installmentNumber === installmentNumber);
    if (!installment) return { success: false, message: 'Parcela não encontrada.' };
    if (installment.status === 'PAGO') return { success: false, message: 'Esta parcela já foi quitada.' };

    const payAmount = installment.balance;
    installment.paidAmount += payAmount;
    installment.balance = 0;
    installment.status = 'PAGO';
    installment.paidAt = new Date().toISOString();
    installment.paymentMethod = paymentMethod;

    dup.paidAmount += payAmount;
    dup.balance = Math.max(0, dup.balance - payAmount);
    dup.status = dup.balance === 0 ? 'PAGA' : 'PARCIAL';
    dup.updatedAt = new Date().toISOString();

    // Se recebido em dinheiro e houver caixa aberto, lança no caixa
    const activeRegister = this.getActiveRegister();
    if (activeRegister && activeRegister.status === 'ABERTO') {
      if (paymentMethod === 'DINHEIRO') {
        activeRegister.totalCashInflows += payAmount;
        activeRegister.expectedCash += payAmount;
      }
      activeRegister.movements.push({
        id: `mov-${Date.now()}`,
        registerSessionId: activeRegister.id,
        type: 'RECEBIMENTO_DUPLICATA',
        amount: payAmount,
        method: paymentMethod,
        description: `Recebimento Parcela ${installmentNumber}/${dup.installmentsCount} da ${dup.documentNumber} (${dup.customerName})`,
        userId: activeRegister.operatorId,
        userName: activeRegister.operatorName,
        createdAt: new Date().toISOString()
      });
      this.syncActiveRegister(activeRegister);
    }

    // Libera limite do cliente
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === dup.customerId);
    if (cust) {
      cust.creditUsed = Math.max(0, cust.creditUsed - payAmount);
      save(STORAGE_KEYS.CUSTOMERS, customers);
    }

    save(STORAGE_KEYS.DUPLICATAS, duplicatas);
    this.logAudit('BAIXA_DUPLICATA', 'CONTAS_A_RECEBER', `Recebimento de R$ ${payAmount.toFixed(2)} da ${dup.documentNumber} parc. ${installmentNumber} via ${paymentMethod}`);
    return { success: true, message: `Parcela ${installmentNumber} de R$ ${payAmount.toFixed(2)} recebida com sucesso!` };
  }

  // --- CONTAS A PAGAR ---
  public static getBillsToPay(): BillToPay[] {
    return load<BillToPay[]>(STORAGE_KEYS.BILLS_TO_PAY, []);
  }

  public static saveBillToPay(bill: BillToPay): void {
    const bills = this.getBillsToPay();
    const idx = bills.findIndex(b => b.id === bill.id);
    if (idx >= 0) {
      bills[idx] = bill;
    } else {
      bills.push(bill);
    }
    save(STORAGE_KEYS.BILLS_TO_PAY, bills);
  }

  public static addSupplierInvoiceBill(data: {
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    accessKey?: string;
    issueDate: string;
    firstDueDate: string;
    totalAmount: number;
    installmentsCount: number;
    category?: string;
    notes?: string;
  }): { success: boolean; message: string } {
    const bills = this.getBillsToPay();
    const count = data.installmentsCount || 1;
    const installmentVal = Number((data.totalAmount / count).toFixed(2));
    const nowStr = new Date().toISOString();

    for (let i = 1; i <= count; i++) {
      const due = new Date(data.firstDueDate);
      if (i > 1) {
        due.setDate(due.getDate() + (30 * (i - 1)));
      }
      const newBill: BillToPay = {
        id: `bill-nf-${Date.now()}-${i}`,
        documentNumber: count > 1 ? `NF-${data.invoiceNumber}/${i}` : `NF-${data.invoiceNumber}`,
        description: `NF ${data.invoiceNumber} - ${data.supplierName} (${i}/${count})`,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        issueDate: data.issueDate,
        dueDate: due.toISOString().split('T')[0],
        totalAmount: i === count ? Number((data.totalAmount - (installmentVal * (count - 1))).toFixed(2)) : installmentVal,
        paidAmount: 0,
        balance: i === count ? Number((data.totalAmount - (installmentVal * (count - 1))).toFixed(2)) : installmentVal,
        status: 'PENDENTE',
        category: data.category || 'Fornecedores Têxteis',
        notes: data.notes ? (data.accessKey ? `${data.notes} | Chave NFe: ${data.accessKey}` : data.notes) : (data.accessKey ? `Chave NFe: ${data.accessKey}` : undefined),
        history: [],
        createdAt: nowStr
      };
      bills.push(newBill);
    }

    save(STORAGE_KEYS.BILLS_TO_PAY, bills);
    this.logAudit('LANCAR_NF_FORNECEDOR', 'CONTAS_A_PAGAR', `NF ${data.invoiceNumber} de ${data.supplierName} lançada em ${count}x. Total: R$ ${data.totalAmount.toFixed(2)}.`);
    return { success: true, message: `Nota Fiscal nº ${data.invoiceNumber} lançada com sucesso em ${count} parcela(s)!` };
  }

  public static addManualExpenseBill(data: {
    description: string;
    creditorName: string;
    documentNumber: string;
    category: string;
    issueDate: string;
    firstDueDate: string;
    totalAmount: number;
    installmentsCount: number;
    notes?: string;
  }): { success: boolean; message: string } {
    const bills = this.getBillsToPay();
    const count = data.installmentsCount || 1;
    const installmentVal = Number((data.totalAmount / count).toFixed(2));
    const nowStr = new Date().toISOString();

    for (let i = 1; i <= count; i++) {
      const due = new Date(data.firstDueDate);
      if (i > 1) {
        due.setDate(due.getDate() + (30 * (i - 1)));
      }
      const newBill: BillToPay = {
        id: `bill-exp-${Date.now()}-${i}`,
        documentNumber: count > 1 ? `${data.documentNumber || 'DESP'}/${i}` : (data.documentNumber || `DESP-${Date.now().toString().slice(-4)}`),
        description: count > 1 ? `${data.description} (${i}/${count})` : data.description,
        supplierName: data.creditorName,
        issueDate: data.issueDate,
        dueDate: due.toISOString().split('T')[0],
        totalAmount: i === count ? Number((data.totalAmount - (installmentVal * (count - 1))).toFixed(2)) : installmentVal,
        paidAmount: 0,
        balance: i === count ? Number((data.totalAmount - (installmentVal * (count - 1))).toFixed(2)) : installmentVal,
        status: 'PENDENTE',
        category: data.category,
        notes: data.notes,
        history: [],
        createdAt: nowStr
      };
      bills.push(newBill);
    }

    save(STORAGE_KEYS.BILLS_TO_PAY, bills);
    this.logAudit('LANCAR_DESPESA_MANUAL', 'CONTAS_A_PAGAR', `Despesa manual "${data.description}" lançada em ${count}x. Total: R$ ${data.totalAmount.toFixed(2)}.`);
    return { success: true, message: `Despesa "${data.description}" cadastrada com sucesso em ${count} parcela(s)!` };
  }

  public static payBill(billId: string, amount: number, method: PaymentMethod, payFromRegister: boolean = false): { success: boolean; message: string } {
    const bills = this.getBillsToPay();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return { success: false, message: 'Conta a pagar não encontrada.' };

    const payVal = Math.min(amount, bill.balance);

    if (payFromRegister) {
      if (method !== 'DINHEIRO') {
        return { success: false, message: 'Pagamento pelo caixa físico só é aplicável para pagamento em DINHEIRO.' };
      }
      const activeRegister = this.getActiveRegister();
      if (!activeRegister || activeRegister.status !== 'ABERTO') {
        return { success: false, message: 'Não é possível pagar pelo caixa: nenhum caixa está aberto no momento.' };
      }
      if (payVal > activeRegister.expectedCash) {
        return { success: false, message: `Saldo insuficiente no caixa. Saldo atual: R$ ${activeRegister.expectedCash.toFixed(2)}.` };
      }
      this.addRegisterMovement('DESPESA', payVal, `Pagamento Título ${bill.documentNumber}: ${bill.description}`);
    }

    bill.paidAmount += payVal;
    bill.balance -= payVal;
    bill.status = bill.balance <= 0 ? 'PAGA' : 'PARCIAL';

    const currentUser = this.getCurrentUser();
    bill.history.push({
      id: `pay-${Date.now()}`,
      paidAmount: payVal,
      paymentDate: new Date().toISOString(),
      paymentMethod: method,
      operatorName: currentUser?.name || 'Operador'
    });

    save(STORAGE_KEYS.BILLS_TO_PAY, bills);
    this.logAudit('BAIXA_CONTA_PAGAR', 'CONTAS_A_PAGAR', `Pagamento de R$ ${payVal.toFixed(2)} da conta ${bill.description}${payFromRegister ? ' (pago via Caixa Físico)' : ''}`);
    return { success: true, message: 'Baixa registrada com sucesso.' };
  }

  // --- DESPESAS ---
  public static getExpenses(): Expense[] {
    return load<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  }

  public static saveExpense(expense: Expense): { success: boolean; message: string } {
    const expenses = this.getExpenses();
    if (expense.paidFromRegister) {
      const activeRegister = this.getActiveRegister();
      if (!activeRegister || activeRegister.status !== 'ABERTO') {
        return { success: false, message: 'Não é possível pagar pelo caixa: nenhum caixa está aberto no momento.' };
      }
      if (expense.amount > activeRegister.expectedCash) {
        return { success: false, message: `Saldo insuficiente no caixa para pagar despesa. Saldo: R$ ${activeRegister.expectedCash.toFixed(2)}.` };
      }
      // Registra sangria/despesa no caixa
      this.addRegisterMovement('DESPESA', expense.amount, `Despesa: ${expense.description} (${expense.category})`);
    }

    expenses.push(expense);
    save(STORAGE_KEYS.EXPENSES, expenses);
    this.logAudit('LANCAR_DESPESA', 'DESPESAS', `Despesa de R$ ${expense.amount.toFixed(2)} (${expense.category}) lançada.`);
    return { success: true, message: 'Despesa cadastrada com sucesso!' };
  }

  // --- COMPRAS E NOTAS DE ENTRADA ---
  public static getPurchases(): Purchase[] {
    return load<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  }

  public static addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt' | 'status'>): { success: boolean; message: string; purchase?: Purchase } {
    const purchases = this.getPurchases();
    // Requisito 9: Impedir duplicação acidental da mesma nota do mesmo fornecedor
    const isDuplicate = purchases.some(p => p.supplierId === purchaseData.supplierId && p.invoiceNumber === purchaseData.invoiceNumber && p.status === 'CONFIRMADA');
    if (isDuplicate) {
      return { success: false, message: `Já existe uma compra confirmada com o número de NF ${purchaseData.invoiceNumber} para este fornecedor.` };
    }

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();
    const currentUser = this.getCurrentUser();
    const nowStr = new Date().toISOString();

    // 1. Atualizar estoque de cada item com ENTRADA_COMPRA
    for (const item of purchaseData.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        let prevStock = product.stock;
        let newStock = product.stock + item.quantity;

        // Atualiza custo do produto
        product.costPrice = item.unitCost;
        if (product.markupPercent > 0) {
          product.sellingPrice = Number((item.unitCost * (1 + product.markupPercent / 100)).toFixed(2));
        }

        if (item.variationId) {
          const variation = product.variations.find(v => v.id === item.variationId);
          if (variation) {
            prevStock = variation.stock;
            newStock = variation.stock + item.quantity;
            variation.stock = newStock;
            variation.costPrice = item.unitCost;
            product.stock = product.variations.filter(v => v.active).reduce((sum, v) => sum + v.stock, 0);
          }
        } else {
          product.stock = newStock;
        }

        const movement: StockMovement = {
          id: `mov-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: product.id,
          productName: product.name,
          variationId: item.variationId,
          color: item.color,
          size: item.size,
          type: 'ENTRADA_COMPRA',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: `Nota Fiscal nº ${purchaseData.invoiceNumber}`,
          userId: currentUser?.id || 'admin',
          userName: currentUser?.name || 'Administrador',
          createdAt: nowStr
        };
        stockMovements.push(movement);
      }
    }

    // 2. Criar registro de compra
    const nextNumber = purchases.reduce((max, p) => p.purchaseNumber > max ? p.purchaseNumber : max, 500) + 1;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      purchaseNumber: nextNumber,
      status: 'CONFIRMADA',
      createdAt: nowStr
    };
    purchases.push(newPurchase);

    // 3. Gerar Contas a Pagar parceladas automaticamente
    const count = purchaseData.installmentsCount || 1;
    const installmentVal = Number((purchaseData.totalAmount / count).toFixed(2));
    const bills = this.getBillsToPay();

    for (let i = 1; i <= count; i++) {
      const due = new Date();
      due.setDate(due.getDate() + (30 * i));
      const newBill: BillToPay = {
        id: `bill-${Date.now()}-${i}`,
        documentNumber: `NF-${purchaseData.invoiceNumber}/${i}`,
        description: `Compra NF ${purchaseData.invoiceNumber} - ${purchaseData.supplierName} (${i}/${count})`,
        supplierId: purchaseData.supplierId,
        supplierName: purchaseData.supplierName,
        issueDate: purchaseData.issueDate,
        dueDate: due.toISOString().split('T')[0],
        totalAmount: i === count ? purchaseData.totalAmount - (installmentVal * (count - 1)) : installmentVal,
        paidAmount: 0,
        balance: i === count ? purchaseData.totalAmount - (installmentVal * (count - 1)) : installmentVal,
        status: 'PENDENTE',
        category: 'Fornecedores Têxteis',
        history: [],
        createdAt: nowStr
      };
      bills.push(newBill);
    }

    save(STORAGE_KEYS.PRODUCTS, products);
    save(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);
    save(STORAGE_KEYS.PURCHASES, purchases);
    save(STORAGE_KEYS.BILLS_TO_PAY, bills);

    this.logAudit('LANCAR_COMPRA', 'COMPRAS', `Compra NF ${purchaseData.invoiceNumber} confirmada. Total: R$ ${purchaseData.totalAmount.toFixed(2)}.`);
    return { success: true, message: `Compra NF ${purchaseData.invoiceNumber} lançada com sucesso! Estoque e contas a pagar atualizados.`, purchase: newPurchase };
  }

  // --- MOVIMENTAÇÕES DE ESTOQUE ---
  public static getStockMovements(): StockMovement[] {
    return load<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  }

  public static adjustStock(productId: string, variationId: string | undefined, newQuantity: number, reason: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.canAdjustStock && currentUser?.role !== 'ADMINISTRADOR') {
      return { success: false, message: 'PERMISSÃO NEGADA: Você não possui autorização para realizar ajustes manuais de estoque.' };
    }

    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Produto não encontrado.' };

    let prevStock = product.stock;

    if (variationId) {
      const variation = product.variations.find(v => v.id === variationId);
      if (!variation) return { success: false, message: 'Variação não encontrada.' };
      prevStock = variation.stock;
      variation.stock = Number(newQuantity);
      product.stock = product.variations.filter(v => v.active).reduce((sum, v) => sum + v.stock, 0);
    } else {
      product.stock = Number(newQuantity);
    }

    const diff = Number(newQuantity) - prevStock;

    const stockMovements = this.getStockMovements();
    const movement: StockMovement = {
      id: `mov-stock-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      variationId,
      type: 'AJUSTE_MANUAL',
      quantity: diff,
      previousStock: prevStock,
      newStock: Number(newQuantity),
      reason,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString()
    };
    stockMovements.push(movement);

    save(STORAGE_KEYS.PRODUCTS, products);
    save(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);
    this.logAudit('AJUSTE_ESTOQUE', 'ESTOQUE', `Ajuste manual em ${product.name}: de ${prevStock} para ${newQuantity}. Motivo: ${reason}`);
    return { success: true, message: 'Ajuste de estoque aplicado com sucesso!' };
  }

  // --- INVENTÁRIO DE ESTOQUE ---
  public static getInventories(): Inventory[] {
    return load<Inventory[]>(STORAGE_KEYS.INVENTORIES, []);
  }

  public static startInventory(title: string, categoryFilter?: string, isBlind: boolean = false): Inventory {
    const products = this.getProducts().filter(p => p.active);
    const inventories = this.getInventories();
    const currentUser = this.getCurrentUser();

    const items: Inventory['items'] = [];
    const filtered = categoryFilter ? products.filter(p => p.category === categoryFilter) : products;

    for (const p of filtered) {
      if (p.hasVariations && p.variations.length > 0) {
        for (const v of p.variations.filter(v => v.active)) {
          items.push({
            id: `inv-item-${p.id}-${v.id}`,
            productId: p.id,
            productName: p.name,
            variationId: v.id,
            color: v.color,
            size: v.size,
            barcode: v.barcode || p.barcode,
            systemStock: v.stock,
            countedStock: 0,
            difference: -v.stock,
            isCounted: false
          });
        }
      } else {
        items.push({
          id: `inv-item-${p.id}`,
          productId: p.id,
          productName: p.name,
          barcode: p.barcode,
          systemStock: p.stock,
          countedStock: 0,
          difference: -p.stock,
          isCounted: false
        });
      }
    }

    const nextNumber = inventories.reduce((max, inv) => inv.inventoryNumber > max ? inv.inventoryNumber : max, 100) + 1;
    const newInventory: Inventory = {
      id: `inv-${Date.now()}`,
      inventoryNumber: nextNumber,
      title,
      filterCategory: categoryFilter,
      isBlindCount: isBlind,
      status: 'EM_ANDAMENTO',
      startedAt: new Date().toISOString(),
      responsibleName: currentUser?.name || 'Administrador',
      totalItems: items.length,
      itemsWithDivergence: 0,
      items
    };

    inventories.push(newInventory);
    save(STORAGE_KEYS.INVENTORIES, inventories);
    this.logAudit('INICIAR_INVENTARIO', 'INVENTÁRIO', `Inventário nº ${newInventory.inventoryNumber} iniciado (${newInventory.title}).`);
    return newInventory;
  }

  public static updateInventoryCount(inventoryId: string, itemId: string, counted: number, notes?: string): void {
    const inventories = this.getInventories();
    const inv = inventories.find(i => i.id === inventoryId);
    if (!inv || inv.status !== 'EM_ANDAMENTO') return;

    const item = inv.items.find(it => it.id === itemId);
    if (item) {
      item.countedStock = Number(counted);
      item.difference = item.countedStock - item.systemStock;
      item.isCounted = true;
      if (notes) item.notes = notes;
    }

    inv.itemsWithDivergence = inv.items.filter(it => it.isCounted && it.difference !== 0).length;
    save(STORAGE_KEYS.INVENTORIES, inventories);
  }

  public static confirmInventory(inventoryId: string): { success: boolean; message: string } {
    const inventories = this.getInventories();
    const inv = inventories.find(i => i.id === inventoryId);
    if (!inv) return { success: false, message: 'Inventário não encontrado.' };
    // Requisito 18: Evitar que duas confirmações do mesmo inventário apliquem o ajuste duas vezes
    if (inv.status === 'CONCLUIDO') return { success: false, message: 'Este inventário já foi finalizado e os ajustes já foram aplicados anteriormente.' };

    const products = this.getProducts();
    const stockMovements = this.getStockMovements();
    const currentUser = this.getCurrentUser();
    const nowStr = new Date().toISOString();

    for (const it of inv.items) {
      if (it.isCounted && it.difference !== 0) {
        const product = products.find(p => p.id === it.productId);
        if (product) {
          if (it.variationId) {
            const variation = product.variations.find(v => v.id === it.variationId);
            if (variation) {
              const prev = variation.stock;
              variation.stock = it.countedStock;
              product.stock = product.variations.filter(v => v.active).reduce((sum, v) => sum + v.stock, 0);

              stockMovements.push({
                id: `mov-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                productId: product.id,
                productName: product.name,
                variationId: it.variationId,
                color: it.color,
                size: it.size,
                type: 'AJUSTE_INVENTARIO',
                quantity: it.difference,
                previousStock: prev,
                newStock: it.countedStock,
                reason: `Ajuste do Inventário nº ${inv.inventoryNumber}: ${it.notes || 'Conferência física'}`,
                userId: currentUser?.id || 'admin',
                userName: currentUser?.name || 'Administrador',
                createdAt: nowStr
              });
            }
          } else {
            const prev = product.stock;
            product.stock = it.countedStock;

            stockMovements.push({
              id: `mov-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              productId: product.id,
              productName: product.name,
              type: 'AJUSTE_INVENTARIO',
              quantity: it.difference,
              previousStock: prev,
              newStock: it.countedStock,
              reason: `Ajuste do Inventário nº ${inv.inventoryNumber}: ${it.notes || 'Conferência física'}`,
              userId: currentUser?.id || 'admin',
              userName: currentUser?.name || 'Administrador',
              createdAt: nowStr
            });
          }
        }
      }
    }

    inv.status = 'CONCLUIDO';
    inv.finishedAt = nowStr;

    save(STORAGE_KEYS.PRODUCTS, products);
    save(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements);
    save(STORAGE_KEYS.INVENTORIES, inventories);

    this.logAudit('CONCLUIR_INVENTARIO', 'INVENTÁRIO', `Inventário nº ${inv.inventoryNumber} concluído com ${inv.itemsWithDivergence} divergências ajustadas.`);
    return { success: true, message: `Inventário nº ${inv.inventoryNumber} confirmado e ajustes de estoque aplicados com sucesso!` };
  }

  // --- BACKUP E RESTAURAÇÃO (Item 19) ---
  public static exportBackup(): string {
    const backupData = {
      app: 'LA_FITNESS_PDV',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      responsible: this.getCurrentUser()?.name || 'Administrador',
      settings: this.getSettings(),
      users: this.getUsers().map(u => ({ ...u, passwordHash: u.passwordHash || '123456' })),
      products: this.getProducts(),
      customers: this.getCustomers(),
      suppliers: this.getSuppliers(),
      sales: this.getSales(),
      stockMovements: this.getStockMovements(),
      registers: this.getRegisters(),
      duplicatas: this.getDuplicatas(),
      billsToPay: this.getBillsToPay(),
      expenses: this.getExpenses(),
      purchases: this.getPurchases(),
      inventories: this.getInventories(),
    };

    this.logAudit('GERAR_BACKUP', 'BACKUP', 'Exportação completa de backup realizada.');
    return JSON.stringify(backupData, null, 2);
  }

  public static restoreBackup(jsonString: string): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.canRestoreBackup && currentUser?.role !== 'ADMINISTRADOR') {
      return { success: false, message: 'PERMISSÃO NEGADA: Restauração de backup é restrita exclusivamente ao Administrador.' };
    }

    try {
      const data = JSON.parse(jsonString);
      // Validação estrita de integridade pré-restauração
      if (data.app !== 'LA_FITNESS_PDV' || !data.products || !Array.isArray(data.products) || !data.settings) {
        return { success: false, message: 'Arquivo de backup inválido ou incompatível com o sistema LA FITNESS.' };
      }

      if (data.settings) save(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.users && Array.isArray(data.users) && data.users.length > 0) save(STORAGE_KEYS.USERS, data.users);
      if (data.products) save(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.customers) save(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.suppliers) save(STORAGE_KEYS.SUPPLIERS, data.suppliers);
      if (data.sales) save(STORAGE_KEYS.SALES, data.sales);
      if (data.stockMovements) save(STORAGE_KEYS.STOCK_MOVEMENTS, data.stockMovements);
      if (data.registers) save(STORAGE_KEYS.REGISTERS, data.registers);
      if (data.duplicatas) save(STORAGE_KEYS.DUPLICATAS, data.duplicatas);
      if (data.billsToPay) save(STORAGE_KEYS.BILLS_TO_PAY, data.billsToPay);
      if (data.expenses) save(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.purchases) save(STORAGE_KEYS.PURCHASES, data.purchases);
      if (data.inventories) save(STORAGE_KEYS.INVENTORIES, data.inventories);

      this.logAudit('RESTAURAR_BACKUP', 'BACKUP', `Backup de ${data.timestamp} restaurado com sucesso por ${currentUser.name}.`);
      return { success: true, message: 'Banco de dados restaurado com sucesso! A página será recarregada.' };
    } catch (err: any) {
      return { success: false, message: `Erro ao processar arquivo: ${err.message}` };
    }
  }

  // --- HISTÓRICO DE BACKUPS AUTOMÁTICOS & SINCRONIZAÇÃO EM NUVEM ---
  public static getAutoBackups(): AutoBackupRecord[] {
    return load<AutoBackupRecord[]>(STORAGE_KEYS.AUTO_BACKUPS, []);
  }

  public static saveAutoBackup(record: AutoBackupRecord): void {
    const backups = this.getAutoBackups();
    backups.unshift(record);
    // Para não estourar a cota de 5MB do localStorage, retém o payload JSON completo apenas nos 2 mais recentes
    for (let i = 2; i < backups.length; i++) {
      if (backups[i].dataJson) {
        backups[i] = { ...backups[i], dataJson: '' };
      }
    }
    if (backups.length > 30) backups.pop(); // Mantém os últimos 30 snapshots
    save(STORAGE_KEYS.AUTO_BACKUPS, backups);
  }

  public static syncCloudBackup(): { success: boolean; message: string; timestamp: string; sizeBytes: number; filename: string } {
    const jsonBackup = this.exportBackup();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `cloud_backup_lafitness_${dateStr}_${timeStr}.json`;
    const sizeBytes = new Blob([jsonBackup]).size;
    const currentUser = this.getCurrentUser();
    const isCloudOnline = isSupabaseConfigured() && Boolean(supabase);

    if (isCloudOnline && supabase) {
      supabase.from('system_backups').insert([{
        type: 'NUVEM_DIARIO',
        filename,
        size_bytes: sizeBytes,
        operator_name: currentUser?.name || 'Administrador',
        data_json: JSON.parse(jsonBackup),
        status: 'SINCRONIZADO_NUVEM'
      }]).then(({ error }) => {
        if (error) console.error('Erro ao enviar backup ao Supabase:', error);
      });
    }

    const record: AutoBackupRecord = {
      id: `cloud-${Date.now()}`,
      type: 'NUVEM_DIARIO',
      filename,
      createdAt: now.toISOString(),
      operatorName: currentUser?.name || 'Administrador',
      sizeBytes,
      dataJson: jsonBackup,
      status: isCloudOnline ? 'SINCRONIZADO_NUVEM' : 'LOCAL_SALVO'
    };

    this.saveAutoBackup(record);

    const settings = this.getSettings();
    settings.lastCloudBackupAt = now.toISOString();
    this.saveSettings(settings);

    this.logAudit('BACKUP_NUVEM', 'BACKUP', `Backup ${isCloudOnline ? 'sincronizado na nuvem (Supabase)' : 'registrado localmente'} (${(sizeBytes / 1024).toFixed(1)} KB).`);
    return {
      success: true,
      message: isCloudOnline
        ? 'Snapshot de segurança sincronizado com o PostgreSQL / Supabase com sucesso!'
        : 'Snapshot de segurança gerado localmente com sucesso! (Nuvem em modo local: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env para persistência remota).',
      timestamp: now.toISOString(),
      sizeBytes,
      filename
    };
  }

  // --- LOGS DE AUDITORIA ---
  public static getAuditLogs(): AuditLog[] {
    return load<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public static logAudit(action: string, module: string, details: string): void {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys',
      userName: user?.name || 'Sistema',
      action,
      module,
      details
    };
    logs.unshift(newLog); // Mais recentes primeiro
    if (logs.length > 500) logs.pop(); // Mantém últimos 500 registros
    save(STORAGE_KEYS.AUDIT_LOGS, logs);
  }
}

// Inicializa o banco automaticamente ao importar
DatabaseService.init();
