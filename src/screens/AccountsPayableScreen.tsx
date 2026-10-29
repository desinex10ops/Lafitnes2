import React, { useState } from 'react';
import { BillToPay, PaymentMethod } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  ArrowDownCircle,
  Search,
  CheckCircle2,
  FileText,
  Receipt
} from 'lucide-react';

export const AccountsPayableScreen: React.FC = () => {
  const [bills, setBills] = useState<BillToPay[]>(DatabaseService.getBillsToPay());
  const suppliers = DatabaseService.getSuppliers();
  const settings = DatabaseService.getSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'PAGA'>('PENDENTE');

  // Modal de Baixa de Conta
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillToPay | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [payFromRegister, setPayFromRegister] = useState(false);

  // Modal 1: Lançar NF de Fornecedor
  const [showNfModal, setShowNfModal] = useState(false);
  const [nfSupplierId, setNfSupplierId] = useState(suppliers[0]?.id || '');
  const [nfCustomSupplier, setNfCustomSupplier] = useState('');
  const [nfInvoiceNumber, setNfInvoiceNumber] = useState('');
  const [nfAccessKey, setNfAccessKey] = useState('');
  const [nfIssueDate, setNfIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [nfFirstDueDate, setNfFirstDueDate] = useState(
    new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0]
  );
  const [nfTotalAmount, setNfTotalAmount] = useState('');
  const [nfInstallmentsCount, setNfInstallmentsCount] = useState(1);
  const [nfCategory, setNfCategory] = useState('Fornecedores Têxteis');
  const [nfNotes, setNfNotes] = useState('');

  // Modal 2: Adicionar Despesa Manual
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expCreditorName, setExpCreditorName] = useState('');
  const [expDocumentNumber, setExpDocumentNumber] = useState('');
  const [expCategory, setExpCategory] = useState(settings.expenseCategories[0] || 'Aluguel do Ponto');
  const [expIssueDate, setExpIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expFirstDueDate, setExpFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expTotalAmount, setExpTotalAmount] = useState('');
  const [expInstallmentsCount, setExpInstallmentsCount] = useState(1);
  const [expNotes, setExpNotes] = useState('');

  const refreshBills = () => {
    setBills(DatabaseService.getBillsToPay());
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch =
      b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'TODOS' || (statusFilter === 'PAGA' ? b.status === 'PAGA' : b.status !== 'PAGA');
    return matchesSearch && matchesStatus;
  });

  const totalPending = bills
    .filter(b => b.status !== 'PAGA' && b.status !== 'CANCELADA')
    .reduce((acc, b) => acc + b.balance, 0);

  // Baixa de Título
  const handleOpenPay = (bill: BillToPay) => {
    setSelectedBill(bill);
    setPayAmount(bill.balance.toFixed(2));
    setPaymentMethod('PIX');
    setPayFromRegister(false);
    setShowPayModal(true);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    const amount = Number(parseFloat(payAmount) || 0);
    if (amount <= 0 || amount > selectedBill.balance + 0.01) {
      alert(`Informe um valor de baixa válido (máximo: ${formatCurrency(selectedBill.balance)}).`);
      return;
    }

    const res = DatabaseService.payBill(selectedBill.id, amount, paymentMethod, payFromRegister);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowPayModal(false);
    setSelectedBill(null);
    refreshBills();
  };

  // Submissão do Lançamento de NF de Fornecedor
  const handleSubmitNf = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(nfTotalAmount);
    if (isNaN(total) || total <= 0) {
      alert('Informe um valor total válido para a Nota Fiscal.');
      return;
    }

    if (!nfInvoiceNumber.trim()) {
      alert('Informe o número da Nota Fiscal.');
      return;
    }

    let suppName = nfCustomSupplier.trim();
    let suppId = '';

    if (nfSupplierId && nfSupplierId !== 'custom') {
      const foundSupp = suppliers.find(s => s.id === nfSupplierId);
      if (foundSupp) {
        suppName = foundSupp.tradeName || foundSupp.corporateName;
        suppId = foundSupp.id;
      }
    }

    if (!suppName) {
      alert('Selecione ou informe o nome do Fornecedor da Nota Fiscal.');
      return;
    }

    const res = DatabaseService.addSupplierInvoiceBill({
      supplierId: suppId,
      supplierName: suppName,
      invoiceNumber: nfInvoiceNumber.trim(),
      accessKey: nfAccessKey.trim() || undefined,
      issueDate: nfIssueDate,
      firstDueDate: nfFirstDueDate,
      totalAmount: total,
      installmentsCount: nfInstallmentsCount,
      category: nfCategory,
      notes: nfNotes.trim() || undefined
    });

    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowNfModal(false);
    // Limpar form
    setNfInvoiceNumber('');
    setNfAccessKey('');
    setNfTotalAmount('');
    setNfNotes('');
    setNfInstallmentsCount(1);
    refreshBills();
  };

  // Submissão do Lançamento de Despesa Manual
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(expTotalAmount);
    if (isNaN(total) || total <= 0) {
      alert('Informe um valor válido para a despesa.');
      return;
    }

    if (!expDescription.trim()) {
      alert('Informe a descrição da despesa.');
      return;
    }

    const res = DatabaseService.addManualExpenseBill({
      description: expDescription.trim(),
      creditorName: expCreditorName.trim() || 'Credor / Estabelecimento',
      documentNumber: expDocumentNumber.trim(),
      category: expCategory,
      issueDate: expIssueDate,
      firstDueDate: expFirstDueDate,
      totalAmount: total,
      installmentsCount: expInstallmentsCount,
      notes: expNotes.trim() || undefined
    });

    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowExpenseModal(false);
    // Limpar form
    setExpDescription('');
    setExpCreditorName('');
    setExpDocumentNumber('');
    setExpTotalAmount('');
    setExpNotes('');
    setExpInstallmentsCount(1);
    refreshBills();
  };

  return (
    <div className="space-y-4">
      {/* Topo com Ações e Indicador */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-red-400" />
            CONTAS A PAGAR & OBRIGAÇÕES FINANCEIRAS
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Lançamento de notas fiscais de fornecedores, boletos programados e despesas da loja
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={() => setShowNfModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>+ LANÇAR NF FORNECEDOR</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold uppercase shadow-md transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>+ ADICIONAR DESPESA MANUAL</span>
          </button>

          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-right min-w-[170px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              SALDO PENDENTE
            </span>
            <span className="text-base font-black text-red-400 font-mono">
              {formatCurrency(totalPending)}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por documento, descrição, fornecedor ou categoria..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 uppercase"
          >
            <option value="PENDENTE">TÍTULOS PENDENTES / ABERTOS</option>
            <option value="PAGA">TÍTULOS QUITADOS</option>
            <option value="TODOS">TODOS OS TÍTULOS</option>
          </select>
        </div>
      </div>

      {/* Tabela de Contas a Pagar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">DOCUMENTO</th>
                <th className="py-3 px-3">DESCRIÇÃO DA CONTA</th>
                <th className="py-3 px-3">FORNECEDOR / CREDOR</th>
                <th className="py-3 px-3">CATEGORIA</th>
                <th className="py-3 px-3 font-mono">VENCIMENTO</th>
                <th className="py-3 px-3 text-right">VALOR TOTAL</th>
                <th className="py-3 px-3 text-right">VALOR PAGO</th>
                <th className="py-3 px-3 text-right">SALDO RESTANTE</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">AÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-bold uppercase">
                    Nenhuma conta a pagar encontrada.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const isLate = bill.status !== 'PAGA' && new Date(bill.dueDate).getTime() < Date.now();
                  return (
                    <tr key={bill.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {bill.documentNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100 uppercase">
                        <div>{bill.description}</div>
                        {bill.notes && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                            {bill.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 uppercase">
                        {bill.supplierName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                          {bill.category || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={isLate ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          {formatDate(bill.dueDate)} {isLate && '(VENCIDO)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">
                        {formatCurrency(bill.paidAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-red-400 text-sm">
                        {formatCurrency(bill.balance)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            bill.status === 'PAGA'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isLate
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {bill.status !== 'PAGA' && (
                          <button
                            onClick={() => handleOpenPay(bill)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase transition-colors cursor-pointer"
                          >
                            BAIXAR
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: LANÇAR NOTA FISCAL (NF) DE FORNECEDOR */}
      <Modal
        isOpen={showNfModal}
        onClose={() => setShowNfModal(false)}
        title="LANÇAR NOTA FISCAL (NF) DE FORNECEDOR"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitNf} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fornecedor */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                FORNECEDOR DA NOTA FISCAL
              </label>
              <select
                value={nfSupplierId}
                onChange={(e) => setNfSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold focus:border-emerald-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.tradeName || s.corporateName} ({s.document})
                  </option>
                ))}
                <option value="custom">+ Outro / Digitar Fornecedor Manualmente</option>
              </select>

              {nfSupplierId === 'custom' && (
                <input
                  type="text"
                  required
                  value={nfCustomSupplier}
                  onChange={(e) => setNfCustomSupplier(e.target.value)}
                  placeholder="Digite o nome fantasia ou razão social do fornecedor..."
                  className="w-full mt-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs focus:border-emerald-500"
                />
              )}
            </div>

            {/* Número da NF */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                NÚMERO DA NOTA FISCAL (NF)
              </label>
              <input
                type="text"
                required
                value={nfInvoiceNumber}
                onChange={(e) => setNfInvoiceNumber(e.target.value)}
                placeholder="Ex: 10452 ou 001.045.290"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono font-bold focus:border-emerald-500"
              />
            </div>

            {/* Valor Total da NF */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                VALOR TOTAL DA NOTA FISCAL (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={nfTotalAmount}
                onChange={(e) => setNfTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-black text-sm focus:border-emerald-500"
              />
            </div>

            {/* Chave de Acesso NFe (Opcional) */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                CHAVE DE ACESSO DA NFE (OPCIONAL)
              </label>
              <input
                type="text"
                value={nfAccessKey}
                onChange={(e) => setNfAccessKey(e.target.value)}
                placeholder="44 dígitos numéricos da chave de acesso da NFe..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
            </div>

            {/* Data de Emissão */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                DATA DE EMISSÃO DA NF
              </label>
              <input
                type="date"
                required
                value={nfIssueDate}
                onChange={(e) => setNfIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
            </div>

            {/* Primeiro Vencimento */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                PRIMEIRO VENCIMENTO
              </label>
              <input
                type="date"
                required
                value={nfFirstDueDate}
                onChange={(e) => setNfFirstDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
            </div>

            {/* Número de Parcelas */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                PARCELAMENTO DA NOTA
              </label>
              <select
                value={nfInstallmentsCount}
                onChange={(e) => setNfInstallmentsCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold focus:border-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => {
                  const val = parseFloat(nfTotalAmount) || 0;
                  return (
                    <option key={n} value={n}>
                      {n === 1 ? '1x À Vista / 30 dias' : `${n}x parcelas (${formatCurrency(val / n)} cada)`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                CATEGORIA
              </label>
              <select
                value={nfCategory}
                onChange={(e) => setNfCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold focus:border-emerald-500"
              >
                <option value="Fornecedores Têxteis">Fornecedores Têxteis</option>
                <option value="Tecidos e Malhas">Tecidos e Malhas</option>
                <option value="Aviamentos e Costura">Aviamentos e Costura</option>
                <option value="Embalagens e Sacolas">Embalagens e Sacolas</option>
                <option value="Equipamentos e Máquinas">Equipamentos e Máquinas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Observações */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                OBSERVAÇÕES (OPCIONAL)
              </label>
              <textarea
                rows={2}
                value={nfNotes}
                onChange={(e) => setNfNotes(e.target.value)}
                placeholder="Observações adicionais sobre o pedido ou condições de pagamento..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowNfModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>GERAR CONTAS A PAGAR DA NF</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADICIONAR DESPESA MANUAL */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="ADICIONAR DESPESA MANUAL / BOLETO PROGRAMADO"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Descrição */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                DESCRIÇÃO DA DESPESA / CONTA
              </label>
              <input
                type="text"
                required
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="Ex: Aluguel do Ponto, Energia Elétrica, Internet Vivo Fibra, Contador..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold focus:border-emerald-500"
              />
            </div>

            {/* Favorecido / Credor */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                FAVORECIDO / CREDOR
              </label>
              <input
                type="text"
                required
                value={expCreditorName}
                onChange={(e) => setExpCreditorName(e.target.value)}
                placeholder="Ex: Imobiliária Alpha, Enel, Vivo S.A..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs focus:border-emerald-500"
              />
            </div>

            {/* Documento / Boleto */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                Nº DO DOCUMENTO / BOLETO (OPCIONAL)
              </label>
              <input
                type="text"
                value={expDocumentNumber}
                onChange={(e) => setExpDocumentNumber(e.target.value)}
                placeholder="Ex: BOL-8841 ou FAT-2026/05"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-emerald-500"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                CATEGORIA DA DESPESA
              </label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold focus:border-emerald-500"
              >
                {settings.expenseCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor Total */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                VALOR TOTAL (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={expTotalAmount}
                onChange={(e) => setExpTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-red-400 font-mono font-black text-sm focus:border-emerald-500"
              />
            </div>

            {/* Data de Emissão */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                DATA DE EMISSÃO / LANÇAMENTO
              </label>
              <input
                type="date"
                required
                value={expIssueDate}
                onChange={(e) => setExpIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
            </div>

            {/* Primeiro Vencimento */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                DATA DE VENCIMENTO
              </label>
              <input
                type="date"
                required
                value={expFirstDueDate}
                onChange={(e) => setExpFirstDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
            </div>

            {/* Número de Parcelas */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                PARCELAS / RECORRÊNCIA PROGRAMADA
              </label>
              <select
                value={expInstallmentsCount}
                onChange={(e) => setExpInstallmentsCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold focus:border-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 12].map(n => {
                  const val = parseFloat(expTotalAmount) || 0;
                  return (
                    <option key={n} value={n}>
                      {n === 1 ? '1x Parcela Única' : `${n}x parcelas mensais (${formatCurrency(val / n)} cada)`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Observações */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                OBSERVAÇÕES (OPCIONAL)
              </label>
              <textarea
                rows={2}
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
                placeholder="Observações adicionais ou instruções de pagamento..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded text-xs font-bold uppercase shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CADASTRAR DESPESA EM CONTAS A PAGAR</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE BAIXA DE CONTA A PAGAR */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`BAIXA DE CONTA A PAGAR — ${selectedBill?.documentNumber}`}
        maxWidth="md"
      >
        {selectedBill && (
          <form onSubmit={handleConfirmPay} className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
              <p>Fornecedor / Credor: <strong className="text-white">{selectedBill.supplierName}</strong></p>
              <p>Descrição: <strong className="text-white">{selectedBill.description}</strong></p>
              <p>Categoria: <strong className="text-emerald-400">{selectedBill.category || 'Geral'}</strong></p>
              <p>Vencimento: <strong className="text-white font-mono">{formatDate(selectedBill.dueDate)}</strong></p>
              <p>Saldo Pendente: <strong className="text-red-400 font-mono font-bold text-sm">{formatCurrency(selectedBill.balance)}</strong></p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                VALOR DA BAIXA / PAGAMENTO (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-black text-lg focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                FORMA DE PAGAMENTO UTILIZADA
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                <option value="PIX">PIX (TRANSFERÊNCIA BANCÁRIA)</option>
                <option value="DEBITO">CARTÃO DÉBITO</option>
                <option value="CREDITO">CARTÃO CRÉDITO</option>
                <option value="DINHEIRO">DINHEIRO EM ESPÉCIE</option>
              </select>
            </div>

            {paymentMethod === 'DINHEIRO' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="payFromRegister"
                  checked={payFromRegister}
                  onChange={(e) => setPayFromRegister(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="payFromRegister" className="text-xs text-slate-200 font-semibold cursor-pointer select-none">
                  Debitar valor da gaveta do Caixa Aberto (Lançar despesa física no Caixa)
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow cursor-pointer"
              >
                Confirmar Baixa
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
