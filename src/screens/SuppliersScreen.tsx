import React, { useState } from 'react';
import { Supplier } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDocument, formatPhone, formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  Building2,
  Plus,
  Search,
  Edit,
  FileText
} from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const suppliers = DatabaseService.getSuppliers();
  const purchases = DatabaseService.getPurchases();
  const products = DatabaseService.getProducts();

  const [formData, setFormData] = useState<Partial<Supplier>>({
    corporateName: '',
    tradeName: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    paymentTerms: '28 / 56 dias',
    notes: '',
    active: true
  });

  const filteredSuppliers = suppliers.filter(s => {
    return (
      s.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.corporateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document.includes(searchTerm) ||
      s.code.toString().includes(searchTerm)
    );
  });

  const handleOpenNew = () => {
    setEditingSupplier(null);
    setFormData({
      corporateName: '',
      tradeName: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      paymentTerms: '30 dias',
      notes: '',
      active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({ ...sup });
    setShowModal(true);
  };

  const handleOpenHistory = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setShowHistoryModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tradeName?.trim()) {
      alert('Informe o Nome Fantasia do fornecedor.');
      return;
    }

    const toSave: Supplier = {
      id: editingSupplier?.id || `sup-${Date.now()}`,
      code: editingSupplier?.code || 0,
      corporateName: formData.corporateName || formData.tradeName.toUpperCase(),
      tradeName: formData.tradeName.toUpperCase(),
      document: formData.document || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      paymentTerms: formData.paymentTerms || '30 dias',
      notes: formData.notes || '',
      active: formData.active !== false,
      createdAt: editingSupplier?.createdAt || new Date().toISOString()
    };

    DatabaseService.saveSupplier(toSave);
    setShowModal(false);
    alert('Fornecedor salvo com sucesso!');
  };

  // Histórico de Compras e Produtos do Fornecedor
  const supplierPurchases = selectedSupplier ? purchases.filter(p => p.supplierId === selectedSupplier.id) : [];
  const supplierProducts = selectedSupplier ? products.filter(p => p.supplierId === selectedSupplier.id) : [];

  return (
    <div className="space-y-4">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            CADASTRO & HISTÓRICO DE FORNECEDORES
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Gestão de indústrias têxteis, frentes de suprimento e histórico de custos
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          CADASTRAR FORNECEDOR
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
          placeholder="Pesquisar por nome fantasia, razão social, CNPJ ou código..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
        />
      </div>

      {/* Tabela de Fornecedores */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-16 text-center">CÓD.</th>
                <th className="py-3 px-3">NOME FANTASIA / RAZÃO SOCIAL</th>
                <th className="py-3 px-3">CNPJ / CPF</th>
                <th className="py-3 px-3">CONTATO / FONE</th>
                <th className="py-3 px-3">CIDADE / UF</th>
                <th className="py-3 px-3 text-center">PRAZO PADRÃO</th>
                <th className="py-3 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {sup.code}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white uppercase">{sup.tradeName}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{sup.corporateName}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {formatDocument(sup.document)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    <div>{formatPhone(sup.phone)}</div>
                    {sup.email && <div className="text-[10px] text-slate-400">{sup.email}</div>}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {sup.city ? `${sup.city}/${sup.state}` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-300">
                    {sup.paymentTerms}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenHistory(sup)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                        title="Ver Notas Fiscais e Produtos Fornecidos"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(sup)}
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

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? `ALTERAR FORNECEDOR — CÓD: ${editingSupplier.code}` : 'CADASTRAR NOVO FORNECEDOR'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">NOME FANTASIA</label>
              <input
                type="text"
                required
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">RAZÃO SOCIAL</label>
              <input
                type="text"
                value={formData.corporateName}
                onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">CNPJ OU CPF</label>
              <input
                type="text"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">TELEFONE</label>
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
              <label className="text-xs font-bold uppercase text-slate-300">CONDIÇÃO DE PAGAMENTO</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="Ex: 28 / 56 dias"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300">ENDEREÇO</label>
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
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE HISTÓRICO DO FORNECEDOR */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`HISTÓRICO DO FORNECEDOR — ${selectedSupplier?.tradeName}`}
        maxWidth="2xl"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                NOTAS FISCAIS DE ENTRADA:
              </span>
              {supplierPurchases.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">Nenhuma nota fiscal lançada deste fornecedor.</p>
              ) : (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">NF</th>
                        <th className="py-2 px-3">DATA</th>
                        <th className="py-2 px-3 text-right">VALOR NOTA</th>
                        <th className="py-2 px-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {supplierPurchases.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono font-bold text-white">{p.invoiceNumber}</td>
                          <td className="py-2 px-3 font-mono">{formatDate(p.entryDate)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(p.totalAmount)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                PRODUTOS VINCULADOS A ESTE FORNECEDOR:
              </span>
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">PRODUTO</th>
                      <th className="py-2 px-3 text-right">CUSTO ATUAL</th>
                      <th className="py-2 px-3 text-right">VENDA</th>
                      <th className="py-2 px-3 text-center">SALDO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {supplierProducts.map(prod => (
                      <tr key={prod.id}>
                        <td className="py-2 px-3 uppercase">{prod.name}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(prod.costPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(prod.sellingPrice)}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{prod.stock} un</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
