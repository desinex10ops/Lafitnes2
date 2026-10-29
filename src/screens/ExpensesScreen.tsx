import React, { useState } from 'react';
import { Expense, PaymentMethod } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Wallet,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [showModal, setShowModal] = useState(false);

  const expenses = DatabaseService.getExpenses();
  const settings = DatabaseService.getSettings();
  const activeRegister = DatabaseService.getActiveRegister();
  const currentUser = DatabaseService.getCurrentUser();

  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    category: settings.expenseCategories[0] || 'Geral',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paidFromRegister: false,
    paymentMethod: 'DINHEIRO',
    isPaid: true,
    responsibleName: currentUser?.name || 'Administrador',
    notes: ''
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'TODAS' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleOpenNew = () => {
    setFormData({
      description: '',
      category: settings.expenseCategories[0] || 'Geral',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paidFromRegister: false,
      paymentMethod: 'DINHEIRO',
      isPaid: true,
      responsibleName: currentUser?.name || 'Administrador',
      notes: ''
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    if (!formData.description?.trim() || amount <= 0) {
      alert('Informe descrição e valor válidos para a despesa.');
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      description: formData.description.toUpperCase(),
      category: formData.category || 'Geral',
      amount,
      date: formData.date || new Date().toISOString().split('T')[0],
      paidFromRegister: Boolean(formData.paidFromRegister),
      paymentMethod: formData.paymentMethod || 'DINHEIRO',
      isPaid: formData.isPaid !== false,
      paidAt: new Date().toISOString(),
      responsibleName: formData.responsibleName || currentUser?.name || 'Administrador',
      notes: formData.notes || '',
      createdAt: new Date().toISOString()
    };

    const res = DatabaseService.saveExpense(newExpense);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            CONTROLE DE DESPESAS OPERACIONAIS
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Lançamento de custos, contas de consumo e saídas pagas diretamente pelo caixa
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          LANÇAR DESPESA
        </button>
      </div>

      {/* Card de Resumo de Despesas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-lg text-red-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              TOTAL DE DESPESAS REGISTRADAS
            </span>
            <span className="text-2xl font-black text-red-400 font-mono">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 uppercase w-full sm:w-auto"
          >
            <option value="TODAS">TODAS AS CATEGORIAS</option>
            {settings.expenseCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">DATA</th>
                <th className="py-3 px-3">DESCRIÇÃO DA DESPESA</th>
                <th className="py-3 px-3">CATEGORIA</th>
                <th className="py-3 px-3 text-center">FORMA DE PAGAMENTO</th>
                <th className="py-3 px-3 text-center">PAGO PELO CAIXA?</th>
                <th className="py-3 px-3 text-right">VALOR</th>
                <th className="py-3 px-3">RESPONSÁVEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-bold uppercase">
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-3 font-bold text-white uppercase">
                      {exp.description}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {exp.category}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold uppercase">
                        {exp.paymentMethod || 'DINHEIRO'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        exp.paidFromRegister ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {exp.paidFromRegister ? 'SIM (SANGRIA)' : 'NÃO (CONTA)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-400 text-sm">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {exp.responsibleName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE LANÇAMENTO DE DESPESA */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="LANÇAR NOVA DESPESA OPERACIONAL"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              DESCRIÇÃO DA DESPESA
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Conta de Luz / Material de Limpeza / Sacolas..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">CATEGORIA</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                {settings.expenseCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">VALOR (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-red-400 font-mono font-bold text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">DATA</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">FORMA DE PAGAMENTO</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                <option value="DINHEIRO">DINHEIRO</option>
                <option value="PIX">PIX</option>
                <option value="DEBITO">CARTÃO DÉBITO</option>
                <option value="CREDITO">CARTÃO CRÉDITO</option>
              </select>
            </div>
          </div>

          {/* Opção de pagar diretamente pelo dinheiro do caixa */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.paidFromRegister}
                onChange={(e) => setFormData({ ...formData, paidFromRegister: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-bold uppercase text-amber-300">
                PAGAR COM O DINHEIRO DO CAIXA ABERTO (LANÇAR SANGRIA)
              </span>
            </label>
            {formData.paidFromRegister && (
              <p className="text-[11px] text-slate-400">
                {activeRegister && activeRegister.status === 'ABERTO'
                  ? `O saldo em dinheiro do caixa atual (${formatCurrency(activeRegister.expectedCash)}) será reduzido imediatamente.`
                  : 'Nenhum caixa está aberto no momento! Abra o caixa primeiro.'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow"
            >
              Confirmar Despesa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
