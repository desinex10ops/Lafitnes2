import React, { useState } from 'react';
import { Duplicata, DuplicataParcela, PaymentMethod } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate, formatDateTime, formatDocument } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  ArrowUpCircle,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Printer,
  Clock,
  AlertTriangle,
  User
} from 'lucide-react';

export const AccountsReceivableScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ABERTA' | 'PAGA'>('ABERTA');
  const [selectedDuplicata, setSelectedDuplicata] = useState<Duplicata | null>(null);
  const [selectedParcela, setSelectedParcela] = useState<DuplicataParcela | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('PIX');

  const duplicatas = DatabaseService.getDuplicatas();
  const settings = DatabaseService.getSettings();

  const filteredDuplicatas = duplicatas.filter(d => {
    const matchesSearch =
      d.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerDoc.includes(searchTerm);

    const matchesStatus = statusFilter === 'TODOS' || (statusFilter === 'PAGA' ? d.status === 'PAGA' : d.status !== 'PAGA');
    return matchesSearch && matchesStatus;
  });

  const totalReceivable = duplicatas
    .filter(d => d.status !== 'PAGA' && d.status !== 'CANCELADA')
    .reduce((acc, d) => acc + d.balance, 0);

  const handleOpenPay = (duplicata: Duplicata, parcela: DuplicataParcela) => {
    setSelectedDuplicata(duplicata);
    setSelectedParcela(parcela);
    setPayMethod('PIX');
    setShowPayModal(true);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuplicata || !selectedParcela) return;

    const res = DatabaseService.payDuplicata(
      selectedDuplicata.id,
      selectedParcela.installmentNumber,
      payMethod
    );

    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowPayModal(false);
    setSelectedDuplicata(null);
    setSelectedParcela(null);
  };

  return (
    <div className="space-y-4">
      {/* Topo com Indicador */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
            CONTAS A RECEBER & DUPLICATAS MERCANTIS
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Cobrança de crediário a prazo, parcelas vencidas e baixa vinculada ao caixa
          </p>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            SALDO TOTAL A RECEBER
          </span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            {formatCurrency(totalReceivable)}
          </span>
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
            placeholder="Pesquisar por número da duplicata, cliente ou CPF..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 uppercase"
          >
            <option value="ABERTA">DUPLICATAS EM ABERTO</option>
            <option value="PAGA">DUPLICATAS QUITADAS</option>
            <option value="TODOS">TODAS AS DUPLICATAS</option>
          </select>
        </div>
      </div>

      {/* Tabela de Duplicatas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">TÍTULO / DUP</th>
                <th className="py-3 px-3">CLIENTE / SACADO</th>
                <th className="py-3 px-3">CPF / CNPJ</th>
                <th className="py-3 px-3 font-mono">EMISSÃO</th>
                <th className="py-3 px-3 font-mono">VENCIMENTO</th>
                <th className="py-3 px-3 text-right">VALOR TOTAL</th>
                <th className="py-3 px-3 text-right">VALOR PAGO</th>
                <th className="py-3 px-3 text-right">SALDO</th>
                <th className="py-3 px-3 text-center">PARCELAS</th>
                <th className="py-3 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredDuplicatas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-bold uppercase">
                    Nenhuma duplicata mercantil encontrada.
                  </td>
                </tr>
              ) : (
                filteredDuplicatas.map((dup) => (
                  <tr key={dup.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {dup.documentNumber}
                    </td>
                    <td className="py-3 px-3 font-bold uppercase text-slate-100">
                      {dup.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatDocument(dup.customerDoc)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {formatDate(dup.issueDate)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatDate(dup.dueDate)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {formatCurrency(dup.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {formatCurrency(dup.paidAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                      {formatCurrency(dup.balance)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {dup.installments.map((inst) => (
                          <div key={inst.installmentNumber} className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className={inst.status === 'PAGO' ? 'text-emerald-400 line-through' : 'text-slate-200'}>
                              {inst.installmentNumber}ª: {formatCurrency(inst.amount)} ({formatDate(inst.dueDate)})
                            </span>
                            {inst.status !== 'PAGO' ? (
                              <button
                                onClick={() => handleOpenPay(dup, inst)}
                                className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[9px]"
                              >
                                Baixar
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[9px]">PAGO</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedDuplicata(dup);
                          setShowPrintModal(true);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                        title="Imprimir Carnê / Duplicata"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE BAIXA / RECEBIMENTO DA PARCELA */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title={`RECEBER PARCELA ${selectedParcela?.installmentNumber} — ${selectedDuplicata?.documentNumber}`}
        maxWidth="md"
      >
        {selectedDuplicata && selectedParcela && (
          <form onSubmit={handleConfirmPay} className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
              <p>Sacado/Cliente: <strong className="text-white">{selectedDuplicata.customerName}</strong></p>
              <p>Documento: <strong className="text-white font-mono">{formatDocument(selectedDuplicata.customerDoc)}</strong></p>
              <p>Parcela: <strong className="text-white">{selectedParcela.installmentNumber} de {selectedDuplicata.installmentsCount}</strong></p>
              <p>Vencimento: <strong className="text-white font-mono">{formatDate(selectedParcela.dueDate)}</strong></p>
              <p>Valor a Receber: <strong className="text-emerald-400 font-mono font-bold text-base">{formatCurrency(selectedParcela.balance)}</strong></p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                FORMA EFETIVA DE RECEBIMENTO
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                <option value="DINHEIRO">DINHEIRO EM ESPÉCIE (ENTRA NO CAIXA ABERTO)</option>
                <option value="PIX">PIX</option>
                <option value="DEBITO">CARTÃO DÉBITO</option>
                <option value="CREDITO">CARTÃO CRÉDITO</option>
              </select>
              {payMethod === 'DINHEIRO' && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                  &bull; O valor recebido em espécie será registrado automaticamente no caixa ativo.
                </p>
              )}
            </div>

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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow"
              >
                Confirmar Recebimento
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL DE IMPRESSÃO DA DUPLICATA / CARNÊ */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="IMPRIMIR DUPLICATA MERCANTIL"
        maxWidth="md"
      >
        {selectedDuplicata && (
          <div className="space-y-4">
            <div className="bg-white text-black p-5 rounded font-mono text-xs leading-relaxed border border-slate-300 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <p className="font-bold text-sm uppercase">{settings.storeName}</p>
                <p>DUPLICATA MERCANTIL A PRAZO</p>
                <p>Nº {selectedDuplicata.documentNumber}</p>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <p>SACADO: <strong>{selectedDuplicata.customerName}</strong></p>
                <p>CPF/CNPJ: {formatDocument(selectedDuplicata.customerDoc)}</p>
                <p>EMISSÃO: {formatDate(selectedDuplicata.issueDate)}</p>
                <p>VENCIMENTO FINAL: {formatDate(selectedDuplicata.dueDate)}</p>
                <p>VALOR TOTAL: <strong>{formatCurrency(selectedDuplicata.totalAmount)}</strong></p>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <p className="font-bold">PARCELAS:</p>
                {selectedDuplicata.installments.map(inst => (
                  <div key={inst.installmentNumber} className="flex justify-between">
                    <span>{inst.installmentNumber}ª Parcela (Venc: {formatDate(inst.dueDate)}):</span>
                    <span className="font-bold">{formatCurrency(inst.amount)} ({inst.status})</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 text-center text-[10px] space-y-2">
                <p>Reconheço(emos) a exatidão desta duplicata de venda mercantil.</p>
                <p className="pt-4">___________________________________________<br />Assinatura do Sacado (Cliente)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase shadow"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
