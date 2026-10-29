import React, { useState } from 'react';
import { Inventory, InventoryItem } from '../types';
import { DatabaseService } from '../services/db';
import { formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Eye,
  EyeOff,
  Printer,
  Barcode
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

  const [invTitle, setInvTitle] = useState('CONFERÊNCIA GERAL DE ESTOQUE');
  const [invCategory, setInvCategory] = useState('TODAS');
  const [isBlind, setIsBlind] = useState(false);

  // Estados de contagem rápida
  const [barcodeSearch, setBarcodeSearch] = useState('');

  const inventories = DatabaseService.getInventories();
  const settings = DatabaseService.getSettings();

  const handleStartInventory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = invCategory === 'TODAS' ? undefined : invCategory;
    const newInv = DatabaseService.startInventory(invTitle, cat, isBlind);
    setShowNewModal(false);
    setSelectedInventory(newInv);
    setShowActiveModal(true);
  };

  const handleCountChange = (itemId: string, counted: number, notes?: string) => {
    if (!selectedInventory) return;
    DatabaseService.updateInventoryCount(selectedInventory.id, itemId, counted, notes);
    // Atualiza localmente
    const updatedList = DatabaseService.getInventories();
    const current = updatedList.find(i => i.id === selectedInventory.id);
    if (current) setSelectedInventory({ ...current });
  };

  const handleBarcodeCount = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeSearch.trim();
      if (!code || !selectedInventory) return;

      const item = selectedInventory.items.find(i => i.barcode === code);
      if (item) {
        handleCountChange(item.id, item.countedStock + 1);
        setBarcodeSearch('');
      } else {
        alert(`Código de barras ${code} não encontrado neste inventário.`);
      }
    }
  };

  const handleConfirmInventory = () => {
    if (!selectedInventory) return;
    if (!window.confirm('Confirma a finalização deste inventário? Os saldos do sistema serão atualizados automaticamente para as quantidades contadas e gerará registros de ajuste rastreáveis.')) {
      return;
    }

    const res = DatabaseService.confirmInventory(selectedInventory.id);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowActiveModal(false);
    setSelectedInventory(null);
  };

  return (
    <div className="space-y-4">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            INVENTÁRIO & AUDITORIA FÍSICA DE ESTOQUE
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Conferência cega por leitor de código de barras, apuração de divergências e ajustes atômicos
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          INICIAR NOVO INVENTÁRIO
        </button>
      </div>

      {/* Tabela de Inventários Realizados */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-bold uppercase">
          HISTÓRICO DE AUDITORIAS E INVENTÁRIOS
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">INVENTÁRIO Nº</th>
                <th className="py-3 px-3">TÍTULO / ESCOPO</th>
                <th className="py-3 px-3">CATEGORIA</th>
                <th className="py-3 px-3">DATA INÍCIO</th>
                <th className="py-3 px-3 text-center">TIPO DE CONTAGEM</th>
                <th className="py-3 px-3 text-center">TOTAL ITENS</th>
                <th className="py-3 px-3 text-center">DIVERGÊNCIAS</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-bold uppercase">
                    Nenhum inventário realizado até o momento.
                  </td>
                </tr>
              ) : (
                inventories.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">#{inv.inventoryNumber}</td>
                    <td className="py-3 px-3 font-bold uppercase text-slate-100">{inv.title}</td>
                    <td className="py-3 px-3 text-slate-300">{inv.filterCategory || 'TODAS AS PEÇAS'}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{formatDateTime(inv.startedAt)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950 border border-slate-800">
                        {inv.isBlindCount ? 'CONTAGEM CEGA' : 'INFORMADA'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{inv.totalItems}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={inv.itemsWithDivergence > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {inv.itemsWithDivergence}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        inv.status === 'CONCLUIDO'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedInventory(inv);
                          setShowActiveModal(true);
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold uppercase"
                      >
                        {inv.status === 'EM_ANDAMENTO' ? 'Continuar' : 'Visualizar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA INICIAR NOVO INVENTÁRIO */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="INICIAR NOVO INVENTÁRIO FÍSICO"
        maxWidth="md"
      >
        <form onSubmit={handleStartInventory} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">TÍTULO / IDENTIFICAÇÃO</label>
            <input
              type="text"
              required
              value={invTitle}
              onChange={(e) => setInvTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">FILTRAR POR CATEGORIA</label>
            <select
              value={invCategory}
              onChange={(e) => setInvCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold uppercase"
            >
              <option value="TODAS">TODAS AS CATEGORIAS (LOJA COMPLETA)</option>
              {settings.categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlind}
                onChange={(e) => setIsBlind(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-bold uppercase text-slate-200">
                HABILITAR CONTAGEM CEGA (RECOMENDADO)
              </span>
            </label>
            <p className="text-[11px] text-slate-400">
              O saldo esperado no sistema fica oculto durante a bipagem física para garantir a imparcialidade do operador.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow"
            >
              Gerar Lista de Contagem
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE CONTAGEM E APURAÇÃO DE DIVERGÊNCIAS */}
      <Modal
        isOpen={showActiveModal}
        onClose={() => setShowActiveModal(false)}
        title={`CONFERÊNCIA DE INVENTÁRIO Nº ${selectedInventory?.inventoryNumber}`}
        maxWidth="full"
      >
        {selectedInventory && (
          <div className="space-y-4">
            {/* Barra de Leitura por Código de Barras */}
            {selectedInventory.status === 'EM_ANDAMENTO' && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Barcode className="w-5 h-5 text-emerald-400" />
                  </div>
                  <input
                    type="text"
                    value={barcodeSearch}
                    onChange={(e) => setBarcodeSearch(e.target.value)}
                    onKeyDown={handleBarcodeCount}
                    placeholder="Bipe o código de barras com o leitor para somar +1 à contagem..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-mono font-bold focus:border-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Divergências apuradas:{' '}
                  <span className="font-bold text-amber-400 text-sm">
                    {selectedInventory.itemsWithDivergence} itens
                  </span>
                </div>
              </div>
            )}

            {/* Tabela de Contagem dos Itens */}
            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[55vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-2.5 px-3">PRODUTO</th>
                    <th className="py-2.5 px-3 text-center">GRADE (COR / TAM)</th>
                    <th className="py-2.5 px-3 font-mono">CÓD. BARRAS</th>
                    {!selectedInventory.isBlindCount && (
                      <th className="py-2.5 px-3 text-center">ESTOQUE SISTEMA</th>
                    )}
                    <th className="py-2.5 px-3 text-center">QTD CONTADA</th>
                    {!selectedInventory.isBlindCount && (
                      <th className="py-2.5 px-3 text-center">DIFERENÇA</th>
                    )}
                    <th className="py-2.5 px-3">JUSTIFICATIVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {selectedInventory.items.map((it) => {
                    const hasDivergence = it.isCounted && it.difference !== 0;
                    return (
                      <tr key={it.id} className={hasDivergence ? 'bg-amber-950/20' : 'bg-slate-900'}>
                        <td className="py-2 px-3 font-semibold uppercase">{it.productName}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-400">
                          {it.color} / {it.size}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400">{it.barcode}</td>
                        {!selectedInventory.isBlindCount && (
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-300">
                            {it.systemStock} un
                          </td>
                        )}
                        <td className="py-2 px-3 text-center">
                          {selectedInventory.status === 'EM_ANDAMENTO' ? (
                            <input
                              type="number"
                              min="0"
                              value={it.isCounted ? it.countedStock : ''}
                              placeholder="0"
                              onChange={(e) => handleCountChange(it.id, parseInt(e.target.value) || 0, it.notes)}
                              className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono font-bold text-white focus:border-emerald-500"
                            />
                          ) : (
                            <span className="font-mono font-bold text-white">{it.countedStock} un</span>
                          )}
                        </td>
                        {!selectedInventory.isBlindCount && (
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {it.isCounted ? (
                              <span className={it.difference === 0 ? 'text-emerald-400' : it.difference > 0 ? 'text-blue-400' : 'text-red-400'}>
                                {it.difference > 0 ? `+${it.difference}` : it.difference}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        )}
                        <td className="py-2 px-3">
                          {selectedInventory.status === 'EM_ANDAMENTO' ? (
                            <input
                              type="text"
                              value={it.notes || ''}
                              onChange={(e) => handleCountChange(it.id, it.countedStock, e.target.value)}
                              placeholder="Observação da contagem..."
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                            />
                          ) : (
                            <span className="text-slate-400">{it.notes || '-'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ações do Inventário */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold uppercase flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir Folha de Contagem
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowActiveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
                >
                  Fechar Janela
                </button>
                {selectedInventory.status === 'EM_ANDAMENTO' && (
                  <button
                    type="button"
                    onClick={handleConfirmInventory}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    CONFIRMAR & APLICAR AJUSTES DE ESTOQUE
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
