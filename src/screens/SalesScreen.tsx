import React, { useState } from 'react';
import { PosScreen } from './PosScreen';
import { SalesHistoryScreen } from './SalesHistoryScreen';
import { ShoppingCart, History } from 'lucide-react';

interface SalesScreenProps {
  onOpenCashRegister: () => void;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({ onOpenCashRegister }) => {
  const [activeTab, setActiveTab] = useState<'PDV' | 'HISTORICO'>('PDV');

  return (
    <div className="space-y-3">
      {/* Abas Superiores de Vendas */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 rounded-t-lg">
        <button
          onClick={() => setActiveTab('PDV')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'PDV'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>FRENTE DE CAIXA (PDV)</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORICO')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'HISTORICO'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>HISTÓRICO DE VENDAS</span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === 'PDV' ? (
        <PosScreen onOpenCashRegister={onOpenCashRegister} />
      ) : (
        <SalesHistoryScreen />
      )}
    </div>
  );
};
