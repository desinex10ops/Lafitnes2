import React, { useState } from 'react';
import { Customer, Sale, Duplicata } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDocument, formatPhone, formatDate, formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Plus,
  Search,
  Edit,
  FileText,
  CreditCard,
  ShoppingBag,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    creditLimit: 1000,
    notes: '',
    active: true
  });

  const customers = DatabaseService.getCustomers();
  const sales = DatabaseService.getSales();
  const duplicatas = DatabaseService.getDuplicatas();

  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toString().includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      c.document.includes(searchTerm)
    );
  });

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      creditLimit: 1500,
      notes: '',
      active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setShowModal(true);
  };

  const handleOpenHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    const customerToSave: Customer = {
      id: editingCustomer?.id || `cust-${Date.now()}`,
      code: editingCustomer?.code || 0,
      name: formData.name.toUpperCase(),
      document: formData.document || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      creditLimit: Number(formData.creditLimit) || 0,
      creditUsed: editingCustomer?.creditUsed || 0,
      active: formData.active !== false,
      notes: formData.notes || '',
      createdAt: editingCustomer?.createdAt || new Date().toISOString()
    };

    DatabaseService.saveCustomer(customerToSave);
    setShowModal(false);
    alert('Cliente salvo com sucesso!');
  };

  // Histórico de Compras e Duplicatas do Cliente Selecionado
  const customerSales = selectedCustomer ? sales.filter(s => s.customerId === selectedCustomer.id) : [];
  const customerDuplicatas = selectedCustomer ? duplicatas.filter(d => d.customerId === selectedCustomer.id) : [];

  return (
    <div className="space-y-4">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            CADASTRO & HISTÓRICO DE CLIENTES
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Gestão de crediário, limite de crédito e histórico de compras e duplicatas
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          CADASTRAR CLIENTE
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
          placeholder="Pesquisar por nome, código, CPF ou telefone..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
        />
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-16 text-center">CÓD.</th>
                <th className="py-3 px-3">NOME DO CLIENTE</th>
                <th className="py-3 px-3">CPF / CNPJ</th>
                <th className="py-3 px-3">TELEFONE</th>
                <th className="py-3 px-3">CIDADE / UF</th>
                <th className="py-3 px-3 text-right">LIMITE DE CRÉDITO</th>
                <th className="py-3 px-3 text-right">CRÉDITO USADO</th>
                <th className="py-3 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {cust.code}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white uppercase">{cust.name}</div>
                    {cust.email && <div className="text-[10px] text-slate-400">{cust.email}</div>}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {formatDocument(cust.document)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {formatPhone(cust.phone)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {cust.city ? `${cust.city}/${cust.state}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                    {formatCurrency(cust.creditLimit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                    {formatCurrency(cust.creditUsed)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenHistory(cust)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                        title="Ver Histórico de Compras e Duplicatas"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                        title="Alterar cadastro"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE CLIENTE */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? `ALTERAR CLIENTE — CÓD: ${editingCustomer.code}` : 'CADASTRAR NOVO CLIENTE'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300">NOME COMPLETO</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">CPF OU CNPJ</label>
              <input
                type="text"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">TELEFONE / WHATSAPP</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">E-MAIL</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-emerald-400">LIMITE DE CRÉDITO (R$)</label>
              <input
                type="number"
                step="50"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300">ENDEREÇO COMPLETO</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">CIDADE</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">UF</label>
              <input
                type="text"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono text-center font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300">OBSERVAÇÕES INTERNAS</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
            />
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
              Salvar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE HISTÓRICO COMPLETO DO CLIENTE */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`HISTÓRICO DO CLIENTE — ${selectedCustomer?.name}`}
        maxWidth="2xl"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-center font-mono">
              <div>
                <span className="text-slate-400 block font-sans font-bold uppercase">LIMITE TOTAL</span>
                <span className="text-white font-bold">{formatCurrency(selectedCustomer.creditLimit)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans font-bold uppercase">UTILIZADO</span>
                <span className="text-amber-400 font-bold">{formatCurrency(selectedCustomer.creditUsed)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans font-bold uppercase">DISPONÍVEL</span>
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.creditUsed)}
                </span>
              </div>
            </div>

            {/* Duplicatas em Aberto */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                DUPLICATAS & TÍTULOS VINCULADOS:
              </span>
              {customerDuplicatas.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">Nenhuma duplicata registrada para este cliente.</p>
              ) : (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">DOCUMENTO</th>
                        <th className="py-2 px-3">EMISSÃO</th>
                        <th className="py-2 px-3">VENCIMENTO</th>
                        <th className="py-2 px-3 text-right">VALOR TOTAL</th>
                        <th className="py-2 px-3 text-right">SALDO</th>
                        <th className="py-2 px-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {customerDuplicatas.map(d => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 font-mono font-bold text-white">{d.documentNumber}</td>
                          <td className="py-2 px-3 font-mono">{formatDate(d.issueDate)}</td>
                          <td className="py-2 px-3 font-mono">{formatDate(d.dueDate)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(d.totalAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">{formatCurrency(d.balance)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-950 border border-slate-700">
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Compras Recentes */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                VENDAS REALIZADAS:
              </span>
              {customerSales.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">Nenhuma venda concluída para este cliente.</p>
              ) : (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">VENDA</th>
                        <th className="py-2 px-3">DATA</th>
                        <th className="py-2 px-3">ITENS</th>
                        <th className="py-2 px-3 text-right">VALOR</th>
                        <th className="py-2 px-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {customerSales.map(s => (
                        <tr key={s.id}>
                          <td className="py-2 px-3 font-mono font-bold text-white">#{s.saleNumber}</td>
                          <td className="py-2 px-3 font-mono">{formatDateTime(s.createdAt)}</td>
                          <td className="py-2 px-3">{s.items.length} produto(s)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(s.total)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${s.status === 'CONCLUIDA' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
