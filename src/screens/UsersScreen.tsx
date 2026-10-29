import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { DatabaseService } from '../services/db';
import { formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  UserCheck,
  Plus,
  Shield,
  Edit,
  Lock,
  Mail,
  CheckCircle2,
  XCircle,
  Percent
} from 'lucide-react';

export const UsersScreen: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>(DatabaseService.getUsers());
  const currentUser = DatabaseService.getCurrentUser();

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'OPERADOR',
    maxDiscountPercent: 10,
    canCancelSales: false,
    canAdjustStock: false,
    canRestoreBackup: false,
    active: true,
    passwordHash: ''
  });

  const handleOpenNew = () => {
    if (currentUser?.role !== 'ADMINISTRADOR') {
      alert('ACESSO RESTRITO: Apenas Administradores podem cadastrar novos usuários.');
      return;
    }
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'OPERADOR',
      maxDiscountPercent: 10,
      canCancelSales: false,
      canAdjustStock: false,
      canRestoreBackup: false,
      active: true,
      passwordHash: '123456'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    if (currentUser?.role !== 'ADMINISTRADOR') {
      alert('ACESSO RESTRITO: Apenas Administradores podem editar usuários.');
      return;
    }
    setEditingUser(user);
    setFormData({ ...user });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'ADMINISTRADOR') {
      alert('ACESSO RESTRITO: Apenas Administradores podem salvar usuários.');
      return;
    }

    if (!formData.name?.trim() || !formData.email?.trim()) {
      alert('Preencha os campos obrigatórios (nome e e-mail).');
      return;
    }

    const toSave: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      name: formData.name.toUpperCase(),
      email: formData.email.toLowerCase().trim(),
      role: formData.role || 'OPERADOR',
      active: formData.active !== false,
      maxDiscountPercent: Number(formData.maxDiscountPercent) || 5,
      canCancelSales: Boolean(formData.canCancelSales),
      canAdjustStock: Boolean(formData.canAdjustStock),
      canRestoreBackup: Boolean(formData.canRestoreBackup),
      passwordHash: formData.passwordHash || '123456',
      createdAt: editingUser?.createdAt || new Date().toISOString()
    };

    DatabaseService.saveUser(toSave);
    setUsers(DatabaseService.getUsers());
    setShowModal(false);
    alert('Usuário salvo com sucesso!');
  };

  return (
    <div className="space-y-4">
      {/* Topo com Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            USUÁRIOS, OPERADORES & NÍVEIS DE ACESSO
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Administradores, Gerentes e Operadores de Caixa com permissões granulares
          </p>
        </div>

        {currentUser?.role === 'ADMINISTRADOR' && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            CADASTRAR USUÁRIO
          </button>
        )}
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">NOME DO USUÁRIO</th>
                <th className="py-3 px-3">E-MAIL DE ACESSO</th>
                <th className="py-3 px-3 text-center">NÍVEL DE ACESSO</th>
                <th className="py-3 px-3 text-center">DESCONTO MÁXIMO</th>
                <th className="py-3 px-3 text-center">CANCELAR VENDAS?</th>
                <th className="py-3 px-3 text-center">AJUSTAR ESTOQUE?</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white uppercase">
                    {u.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.role === 'ADMINISTRADOR'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : u.role === 'GERENTE'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                    {u.maxDiscountPercent}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={u.canCancelSales ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {u.canCancelSales ? 'AUTORIZADO' : 'NÃO'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={u.canAdjustStock ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {u.canAdjustStock ? 'AUTORIZADO' : 'NÃO'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${u.active ? 'text-emerald-400' : 'text-red-400'}`}>
                      {u.active ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                      title="Editar Usuário"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE USUÁRIO */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? `ALTERAR USUÁRIO — ${editingUser.name}` : 'CADASTRAR NOVO USUÁRIO'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">NOME COMPLETO</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">E-MAIL DE LOGIN</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">NÍVEL DE ACESSO</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold uppercase"
              >
                <option value="OPERADOR">OPERADOR DE CAIXA</option>
                <option value="GERENTE">GERENTE</option>
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">DESCONTO MÁXIMO (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.maxDiscountPercent}
                onChange={(e) => setFormData({ ...formData, maxDiscountPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs font-bold text-center"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">SENHA DE ACESSO</label>
            <input
              type="password"
              value={formData.passwordHash || ''}
              onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
              placeholder="Digite a nova senha..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
            />
          </div>

          {/* Permissões Granulares */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              PERMISSÕES ESPECIAIS:
            </span>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.canCancelSales}
                onChange={(e) => setFormData({ ...formData, canCancelSales: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
              <span>Pode cancelar vendas concluídas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.canAdjustStock}
                onChange={(e) => setFormData({ ...formData, canAdjustStock: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
              <span>Pode realizar ajustes manuais de estoque</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.canRestoreBackup}
                onChange={(e) => setFormData({ ...formData, canRestoreBackup: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
              />
              <span>Pode restaurar backups do sistema</span>
            </label>
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
              Salvar Usuário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
