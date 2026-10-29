import React, { useState } from 'react';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ScreenId } from '../components/layout/Sidebar';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  PackageX,
  CreditCard,
  PlusCircle,
  Boxes,
  Truck,
  Wallet,
  ClipboardList,
  Calendar,
  Percent,
  Clock
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type PeriodFilter = 'HOJE' | 'SEMANA' | 'MES' | 'TUDO';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [period, setPeriod] = useState<PeriodFilter>('MES');

  const sales = DatabaseService.getSales();
  const products = DatabaseService.getProducts();
  const duplicatas = DatabaseService.getDuplicatas();
  const bills = DatabaseService.getBillsToPay();
  const expenses = DatabaseService.getExpenses();
  const activeRegister = DatabaseService.getActiveRegister();

  // Filtragem por Período
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getTime() - 7 * 86400 * 1000).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredSales = sales.filter((sale) => {
    const saleTime = new Date(sale.createdAt).getTime();
    if (period === 'HOJE') return saleTime >= startOfDay;
    if (period === 'SEMANA') return saleTime >= startOfWeek;
    if (period === 'MES') return saleTime >= startOfMonth;
    return true; // TUDO
  });

  const activeSales = filteredSales.filter(s => s.status === 'CONCLUIDA');
  const canceledSales = filteredSales.filter(s => s.status === 'CANCELADA');

  // Cálculos Reais e Rigorosos
  const faturamentoBruto = activeSales.reduce((acc, s) => acc + s.subtotal, 0);
  const descontosConcedidos = activeSales.reduce((acc, s) => acc + s.discountAmount, 0);
  const vendasLiquidas = activeSales.reduce((acc, s) => acc + s.total, 0);
  const custoTotal = activeSales.reduce((acc, s) => acc + s.totalCost, 0);
  const lucroBrutoEstimado = Math.max(0, vendasLiquidas - custoTotal);
  const quantidadeVendas = activeSales.length;
  const ticketMedio = quantidadeVendas > 0 ? vendasLiquidas / quantidadeVendas : 0;
  const valorCancelamentos = canceledSales.reduce((acc, s) => acc + s.total, 0);

  // Valor Recebido vs Pendente (Distinção contábil estrita)
  let valorRecebidoEfetivo = 0;
  let valorPendenteRecebimento = 0;

  activeSales.forEach(s => {
    s.payments.forEach(p => {
      if (p.method === 'DUPLICATA' || p.method === 'A_PRAZO') {
        valorPendenteRecebimento += p.amount;
      } else {
        valorRecebidoEfetivo += p.amount;
      }
    });
  });

  // Acrescenta quitações de duplicatas recebidas dentro do período
  duplicatas.forEach(d => {
    d.installments.forEach(inst => {
      if (inst.status === 'PAGO' && inst.paidAt) {
        const paidTime = new Date(inst.paidAt).getTime();
        let inPeriod = false;
        if (period === 'HOJE') inPeriod = paidTime >= startOfDay;
        else if (period === 'SEMANA') inPeriod = paidTime >= startOfWeek;
        else if (period === 'MES') inPeriod = paidTime >= startOfMonth;
        else inPeriod = true;

        if (inPeriod) {
          valorRecebidoEfetivo += inst.paidAmount;
        }
      }
    });
  });

  // Despesas do Período
  const filteredExpenses = expenses.filter((exp) => {
    const expTime = new Date(exp.date + 'T12:00:00').getTime();
    if (period === 'HOJE') return expTime >= startOfDay;
    if (period === 'SEMANA') return expTime >= startOfWeek;
    if (period === 'MES') return expTime >= startOfMonth;
    return true;
  });
  const despesasPeriodo = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Contas a Pagar e Receber Críticas
  const contasPagarProximas = bills.filter(b => b.status === 'PENDENTE');
  const totalContasPagarPendentes = contasPagarProximas.reduce((acc, b) => acc + b.balance, 0);

  const duplicatasAtrasadas = duplicatas.filter(d => {
    return (d.status === 'ABERTA' || d.status === 'PARCIAL') && new Date(d.dueDate).getTime() < startOfDay;
  });
  const totalDuplicatasAtrasadas = duplicatasAtrasadas.reduce((acc, d) => acc + d.balance, 0);

  // Alertas de Estoque
  const produtosEstoqueBaixo = products.filter(p => p.active && p.stock <= p.minStock && p.stock > 0);
  const produtosSemEstoque = products.filter(p => p.active && p.stock <= 0);

  // Formas de Pagamento no Período
  const paymentBreakdown: Record<string, number> = {};
  activeSales.forEach(s => {
    s.payments.forEach(p => {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + p.amount;
    });
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Período e Título */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            PAINEL GERENCIAL & INDICADORES
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Visão financeira em tempo real com dados consolidados da loja
          </p>
        </div>

        {/* Botões de Filtro */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800">
          {(['HOJE', 'SEMANA', 'MES', 'TUDO'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                period === p
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'HOJE' ? 'Hoje' : p === 'SEMANA' ? 'Últimos 7 dias' : p === 'MES' ? 'Mês Atual' : 'Todo Período'}
            </button>
          ))}
        </div>
      </div>

      {/* Atalhos Rápidos Operacionais */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigate('VENDAS')}
          className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>ABRIR PDV (F2)</span>
        </button>
        <button
          onClick={() => onNavigate('ESTOQUE')}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
        >
          <Boxes className="w-4 h-4 text-emerald-400" />
          <span>PRODUTOS</span>
        </button>
        <button
          onClick={() => onNavigate('COMPRAS')}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
        >
          <Truck className="w-4 h-4 text-blue-400" />
          <span>LANÇAR COMPRA</span>
        </button>
        <button
          onClick={() => onNavigate('CAIXA')}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-amber-400" />
          <span>{activeRegister?.status === 'ABERTO' ? 'CAIXA ATIVO' : 'ABRIR CAIXA'}</span>
        </button>
        <button
          onClick={() => onNavigate('INVENTARIO')}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all col-span-2 sm:col-span-1 cursor-pointer"
        >
          <ClipboardList className="w-4 h-4 text-purple-400" />
          <span>INVENTÁRIO</span>
        </button>
      </div>

      {/* Grid Principal de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Líquido */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">VENDAS LÍQUIDAS</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">
              {formatCurrency(vendasLiquidas)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Bruto: {formatCurrency(faturamentoBruto)}</span>
            <span className="text-red-400">Desc: -{formatCurrency(descontosConcedidos)}</span>
          </div>
        </div>

        {/* Quantidade e Ticket Médio */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">QUANTIDADE & TICKET</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white font-mono">
              {quantidadeVendas} <span className="text-sm font-normal text-slate-400">vendas</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Ticket Médio:</span>
            <span className="font-bold text-slate-200">{formatCurrency(ticketMedio)}</span>
          </div>
        </div>

        {/* Lucro Bruto Estimado */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">LUCRO BRUTO ESTIMADO</span>
            <Percent className="w-4 h-4 text-teal-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(lucroBrutoEstimado)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Margem estimada:</span>
            <span className="font-bold text-slate-200">
              {vendasLiquidas > 0 ? ((lucroBrutoEstimado / vendasLiquidas) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Cancelamentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">CANCELAMENTOS</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-red-400 font-mono">
              {formatCurrency(valorCancelamentos)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Vendas canceladas:</span>
            <span className="font-bold text-red-400">{canceledSales.length}</span>
          </div>
        </div>
      </div>

      {/* Grid Secundário: Fluxo Financeiro e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recebido vs Pendente (Duplicatas) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            RECEBIMENTOS & DUPLICATAS
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Valor Efetivamente Recebido</p>
                <p className="text-base font-bold text-emerald-400 font-mono">{formatCurrency(valorRecebidoEfetivo)}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                À Vista / Cartão
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">A Receber em Duplicata</p>
                <p className="text-base font-bold text-amber-400 font-mono">{formatCurrency(valorPendenteRecebimento)}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                A Prazo
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Contas a Receber Atrasadas</p>
                <p className="text-base font-bold text-red-400 font-mono">{formatCurrency(totalDuplicatasAtrasadas)}</p>
              </div>
              <button
                onClick={() => onNavigate('CONTAS_A_RECEBER')}
                className="text-xs text-red-400 hover:underline font-bold"
              >
                Cobrar
              </button>
            </div>
          </div>
        </div>

        {/* Formas de Pagamento no Período */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            VENDAS POR FORMA DE PAGAMENTO
          </h2>
          <div className="space-y-2.5">
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhuma venda registrada no período selecionado.</p>
            ) : (
              Object.entries(paymentBreakdown).map(([method, amount]) => {
                const percent = vendasLiquidas > 0 ? (amount / vendasLiquidas) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-200">
                      <span>{method}</span>
                      <span className="font-mono">{formatCurrency(amount)} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alertas Operacionais de Estoque */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            ALERTAS DE ESTOQUE CRÍTICO
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-950/40 rounded-lg border border-red-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PackageX className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs font-bold text-red-300">Produtos sem estoque</p>
                  <p className="text-[11px] text-red-400/80">{produtosSemEstoque.length} itens zerados</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('ESTOQUE')}
                className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-red-100 rounded text-xs font-bold"
              >
                Ver
              </button>
            </div>

            <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-amber-300">Abaixo do estoque mínimo</p>
                  <p className="text-[11px] text-amber-400/80">{produtosEstoqueBaixo.length} itens necessitando reposição</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('ESTOQUE')}
                className="px-2.5 py-1 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded text-xs font-bold"
              >
                Repor
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-300">Contas a pagar pendentes</p>
                <p className="text-[11px] text-slate-400 font-mono">{formatCurrency(totalContasPagarPendentes)} a quitar</p>
              </div>
              <button
                onClick={() => onNavigate('CONTAS_A_PAGAR')}
                className="text-xs text-blue-400 hover:underline font-bold"
              >
                Acessar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
