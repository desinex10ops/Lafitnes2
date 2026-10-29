import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  ProductVariation,
  SaleItem,
  SalePayment,
  PaymentMethod,
  Customer,
  Sale
} from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDocument } from '../utils/formatters';
import { PrintReceiptModal } from '../components/common/PrintReceiptModal';
import { Modal } from '../components/common/Modal';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  Calendar,
  Truck,
  Phone
} from 'lucide-react';

interface PosScreenProps {
  onOpenCashRegister: () => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({ onOpenCashRegister }) => {
  const activeRegister = DatabaseService.getActiveRegister();
  const currentUser = DatabaseService.getCurrentUser();
  const settings = DatabaseService.getSettings();
  const products = DatabaseService.getProducts().filter(p => p.active);
  const customers = DatabaseService.getCustomers().filter(c => c.active);

  // Estados do PDV
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(
    customers.find(c => c.code === 1) || customers[0]
  );
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Modais
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspendedSales, setSuspendedSales] = useState<{ id: string; timestamp: string; customer: Customer; items: SaleItem[] }[]>([]);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados de Pagamento
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('DINHEIRO');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [creditInstallments, setCreditInstallments] = useState<number>(1);
  
  // Configuração de Duplicata
  const [duplicataInstallments, setDuplicataInstallments] = useState(1);
  const [duplicataDueDate, setDuplicataDueDate] = useState(
    new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0]
  );

  // Identificação Rápida e Auto-Cadastro do Cliente no Checkout
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickDeliveryAddress, setQuickDeliveryAddress] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleOpenPaymentRef = useRef<() => void>(() => {});

  // Mantém foco contínuo no campo de pesquisa
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [cartItems, showVariationModal, showPaymentModal, showCustomerModal]);

  // Atalhos de teclado (F2, F4, F10, Esc)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (cartItems.length > 0) {
          handleOpenPaymentRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [cartItems]);

  // Cálculos de Totais
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const total = Math.max(0, subtotal - generalDiscount);
  const totalCost = cartItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

  // Sugestões instantâneas ao digitar no campo de pesquisa
  const filteredProducts = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return products.filter(p => {
      const matchName = p.name.toLowerCase().includes(term);
      const matchCode = p.code.toString() === term;
      const matchRef = p.reference.toLowerCase().includes(term);
      const matchBarcode = p.barcode.toLowerCase().includes(term);
      const matchCat = p.category.toLowerCase().includes(term);
      const matchVar = p.hasVariations && p.variations.some(v =>
        v.active && (
          v.barcode.toLowerCase().includes(term) ||
          v.sku.toLowerCase().includes(term) ||
          v.color.toLowerCase().includes(term) ||
          v.size.toLowerCase().includes(term)
        )
      );
      return matchName || matchCode || matchRef || matchBarcode || matchCat || matchVar;
    }).slice(0, 8);
  }, [searchTerm, products]);

  // Tratamento da Pesquisa de Produtos e Código de Barras
  const handleProductSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearchFocused(true);
    if (!term.trim()) return;

    // Busca por código de barras exato (leitor óptico USB)
    const exactBarcodeProduct = products.find(p => p.barcode === term.trim());
    if (exactBarcodeProduct) {
      handleSelectProduct(exactBarcodeProduct);
      setSearchTerm('');
      setIsSearchFocused(false);
      return;
    }

    // Busca por código de barras exato de variação
    for (const p of products) {
      if (p.hasVariations) {
        const v = p.variations.find(v => v.barcode === term.trim() && v.active);
        if (v) {
          addItemToCart(p, v);
          setSearchTerm('');
          setIsSearchFocused(false);
          return;
        }
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = searchTerm.trim().toLowerCase();
      if (!clean) return;

      // Se houver sugestões na lista instantânea, adiciona a primeira
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
        setSearchTerm('');
        setIsSearchFocused(false);
        return;
      }

      const found = products.find(
        p => p.barcode === clean ||
             p.code.toString() === clean ||
             p.reference.toLowerCase() === clean ||
             p.name.toLowerCase().includes(clean)
      );

      if (found) {
        handleSelectProduct(found);
        setSearchTerm('');
        setIsSearchFocused(false);
      } else {
        setErrorMessage(`Produto não encontrado com o termo: "${searchTerm}"`);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setErrorMessage('');
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      setPendingProduct(product);
      setShowVariationModal(true);
    } else {
      addItemToCart(product);
    }
  };

  const addItemToCart = (product: Product, variation?: ProductVariation) => {
    const existingIndex = cartItems.findIndex(
      item => item.productId === product.id && item.variationId === variation?.id
    );

    const availableStock = variation ? variation.stock : product.stock;
    const currentQtyInCart = existingIndex >= 0 ? cartItems[existingIndex].quantity : 0;

    if (currentQtyInCart + 1 > availableStock) {
      setErrorMessage(
        `ESTOQUE INSUFICIENTE: ${product.name} ${variation ? `(${variation.color}/${variation.size})` : ''} possui apenas ${availableStock} unidades em estoque.`
      );
      return;
    }

    const unitPrice = variation?.sellingPrice || product.sellingPrice;
    const costPrice = variation?.costPrice || product.costPrice;

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].totalPrice = newQty * updated[existingIndex].unitPrice;
      setCartItems(updated);
    } else {
      const newItem: SaleItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        saleId: '',
        productId: product.id,
        productName: product.name,
        variationId: variation?.id,
        color: variation?.color,
        size: variation?.size,
        barcode: variation?.barcode || product.barcode,
        imageUrl: product.imageUrl,
        quantity: 1,
        unitPrice,
        costPrice,
        discountPercent: 0,
        discountAmount: 0,
        totalPrice: unitPrice
      };
      setCartItems([...cartItems, newItem]);
    }

    setShowVariationModal(false);
    setPendingProduct(null);
  };

  const updateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    const item = cartItems[index];
    const product = products.find(p => p.id === item.productId);
    const variation = item.variationId ? product?.variations.find(v => v.id === item.variationId) : null;
    const availableStock = variation ? variation.stock : (product?.stock || 0);

    if (newQty > availableStock) {
      setErrorMessage(`Estoque máximo disponível: ${availableStock} unidades.`);
      return;
    }

    const updated = [...cartItems];
    updated[index].quantity = newQty;
    updated[index].totalPrice = newQty * updated[index].unitPrice;
    setCartItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
  };

  const clearCart = () => {
    if (cartItems.length > 0 && !window.confirm('Deseja realmente cancelar esta venda e limpar todos os itens?')) {
      return;
    }
    setCartItems([]);
    setGeneralDiscount(0);
    setNotes('');
    setPayments([]);
    setErrorMessage('');
  };

  // Vendas Suspensas
  const handleSuspendSale = () => {
    if (cartItems.length === 0) return;
    const newSuspended = {
      id: `susp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      customer: selectedCustomer,
      items: [...cartItems]
    };
    setSuspendedSales([...suspendedSales, newSuspended]);
    setCartItems([]);
    setGeneralDiscount(0);
    alert('Venda suspensa com sucesso! O caixa está livre para a próxima venda.');
  };

  const handleResumeSale = (id: string) => {
    const sale = suspendedSales.find(s => s.id === id);
    if (!sale) return;
    setCartItems(sale.items);
    setSelectedCustomer(sale.customer);
    setSuspendedSales(suspendedSales.filter(s => s.id !== id));
    setShowSuspendedModal(false);
  };

  // Fluxo de Pagamento
  const handleOpenPayment = () => {
    if (!activeRegister || activeRegister.status !== 'ABERTO') {
      alert('ATENÇÃO: O Caixa está FECHADO. É necessário abrir o caixa antes de concluir vendas.');
      onOpenCashRegister();
      return;
    }

    if (cartItems.length === 0) {
      alert('Adicione pelo menos 1 produto no carrinho.');
      return;
    }

    setPayments([]);
    setCurrentPaymentAmount(total.toFixed(2));
    setReceivedCash(total.toFixed(2));
    setCreditInstallments(1);

    if (selectedCustomer && selectedCustomer.code !== 1) {
      setQuickCustomerName(selectedCustomer.name);
      setQuickCustomerPhone(selectedCustomer.phone || '');
      setQuickDeliveryAddress(selectedCustomer.address || '');
    } else {
      setQuickCustomerName('');
      setQuickCustomerPhone('');
      setQuickDeliveryAddress('');
    }

    setShowPaymentModal(true);
  };
  handleOpenPaymentRef.current = handleOpenPayment;

  const totalPaidSoFar = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingToPay = Math.max(0, total - totalPaidSoFar);

  const handleAddPayment = () => {
    const amount = Number(parseFloat(currentPaymentAmount).toFixed(2));
    if (isNaN(amount) || amount <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    if (amount > remainingToPay + 0.01) {
      alert(`Valor informado excede o saldo restante a pagar (R$ ${remainingToPay.toFixed(2)}).`);
      return;
    }

    if (selectedMethod === 'DUPLICATA' || selectedMethod === 'A_PRAZO') {
      const isIdentified = (selectedCustomer && selectedCustomer.code !== 1) || quickCustomerName.trim().length > 0;
      if (!isIdentified) {
        alert('DUPLICATA EXIGE CLIENTE IDENTIFICADO: Informe o nome do cliente no campo acima ou selecione um cliente cadastrado.');
        return;
      }
    }

    let change = 0;
    let recAmount = amount;
    if (selectedMethod === 'DINHEIRO') {
      const rec = Number(parseFloat(receivedCash).toFixed(2));
      if (!isNaN(rec) && rec > amount) {
        change = rec - amount;
        recAmount = rec;
      }
    }

    const newPayment: SalePayment = {
      id: `pay-${Date.now()}`,
      saleId: '',
      method: selectedMethod,
      amount,
      receivedAmount: recAmount,
      changeAmount: change,
      installments: selectedMethod === 'CREDITO'
        ? creditInstallments
        : (selectedMethod === 'DUPLICATA' || selectedMethod === 'A_PRAZO')
          ? duplicataInstallments
          : 1
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);

    const newRemaining = Math.max(0, total - updatedPayments.reduce((acc, p) => acc + p.amount, 0));
    setCurrentPaymentAmount(newRemaining.toFixed(2));
    setReceivedCash(newRemaining.toFixed(2));
  };

  const removePayment = (index: number) => {
    const updated = payments.filter((_, i) => i !== index);
    setPayments(updated);
    const newRemaining = Math.max(0, total - updated.reduce((acc, p) => acc + p.amount, 0));
    setCurrentPaymentAmount(newRemaining.toFixed(2));
  };

  // Finalizar Venda Atômica
  const handleFinalizeSale = () => {
    if (Math.abs(totalPaidSoFar - total) > 0.05) {
      alert(`A soma dos pagamentos (R$ ${totalPaidSoFar.toFixed(2)}) deve ser exatamente igual ao total (R$ ${total.toFixed(2)}).`);
      return;
    }

    // Processar Identificação / Auto-Cadastro de Cliente
    let customerToUse = selectedCustomer;
    const nameClean = quickCustomerName.trim();
    const phoneClean = quickCustomerPhone.trim();
    const addressClean = quickDeliveryAddress.trim();

    if (nameClean && nameClean.toUpperCase() !== 'CONSUMIDOR FINAL') {
      const allCustomers = DatabaseService.getCustomers();
      const matched = allCustomers.find(c =>
        c.name.trim().toLowerCase() === nameClean.toLowerCase() ||
        (phoneClean && c.phone && c.phone.trim() === phoneClean)
      );

      if (matched) {
        customerToUse = matched;
        let needsSave = false;
        if (phoneClean && !matched.phone) {
          matched.phone = phoneClean;
          needsSave = true;
        }
        if (addressClean && !matched.address) {
          matched.address = addressClean;
          needsSave = true;
        }
        if (needsSave) {
          DatabaseService.saveCustomer(matched);
        }
      } else {
        // Auto-cadastra novo cliente no banco de dados
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          code: 0,
          name: nameClean.toUpperCase(),
          document: '',
          phone: phoneClean,
          email: '',
          address: addressClean,
          city: settings.city || 'São Paulo',
          state: settings.state || 'SP',
          creditLimit: 1000,
          creditUsed: 0,
          active: true,
          notes: addressClean ? 'Auto-cadastrado via PDV com endereço de entrega.' : 'Auto-cadastrado via PDV.',
          createdAt: new Date().toISOString()
        };
        DatabaseService.saveCustomer(newCustomer);
        customerToUse = newCustomer;
      }
      setSelectedCustomer(customerToUse);
    }

    let finalNotes = notes.trim();
    if (addressClean) {
      finalNotes = finalNotes ? `${finalNotes} | ENTREGA: ${addressClean}` : `ENTREGA: ${addressClean}`;
    }
    if (phoneClean && !finalNotes.includes(phoneClean)) {
      finalNotes = finalNotes ? `${finalNotes} | CONTATO: ${phoneClean}` : `CONTATO: ${phoneClean}`;
    }

    const salePayload = {
      registerSessionId: activeRegister!.id,
      operatorId: currentUser?.id || activeRegister!.operatorId,
      operatorName: currentUser?.name || activeRegister!.operatorName,
      customerId: customerToUse?.id,
      customerName: customerToUse?.name,
      customerDoc: customerToUse?.document,
      subtotal,
      discountAmount: generalDiscount,
      total,
      totalCost,
      notes: finalNotes,
      items: cartItems,
      payments
    };

    const result = DatabaseService.finalizeSale(salePayload, {
      installmentsCount: duplicataInstallments,
      firstDueDate: duplicataDueDate,
      notes: finalNotes
    });

    if (!result.success) {
      alert(`ERRO AO FINALIZAR VENDA: ${result.message}`);
      return;
    }

    // Sucesso!
    setShowPaymentModal(false);
    setCompletedSale(result.sale!);
    setShowReceiptModal(true);

    // Limpa a tela para a próxima venda
    setCartItems([]);
    setGeneralDiscount(0);
    setNotes('');
    setPayments([]);
    setQuickCustomerName('');
    setQuickCustomerPhone('');
    setQuickDeliveryAddress('');
    setSelectedCustomer(customers.find(c => c.code === 1) || customers[0]);
    searchInputRef.current?.focus();
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-3">
      {/* Alerta de Caixa Fechado */}
      {(!activeRegister || activeRegister.status !== 'ABERTO') && (
        <div className="p-3 bg-red-950 border border-red-700 text-red-100 rounded-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs font-bold uppercase">
              O Caixa está FECHADO. Abra o caixa para autorizar a conclusão de vendas.
            </span>
          </div>
          <button
            onClick={onOpenCashRegister}
            className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-bold uppercase"
          >
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* Grid Principal do PDV: Esquerda = Produtos / Itens; Direita = Totais e Operação */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* COLUNA ESQUERDA: Busca e Lista de Itens do Cupom */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
          {/* Barra de Pesquisa de Produtos */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleProductSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Digite o nome, código ou bipe o código de barras do produto fitness..."
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm font-semibold placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
              />

              {/* DROPDOWN / AUTOCOMPLETE INSTANTÂNEO DE PRODUTOS */}
              {searchTerm.trim().length > 0 && isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-emerald-500/60 rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-800">
                  <div className="px-3 py-2 bg-slate-950/95 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-800">
                    <span>
                      {filteredProducts.length} PRODUTO(S) ENCONTRADO(S)
                    </span>
                    <span className="text-emerald-400 text-[10px]">
                      CLIQUE OU PRESSIONE ENTER PARA INSERIR
                    </span>
                  </div>

                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const totalStock = p.hasVariations
                        ? p.variations.filter(v => v.active).reduce((sum, v) => sum + v.stock, 0)
                        : p.stock;
                      return (
                        <div
                          key={p.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectProduct(p);
                            setSearchTerm('');
                            setIsSearchFocused(false);
                          }}
                          className="p-3 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-700 bg-slate-950 shrink-0 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 bg-slate-950/80 flex items-center justify-center text-slate-500 shrink-0">
                                <ShoppingCart className="w-5 h-5 text-slate-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white uppercase truncate flex items-center gap-2">
                                <span>{p.name}</span>
                                {p.hasVariations && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase shrink-0">
                                    {p.variations.length} Variações
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono">Cód: {p.code}</span>
                                <span>•</span>
                                <span>Ref: {p.reference}</span>
                                <span>•</span>
                                <span className="text-slate-300 font-semibold">{p.category}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              {formatCurrency(p.sellingPrice)}
                            </div>
                            <div className="text-[11px] font-semibold mt-0.5">
                              {totalStock > 0 ? (
                                <span className="text-emerald-300">{totalStock} em estoque</span>
                              ) : (
                                <span className="text-red-400 font-bold">SEM ESTOQUE</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Nenhum produto fitness encontrado com o termo "<span className="text-white font-bold">{searchTerm}</span>".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vendas Suspensas */}
            {suspendedSales.length > 0 && (
              <button
                onClick={() => setShowSuspendedModal(true)}
                className="px-3 py-3 bg-amber-600/30 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-amber-600/40"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Retomar ({suspendedSales.length})</span>
              </button>
            )}
          </div>

          {/* Mensagem de Erro Temporária */}
          {errorMessage && (
            <div className="px-4 py-2 bg-red-950/80 border-b border-red-800 text-red-200 text-xs flex justify-between items-center">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="font-bold underline text-[10px]">
                OK
              </button>
            </div>
          )}

          {/* Tabela de Itens Adicionados */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
                <ShoppingCart className="w-16 h-16 text-slate-700 stroke-1" />
                <p className="text-sm font-bold uppercase text-slate-400 tracking-wider">
                  CAIXA LIVRE — AGUARDANDO PRODUTOS
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Utilize o leitor óptico de código de barras USB ou pesquise pelo nome/código para adicionar à lista.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">ITEM</th>
                    <th className="py-2.5 px-3">DESCRIÇÃO DO PRODUTO</th>
                    <th className="py-2.5 px-3 text-center w-28">TAM / COR</th>
                    <th className="py-2.5 px-3 text-center w-28">QTD</th>
                    <th className="py-2.5 px-3 text-right w-24">UNIT.</th>
                    <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium text-slate-200">
                  {cartItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-9 h-9 object-cover rounded border border-slate-700 bg-slate-950 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded border border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-500 shrink-0">
                              <ShoppingCart className="w-4 h-4 text-slate-600" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="font-bold text-white uppercase truncate">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Cód: {item.barcode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.size || item.color ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-bold border border-slate-700">
                            {item.color} / {item.size}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold w-6 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Rodapé da Coluna Esquerda com Atalhos */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-emerald-400 font-bold">F2</kbd> Pesquisa</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-emerald-400 font-bold">F4</kbd> Cliente</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-emerald-400 font-bold">F10</kbd> Finalizar</span>
            </div>
            <span>{cartItems.reduce((acc, i) => acc + i.quantity, 0)} itens no cupom</span>
          </div>
        </div>

        {/* COLUNA DIREITA: Cliente, Totais, Pagamentos e Ações */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card do Cliente Selecionado */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2.5 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                CLIENTE (F4)
              </span>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase underline"
              >
                ALTERAR
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="font-bold text-white text-sm truncate">
                {selectedCustomer.name}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex justify-between">
                <span>Doc: {formatDocument(selectedCustomer.document)}</span>
                {selectedCustomer.creditLimit > 0 && (
                  <span className="text-emerald-400">
                    Limite: {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.creditUsed)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card de Totais do Cupom */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-md space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-bold uppercase">
                <span>SUBTOTAL</span>
                <span className="font-mono text-slate-200 text-sm">{formatCurrency(subtotal)}</span>
              </div>

              {/* Campo de Desconto Geral */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">DESCONTO (R$)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={generalDiscount || ''}
                  onChange={(e) => setGeneralDiscount(Number(parseFloat(e.target.value) || 0))}
                  placeholder="0,00"
                  className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-sm text-red-400 font-bold focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  TOTAL A PAGAR
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono mt-1 tracking-tight">
                  {formatCurrency(total)}
                </div>
              </div>
            </div>

            {/* Botões de Ação Final */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleOpenPayment}
                disabled={cartItems.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CreditCard className="w-5 h-5" />
                <span>FINALIZAR VENDA (F10)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSuspendSale}
                  disabled={cartItems.length === 0}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  <span>SUSPENDER</span>
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cartItems.length === 0}
                  className="py-2.5 bg-slate-800 hover:bg-red-950/80 hover:text-red-300 disabled:opacity-40 text-slate-300 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>CANCELAR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: SELEÇÃO DE GRADE / VARIAÇÃO (Tamanho e Cor) */}
      <Modal
        isOpen={showVariationModal}
        onClose={() => {
          setShowVariationModal(false);
          setPendingProduct(null);
        }}
        title={`SELECIONE A VARIAÇÃO — ${pendingProduct?.name}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {pendingProduct?.imageUrl && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-3">
              <img
                src={pendingProduct.imageUrl}
                alt={pendingProduct.name}
                className="w-16 h-16 object-cover rounded-lg border border-slate-700 bg-slate-900 shadow-md"
              />
              <div>
                <h3 className="text-sm font-black text-white uppercase">{pendingProduct.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Ref: {pendingProduct.reference} | Categoria: {pendingProduct.category}</p>
                <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{formatCurrency(pendingProduct.sellingPrice)}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-slate-300">
            Selecione a combinação de cor e tamanho para dar baixa no estoque exato da peça vendida:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
            {pendingProduct?.variations
              .filter(v => v.active)
              .map((variation) => {
                const isOutOfStock = variation.stock <= 0;
                return (
                  <button
                    key={variation.id}
                    disabled={isOutOfStock}
                    onClick={() => addItemToCart(pendingProduct, variation)}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-950/50 border-red-900/40 opacity-50 cursor-not-allowed'
                        : 'bg-slate-950 border-slate-700 hover:border-emerald-500 hover:bg-slate-800/80 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-white uppercase">
                        {variation.color} — TAM: {variation.size}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatCurrency(variation.sellingPrice || pendingProduct.sellingPrice)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs flex justify-between text-slate-400">
                      <span>SKU: {variation.sku}</span>
                      <span className={variation.stock > 0 ? 'text-emerald-300 font-bold' : 'text-red-400 font-bold'}>
                        {variation.stock > 0 ? `${variation.stock} em estoque` : 'SEM ESTOQUE'}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: SELEÇÃO DE CLIENTE */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="SELEÇÃO DE CLIENTE (F4)"
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomer(c);
                  setShowCustomerModal(false);
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${
                  selectedCustomer.id === c.id ? 'bg-emerald-950 border border-emerald-600' : 'hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-white uppercase">{c.name}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    Doc: {formatDocument(c.document)} | Tel: {c.phone}
                  </div>
                </div>
                {c.creditLimit > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Limite Disponível</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatCurrency(c.creditLimit - c.creditUsed)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL 3: PAGAMENTO E DUPLICATAS (SPLIT PAYMENT) */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="FINALIZAÇÃO DE VENDA & PAGAMENTO"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Resumo do Total */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-center font-mono">
            <div>
              <span className="text-[11px] text-slate-400 font-sans block uppercase font-bold">TOTAL DA VENDA</span>
              <span className="text-lg font-black text-white">{formatCurrency(total)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-sans block uppercase font-bold">VALOR LANÇADO</span>
              <span className="text-lg font-black text-emerald-400">{formatCurrency(totalPaidSoFar)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-sans block uppercase font-bold">RESTANTE</span>
              <span className={`text-lg font-black ${remainingToPay > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                {formatCurrency(remainingToPay)}
              </span>
            </div>
          </div>

          {/* IDENTIFICAÇÃO DO CLIENTE / CADASTRO AUTOMÁTICO & ENTREGA */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                IDENTIFICAÇÃO DO CLIENTE & ENTREGA
              </span>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold uppercase flex items-center gap-1"
              >
                <span>Buscar na lista (F4)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  NOME DO CLIENTE (CADASTRA AUTOMATICAMENTE)
                </label>
                <input
                  type="text"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  placeholder="Ex: Mariana Silva..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-semibold focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  CONTATO / WHATSAPP
                </label>
                <input
                  type="text"
                  value={quickCustomerPhone}
                  onChange={(e) => setQuickCustomerPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-mono font-semibold focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                ENDEREÇO DE ENTREGA <span className="text-slate-500 font-normal lowercase">(opcional - preencha em caso de entrega)</span>
              </label>
              <input
                type="text"
                value={quickDeliveryAddress}
                onChange={(e) => setQuickDeliveryAddress(e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade (opcional)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-semibold focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Seletor de Forma de Pagamento */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              FORMA DE PAGAMENTO
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'DINHEIRO', label: 'DINHEIRO', icon: Banknote },
                { id: 'PIX', label: 'PIX', icon: QrCode },
                { id: 'DEBITO', label: 'DÉBITO', icon: CreditCard },
                { id: 'CREDITO', label: 'CRÉDITO', icon: CreditCard },
                { id: 'A_PRAZO', label: 'A PRAZO', icon: Calendar },
                { id: 'DUPLICATA', label: 'DUPLICATA', icon: FileText },
              ].map(method => {
                const Icon = method.icon;
                const isSel = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                    className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSel
                        ? 'bg-emerald-600 border-emerald-500 text-white font-black shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos Específicos por Modalidade */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  VALOR DESTA FORMA (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentPaymentAmount}
                  onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono font-bold text-sm focus:border-emerald-500"
                />
              </div>

              {selectedMethod === 'DINHEIRO' && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                    VALOR RECEBIDO EM ESPÉCIE (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receivedCash}
                    onChange={(e) => setReceivedCash(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono font-bold text-sm focus:border-emerald-500"
                  />
                  {parseFloat(receivedCash) > parseFloat(currentPaymentAmount) && (
                    <div className="text-xs font-bold text-emerald-400 mt-1 font-mono">
                      TROCO A DEVOLVER: {formatCurrency(parseFloat(receivedCash) - parseFloat(currentPaymentAmount))}
                    </div>
                  )}
                </div>
              )}

              {selectedMethod === 'CREDITO' && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                    PARCELAMENTO NO CARTÃO (1x A 12x)
                  </label>
                  <select
                    value={creditInstallments}
                    onChange={(e) => setCreditInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-bold focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                      const currentVal = parseFloat(currentPaymentAmount) || remainingToPay || total;
                      const perInst = currentVal / num;
                      return (
                        <option key={num} value={num}>
                          {num}x de {formatCurrency(perInst)} sem juros (Total: {formatCurrency(currentVal)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {(selectedMethod === 'DUPLICATA' || selectedMethod === 'A_PRAZO') && (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                      NÚMERO DE PARCELAS
                    </label>
                    <select
                      value={duplicataInstallments}
                      onChange={(e) => setDuplicataInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm font-bold"
                    >
                      <option value="1">1x (30 dias)</option>
                      <option value="2">2x (30 / 60 dias)</option>
                      <option value="3">3x (30 / 60 / 90 dias)</option>
                      <option value="4">4x (30 / 60 / 90 / 120 dias)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                      PRIMEIRO VENCIMENTO
                    </label>
                    <input
                      type="date"
                      value={duplicataDueDate}
                      onChange={(e) => setDuplicataDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddPayment}
              disabled={remainingToPay <= 0}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 border border-emerald-600/50 rounded font-bold text-xs uppercase transition-colors"
            >
              + ADICIONAR FORMA DE PAGAMENTO
            </button>
          </div>

          {/* Lista de Pagamentos Lançados */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                PAGAMENTOS REGISTRADOS:
              </span>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                {payments.map((p, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white uppercase">{p.method}</span>
                      {p.installments && p.installments > 1 && (
                        <span className="text-emerald-400 font-bold ml-2">
                          ({p.installments}x de {formatCurrency(p.amount / p.installments)})
                        </span>
                      )}
                      {p.changeAmount && p.changeAmount > 0 ? (
                        <span className="text-emerald-400 ml-2 font-mono">
                          (Rec: {formatCurrency(p.receivedAmount)} / Troco: {formatCurrency(p.changeAmount)})
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-200">
                        {formatCurrency(p.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePayment(idx)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Finalização Real */}
          <button
            type="button"
            onClick={handleFinalizeSale}
            disabled={remainingToPay > 0.05}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider rounded-lg shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CONFIRMAR E EMITIR COMPROVANTE</span>
          </button>
        </div>
      </Modal>

      {/* MODAL 4: RECIBO IMPRESSO */}
      <PrintReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
        settings={settings}
      />

      {/* MODAL 5: RETOMAR VENDA SUSPENSA */}
      <Modal
        isOpen={showSuspendedModal}
        onClose={() => setShowSuspendedModal(false)}
        title="VENDAS SUSPENSAS NO CAIXA"
        maxWidth="md"
      >
        <div className="space-y-3">
          {suspendedSales.map((sale) => (
            <div
              key={sale.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="text-xs font-bold text-white uppercase">{sale.customer.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {sale.items.length} itens | Suspensa às {sale.timestamp}
                </p>
              </div>
              <button
                onClick={() => handleResumeSale(sale.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase"
              >
                Retomar
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
