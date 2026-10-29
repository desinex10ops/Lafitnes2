import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { DatabaseService } from '../services/db';
import {
  Settings,
  Save,
  Building,
  Printer,
  Sliders,
  Tag,
  Palette,
  CheckCircle2,
  Cloud,
  HardDrive,
  ShieldCheck
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(DatabaseService.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados temporários para tags
  const [newCategory, setNewCategory] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    DatabaseService.saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.categories.includes(newCategory.trim())) return;
    setSettings({
      ...settings,
      categories: [...settings.categories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== cat)
    });
  };

  const handleAddSize = () => {
    if (!newSize.trim()) return;
    if (settings.sizes.includes(newSize.trim().toUpperCase())) return;
    setSettings({
      ...settings,
      sizes: [...settings.sizes, newSize.trim().toUpperCase()]
    });
    setNewSize('');
  };

  const handleRemoveSize = (sz: string) => {
    setSettings({
      ...settings,
      sizes: settings.sizes.filter(s => s !== sz)
    });
  };

  const handleAddColor = () => {
    if (!newColor.trim()) return;
    if (settings.colors.includes(newColor.trim())) return;
    setSettings({
      ...settings,
      colors: [...settings.colors, newColor.trim()]
    });
    setNewColor('');
  };

  const handleRemoveColor = (col: string) => {
    setSettings({
      ...settings,
      colors: settings.colors.filter(c => c !== col)
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Topo com Botão Salvar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800 sticky top-16 z-20 shadow-md">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            CONFIGURAÇÕES GERAIS DO SISTEMA
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Dados cadastrais da loja, parâmetros de desconto, impressão e grade fitness
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow-lg cursor-pointer transition-all"
        >
          <Save className="w-4 h-4" />
          SALVAR ALTERAÇÕES
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Configurações salvas e aplicadas em todo o sistema com sucesso!</span>
        </div>
      )}

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Painel 1: Dados Cadastrais da Empresa */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-2">
            <Building className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-wider">
              DADOS CADASTRAIS DA LOJA
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">RAZÃO SOCIAL</label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">NOME FANTASIA (EXIBIÇÃO)</label>
              <input
                type="text"
                required
                value={settings.tradingName}
                onChange={(e) => setSettings({ ...settings, tradingName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">CNPJ</label>
                <input
                  type="text"
                  value={settings.cnpj}
                  onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">INSCRIÇÃO ESTADUAL (IE)</label>
                <input
                  type="text"
                  value={settings.ie}
                  onChange={(e) => setSettings({ ...settings, ie: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">TELEFONE / WHATSAPP</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">E-MAIL COMERCIAL</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">ENDEREÇO COMPLETO</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">CIDADE</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono text-center font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Painel 2: Impressão e Parâmetros Comerciais */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-2">
            <Printer className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-wider">
              IMPRESSORA & PARÂMETROS DE VENDA
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">FORMATO DA IMPRESSORA</label>
              <select
                value={settings.printerType}
                onChange={(e) => setSettings({ ...settings, printerType: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                <option value="80mm">BOBINA TÉRMICA PADRÃO 80MM (RECOMENDADO)</option>
                <option value="58mm">BOBINA TÉRMICA PEQUENA 58MM</option>
                <option value="A4">FOLHA A4 COMPLETA</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                MENSAGEM DE RODAPÉ DO COMPROVANTE
              </label>
              <textarea
                rows={2}
                value={settings.receiptFooterMessage}
                onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">MARKUP PADRÃO (%)</label>
                <input
                  type="number"
                  value={settings.defaultMarkupPercent}
                  onChange={(e) => setSettings({ ...settings, defaultMarkupPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs font-bold text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-300 block">DESCONTO MÁXIMO OPERADOR (%)</label>
                <input
                  type="number"
                  value={settings.maxDiscountWithoutApproval}
                  onChange={(e) => setSettings({ ...settings, maxDiscountWithoutApproval: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Painel 3: Grade Padrão (Tamanhos e Cores Fitness) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-md md:col-span-2">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-2">
            <Palette className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-wider">
              MATRIZ FITNESS: CATEGORIAS, TAMANHOS & CORES DA GRADE
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Categorias */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-300 block">CATEGORIAS DE PRODUTOS</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nova categoria..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                {settings.categories.map(cat => (
                  <span
                    key={cat}
                    onClick={() => handleRemoveCategory(cat)}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs cursor-pointer hover:border-red-600 hover:text-red-400"
                    title="Clique para remover"
                  >
                    {cat} &times;
                  </span>
                ))}
              </div>
            </div>

            {/* Tamanhos */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-300 block">TAMANHOS DA GRADE</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Ex: P, M, G, GG..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                {settings.sizes.map(sz => (
                  <span
                    key={sz}
                    onClick={() => handleRemoveSize(sz)}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold cursor-pointer hover:border-red-600 hover:text-red-400"
                    title="Clique para remover"
                  >
                    {sz} &times;
                  </span>
                ))}
              </div>
            </div>

            {/* Cores */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-300 block">CORES DE TECIDO</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Ex: Preto, Mescla..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                {settings.colors.map(col => (
                  <span
                    key={col}
                    onClick={() => handleRemoveColor(col)}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs cursor-pointer hover:border-red-600 hover:text-red-400"
                    title="Clique para remover"
                  >
                    {col} &times;
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Painel 4: Rotinas de Backup Automático (Opções 1 & 2) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-md md:col-span-2">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="text-xs font-black uppercase tracking-wider">
              ROTINAS DE BACKUP AUTOMÁTICO & NUVEM (OPÇÃO 1 & OPÇÃO 2)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Opção 1: Backup no Fechamento do Caixa */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  BACKUP NO FECHAMENTO DO CAIXA
                </span>
                <input
                  type="checkbox"
                  checked={settings.autoBackupOnCashClose !== false}
                  onChange={(e) => setSettings({ ...settings, autoBackupOnCashClose: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ao fechar o caixa no final do expediente, gera e baixa automaticamente o arquivo <code className="text-emerald-400 font-mono">backup_lafitness_fechamento.json</code> e arquiva uma cópia segura.
              </p>
            </div>

            {/* Opção 2: Backup Automático em Nuvem */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-teal-400" />
                  BACKUP AUTOMÁTICO EM NUVEM
                </span>
                <input
                  type="checkbox"
                  checked={settings.autoBackupCloud !== false}
                  onChange={(e) => setSettings({ ...settings, autoBackupCloud: e.target.checked })}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sincroniza cópias diárias com a nuvem (PostgreSQL / Supabase) para proteção contra perda física ou queima do computador da loja.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">Horário da rotina diária:</span>
                <input
                  type="time"
                  value={settings.autoBackupCloudHour || '23:59'}
                  onChange={(e) => setSettings({ ...settings, autoBackupCloudHour: e.target.value })}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
