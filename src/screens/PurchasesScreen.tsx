import React, { useState } from 'react';
import { Purchase, PurchaseItem } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  Truck,
  Plus,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

export const PurchasesScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const purchases = DatabaseService.getPurchases();
  const suppliers = DatabaseService.getSuppliers().filter(s => s.active);
  const products = DatabaseService.getProducts().filter(p => p.active);

  // Formulário de Nova Compra
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState('30 dias');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Itens da compra sendo lançada
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemUnitCost, setItemUnitCost] = useState<number>(0);

  const subtotal = purchaseItems.reduce((acc, item) => acc + item.totalCost, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + freightAmount + otherExpenses);

  const handleOpenNewPurchase = () => {
    setInvoiceNumber(`NF-${Math.floor(1000 + Math.random() * 9000)}`);
    setAccessKey('');
    setFreightAmount(0);
    setDiscountAmount(0);
    setOtherExpenses(0);
    setPaymentTerms('30 dias');
    setInstallmentsCount(1);
    setNotes('');
    setPurchaseItems([]);
    setSelectedProductId(products[0]?.id || '');
    if (products[0]) {
      setItemUnitCost(products[0].costPrice);
      if (products[0].hasVariations && products[0].variations.length > 0) {
        setSelectedVariationId(products[0].variations[0].id);
      } else {
        setSelectedVariationId('');
      }
    }
    setShowPurchaseModal(true);
  };

  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemUnitCost(prod.costPrice);
      if (prod.hasVariations && prod.variations.length > 0) {
        setSelectedVariationId(prod.variations[0].id);
      } else {
        setSelectedVariationId('');
      }
    }
  };

  const handleAddItem = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (prod.hasVariations && prod.variations && prod.variations.length > 0 && !selectedVariationId) {
      alert('SELEÇÃO OBRIGATÓRIA: Este produto possui grade de variações. Selecione o tamanho e cor.');
      return;
    }

    const variation = selectedVariationId ? prod.variations.find(v => v.id === selectedVariationId) : null;
    const qty = Number(itemQuantity);
    const cost = Number(itemUnitCost);

    if (qty <= 0 || cost <= 0) {
      alert('Informe quantidade e custo unitário válidos.');
      return;
    }

    const newItem: PurchaseItem = {
      id: `pur-item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      variationId: variation?.id,
      color: variation?.color,
      size: variation?.size,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost
    };

    setPurchaseItems([...purchaseItems, newItem]);
    setItemQuantity(10);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Informe o número da Nota Fiscal.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Adicione pelo menos um item à compra.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
      alert('Selecione um fornecedor.');
      return;
    }

    const payload = {
      invoiceNumber: invoiceNumber.trim(),
      accessKey: accessKey.trim(),
      supplierId: supplier.id,
      supplierName: supplier.tradeName,
      issueDate,
      entryDate,
      subtotal,
      discountAmount,
      freightAmount,
      otherExpenses,
      totalAmount,
      paymentTerms,
      installmentsCount,
      notes,
      items: purchaseItems
    };

    const res = DatabaseService.addPurchase(payload);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowPurchaseModal(false);
  };

  const filteredPurchases = purchases.filter((p) => {
    return (
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            COMPRAS, ENTRADA DE NOTAS & FORNECEDORES
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Entrada de estoque de fábrica e geração automática de títulos no Contas a Pagar
          </p>
        </div>

        <button
          onClick={handleOpenNewPurchase}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          LANÇAR COMPRA / NOTA FISCAL
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por número da nota fiscal ou fornecedor..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
        />
      </div>

      {/* Tabela de Compras Lançadas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">COMPRA Nº</th>
                <th className="py-3 px-3">Nº DA NOTA</th>
                <th className="py-3 px-3">FORNECEDOR</th>
                <th className="py-3 px-3">DATA ENTRADA</th>
                <th className="py-3 px-3 text-center">ITENS</th>
                <th className="py-3 px-3 text-center">CONDIÇÃO</th>
                <th className="py-3 px-3 text-right">VALOR TOTAL</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-bold uppercase">
                    Nenhuma compra registrada até o momento.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">
                      #{pur.purchaseNumber}
                    </td>
                    <td className="py-3 px-3 font-bold text-white uppercase">
                      {pur.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-300 uppercase">
                      {pur.supplierName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {formatDate(pur.entryDate)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {pur.items.reduce((acc, i) => acc + i.quantity, 0)} un
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold">
                        {pur.paymentTerms} ({pur.installmentsCount}x)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(pur.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {pur.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPurchase(pur);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Ver detalhes da nota"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE LANÇAMENTO DE COMPRA */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="LANÇAR COMPRA DE FORNECEDOR / ENTRADA DE NOTA"
        maxWidth="4xl"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">FORNECEDOR</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs uppercase font-bold"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.tradeName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">NÚMERO DA NOTA FISCAL (NF)</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ex: NF-1045"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">CHAVE DE ACESSO (OPCIONAL)</label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="44 dígitos..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">DATA DE EMISSÃO</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">DATA DE ENTRADA</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">CONDIÇÕES DE PAGTO</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                <option value="À Vista">À Vista</option>
                <option value="30 dias">30 dias</option>
                <option value="30 / 60 dias">30 / 60 dias</option>
                <option value="30 / 60 / 90 dias">30 / 60 / 90 dias</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">QTD PARCELAS A PAGAR</label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono font-bold"
              >
                <option value="1">1 parcela</option>
                <option value="2">2 parcelas</option>
                <option value="3">3 parcelas</option>
                <option value="4">4 parcelas</option>
              </select>
            </div>
          </div>

          {/* Adicionar Itens da Compra */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              ADICIONAR PRODUTOS À NOTA:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">PRODUTO</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white uppercase font-bold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">GRADE (COR / TAM)</label>
                <select
                  value={selectedVariationId}
                  onChange={(e) => setSelectedVariationId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-bold"
                >
                  {products.find(p => p.id === selectedProductId)?.variations?.map(v => (
                    <option key={v.id} value={v.id}>{v.color} - Tam: {v.size}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">QTD</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono font-bold text-center"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">CUSTO UNIT. (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemUnitCost}
                  onChange={(e) => setItemUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-emerald-400 font-mono font-bold text-right"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold uppercase border border-slate-700"
            >
              + INCLUIR ITEM NA NOTA
            </button>
          </div>

          {/* Lista de Itens Inseridos */}
          {purchaseItems.length > 0 && (
            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3">PRODUTO</th>
                    <th className="py-2 px-3 text-center">GRADE</th>
                    <th className="py-2 px-3 text-center">QTD</th>
                    <th className="py-2 px-3 text-right">CUSTO UNIT.</th>
                    <th className="py-2 px-3 text-right">TOTAL</th>
                    <th className="py-2 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {purchaseItems.map((item, idx) => (
                    <tr key={idx} className="bg-slate-900">
                      <td className="py-2 px-3 uppercase font-semibold">{item.productName}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-400">{item.color} / {item.size}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.unitCost)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(item.totalCost)}</td>
                      <td className="py-2 px-2 text-center">
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totais e Frete */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold">SUBTOTAL</span>
              <span className="text-white font-mono font-bold text-sm">{formatCurrency(subtotal)}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">FRETE (R$)</span>
              <input
                type="number"
                step="0.01"
                value={freightAmount}
                onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold">DESCONTO (R$)</span>
              <input
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-red-400 font-mono text-xs"
              />
            </div>
            <div className="text-right">
              <span className="text-slate-400 block uppercase font-bold">TOTAL DA NOTA</span>
              <span className="text-emerald-400 font-mono font-black text-base">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowPurchaseModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={purchaseItems.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs font-bold uppercase shadow"
            >
              CONFIRMAR ENTRADA DE NOTA
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE DETALHES DA NOTA */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`DETALHES DA COMPRA — ${selectedPurchase?.invoiceNumber}`}
        maxWidth="lg"
      >
        {selectedPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-bold">Fornecedor:</span>
                <span className="text-white font-bold">{selectedPurchase.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Data Entrada:</span>
                <span className="text-white font-mono">{formatDate(selectedPurchase.entryDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Condição:</span>
                <span className="text-white">{selectedPurchase.paymentTerms}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Total da Nota:</span>
                <span className="text-emerald-400 font-mono font-bold">{formatCurrency(selectedPurchase.totalAmount)}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3">PRODUTO</th>
                    <th className="py-2 px-3 text-center">GRADE</th>
                    <th className="py-2 px-3 text-center">QTD</th>
                    <th className="py-2 px-3 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {selectedPurchase.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 uppercase">{it.productName}</td>
                      <td className="py-2 px-3 text-center">{it.color} / {it.size}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(it.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
