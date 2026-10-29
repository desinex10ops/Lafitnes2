import React, { useState } from 'react';
import { Sale, StoreSettings } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { PrintReceiptModal } from '../components/common/PrintReceiptModal';
import { Modal } from '../components/common/Modal';
import {
  Search,
  Filter,
  Printer,
  XCircle,
  Eye,
  Calendar,
  AlertTriangle,
  Receipt,
  User,
  CheckCircle2
} from 'lucide-react';

export const SalesHistoryScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'CONCLUIDA' | 'CANCELADA'>('TODOS');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const sales = DatabaseService.getSales();
  const settings = DatabaseService.getSettings();
  const currentUser = DatabaseService.getCurrentUser();

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.saleNumber.toString().includes(searchTerm) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.operatorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCancel = (sale: Sale) => {
    setSelectedSale(sale);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedSale) return;
    if (!cancelReason.trim()) {
      alert('Informe a justificativa do cancelamento.');
      return;
    }

    const result = DatabaseService.cancelSale(selectedSale.id, cancelReason);
    if (!result.success) {
      alert(`ERRO: ${result.message}`);
      return;
    }

    alert(result.message);
    setShowCancelModal(false);
    setSelectedSale(null);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por número da venda, cliente ou operador..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 uppercase"
          >
            <option value="TODOS">TODOS OS STATUS</option>
            <option value="CONCLUIDA">CONCLUÍDAS</option>
            <option value="CANCELADA">CANCELADAS</option>
          </select>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">VENDA Nº</th>
                <th className="py-3 px-4">DATA & HORA</th>
                <th className="py-3 px-4">CLIENTE</th>
                <th className="py-3 px-4">OPERADOR</th>
                <th className="py-3 px-4">FORMAS DE PAGAMENTO</th>
                <th className="py-3 px-4 text-right">TOTAL</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-bold uppercase">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      #{sale.saleNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-bold uppercase text-slate-200">
                      {sale.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {sale.operatorName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {sale.payments.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold uppercase"
                          >
                            {p.method}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          sale.status === 'CONCLUIDA'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowDetailsModal(true);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowReceiptModal(true);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                          title="Reimprimir Comprovante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {sale.status === 'CONCLUIDA' && (
                          <button
                            onClick={() => handleOpenCancel(sale)}
                            className="p-1 rounded bg-slate-800 hover:bg-red-950 text-red-400"
                            title="Cancelar Venda"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da Venda */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`DETALHES DA VENDA Nº ${selectedSale?.saleNumber}`}
        maxWidth="xl"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-bold uppercase">Cliente:</span>
                <span className="text-white font-bold">{selectedSale.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">Operador:</span>
                <span className="text-white">{selectedSale.operatorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">Data da Venda:</span>
                <span className="text-white font-mono">{formatDateTime(selectedSale.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">Situação:</span>
                <span className={`font-bold ${selectedSale.status === 'CONCLUIDA' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedSale.status}
                </span>
              </div>
            </div>

            {selectedSale.status === 'CANCELADA' && (
              <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> CANCELAMENTO AUDITADO
                </div>
                <div>Cancelado por: <strong className="text-white">{selectedSale.canceledBy}</strong> em {formatDateTime(selectedSale.canceledAt)}</div>
                <div>Motivo: {selectedSale.cancelReason}</div>
              </div>
            )}

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                ITENS DO CUPOM:
              </span>
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">PRODUTO</th>
                      <th className="py-2 px-3 text-center">TAM/COR</th>
                      <th className="py-2 px-3 text-center">QTD</th>
                      <th className="py-2 px-3 text-right">UNIT.</th>
                      <th className="py-2 px-3 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold">{it.productName}</td>
                        <td className="py-2 px-3 text-center">{it.color} / {it.size}</td>
                        <td className="py-2 px-3 text-center font-mono">{it.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(it.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-400 uppercase">TOTAL FINAL:</span>
              <span className="font-mono font-black text-emerald-400 text-lg">{formatCurrency(selectedSale.total)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmação de Cancelamento com Justificativa */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={`CANCELAR VENDA Nº ${selectedSale?.saleNumber}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
            <strong>ATENÇÃO:</strong> O cancelamento estornará automaticamente as quantidades dos produtos para o estoque e registrará a auditoria financeira.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              JUSTIFICATIVA DO CANCELAMENTO (OBRIGATÓRIO)
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento (ex: desistência do cliente, erro de operador)..."
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmCancel}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold uppercase"
            >
              Confirmar Cancelamento
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Reimpressão de Comprovante */}
      <PrintReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        sale={selectedSale}
        settings={settings}
      />
    </div>
  );
};
