import React, { useState } from 'react';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  Receipt,
  Boxes,
  Users,
  CreditCard
} from 'lucide-react';

type ReportType =
  | 'VENDAS_PERIODO'
  | 'FORMAS_PAGAMENTO'
  | 'PRODUTOS_MAIS_VENDIDOS'
  | 'DESPESAS_CATEGORIA'
  | 'ESTOQUE_CRITICO'
  | 'DUPLICATAS_VENCIDAS'
  | 'COMPRAS_FORNECEDOR';

export const ReportsScreen: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('VENDAS_PERIODO');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const sales = DatabaseService.getSales();
  const products = DatabaseService.getProducts();
  const expenses = DatabaseService.getExpenses();
  const duplicatas = DatabaseService.getDuplicatas();
  const purchases = DatabaseService.getPurchases();
  const settings = DatabaseService.getSettings();

  // Filtragem por Data (Fuso Horário Local Estrito)
  const startTime = new Date(startDate + 'T00:00:00').getTime();
  const endTime = new Date(endDate + 'T23:59:59').getTime();

  const filteredSales = sales.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t >= startTime && t <= endTime && s.status === 'CONCLUIDA';
  });

  const filteredExpenses = expenses.filter((e) => {
    const t = new Date(e.date + 'T12:00:00').getTime();
    return t >= startTime && t <= endTime;
  });

  const filteredPurchases = purchases.filter((p) => {
    const t = new Date(p.entryDate + 'T12:00:00').getTime();
    return t >= startTime && t <= endTime && p.status === 'CONFIRMADA';
  });

  const exportToCSV = (filename: string, rows: string[][]) => {
    const processRow = (row: string[]) =>
      row.map(val => `"${val.replace(/"/g, '""')}"`).join(';');
    const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (reportType === 'VENDAS_PERIODO') {
      const rows = [
        ['VENDA Nº', 'DATA', 'CLIENTE', 'OPERADOR', 'SUBTOTAL', 'DESCONTO', 'TOTAL'],
        ...filteredSales.map(s => [
          s.saleNumber.toString(),
          formatDateTime(s.createdAt),
          s.customerName || 'Consumidor',
          s.operatorName,
          s.subtotal.toFixed(2),
          s.discountAmount.toFixed(2),
          s.total.toFixed(2)
        ])
      ];
      exportToCSV('relatorio_vendas_lafitness', rows);
    } else if (reportType === 'FORMAS_PAGAMENTO') {
      const payMap: Record<string, { total: number; count: number }> = {};
      let totalGeral = 0;
      filteredSales.forEach(s => {
        s.payments.forEach(p => {
          if (!payMap[p.method]) payMap[p.method] = { total: 0, count: 0 };
          payMap[p.method].total += p.amount;
          payMap[p.method].count += 1;
          totalGeral += p.amount;
        });
      });
      const rows = [
        ['FORMA DE PAGAMENTO', 'QUANTIDADE DE TRANSAÇÕES', 'TOTAL (R$)', 'PARTICIPAÇÃO (%)'],
        ...Object.entries(payMap).map(([method, data]) => [
          method,
          data.count.toString(),
          data.total.toFixed(2),
          totalGeral > 0 ? ((data.total / totalGeral) * 100).toFixed(1) + '%' : '0%'
        ])
      ];
      exportToCSV('relatorio_formas_pagamento_lafitness', rows);
    } else if (reportType === 'PRODUTOS_MAIS_VENDIDOS') {
      const itemMap: Record<string, { name: string; qty: number; total: number }> = {};
      filteredSales.forEach(s => {
        s.items.forEach(it => {
          if (!itemMap[it.productId]) {
            itemMap[it.productId] = { name: it.productName, qty: 0, total: 0 };
          }
          itemMap[it.productId].qty += it.quantity;
          itemMap[it.productId].total += it.totalPrice;
        });
      });
      const rows = [
        ['PRODUTO', 'QUANTIDADE VENDIDA', 'FATURAMENTO GERADO'],
        ...Object.values(itemMap).map(it => [
          it.name,
          it.qty.toString(),
          it.total.toFixed(2)
        ])
      ];
      exportToCSV('relatorio_produtos_mais_vendidos', rows);
    } else if (reportType === 'DESPESAS_CATEGORIA') {
      const rows = [
        ['CATEGORIA', 'TOTAL GASTO (R$)'],
        ...settings.expenseCategories.map(cat => {
          const tot = filteredExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0);
          return [cat, tot.toFixed(2)];
        })
      ];
      exportToCSV('relatorio_despesas_categoria_lafitness', rows);
    } else if (reportType === 'ESTOQUE_CRITICO') {
      const rows = [
        ['PRODUTO', 'CATEGORIA', 'ESTOQUE MÍNIMO', 'SALDO ATUAL', 'SITUAÇÃO'],
        ...products.filter(p => p.active && p.stock <= p.minStock).map(p => [
          p.name,
          p.category,
          p.minStock.toString(),
          p.stock.toString(),
          p.stock <= 0 ? 'SEM ESTOQUE' : 'ABAIXO DO MÍNIMO'
        ])
      ];
      exportToCSV('relatorio_estoque_critico_lafitness', rows);
    } else if (reportType === 'DUPLICATAS_VENCIDAS') {
      const rows = [
        ['TÍTULO', 'CLIENTE', 'CPF', 'VENCIMENTO', 'VALOR TOTAL', 'SALDO PENDENTE', 'STATUS'],
        ...duplicatas.filter(d => d.status !== 'PAGA' && d.status !== 'CANCELADA').map(d => [
          d.documentNumber,
          d.customerName,
          d.customerDoc,
          d.dueDate,
          d.totalAmount.toFixed(2),
          d.balance.toFixed(2),
          d.status
        ])
      ];
      exportToCSV('relatorio_duplicatas_pendentes_lafitness', rows);
    } else if (reportType === 'COMPRAS_FORNECEDOR') {
      const rows = [
        ['COMPRA Nº', 'NF Nº', 'FORNECEDOR', 'DATA ENTRADA', 'TOTAL (R$)', 'STATUS'],
        ...filteredPurchases.map(p => [
          p.purchaseNumber.toString(),
          p.invoiceNumber,
          p.supplierName,
          p.entryDate,
          p.totalAmount.toFixed(2),
          p.status
        ])
      ];
      exportToCSV('relatorio_compras_fornecedor_lafitness', rows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Topo com Filtros e Exportação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            CENTRAL DE RELATÓRIOS GERENCIAIS & AUDITORIA
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Exportação para planilhas e impressão com dados consolidados do banco
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* Seletores de Tipo de Relatório e Datas */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-slate-300 block">SELECIONE O RELATÓRIO</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold uppercase"
          >
            <option value="VENDAS_PERIODO">VENDAS POR PERÍODO</option>
            <option value="FORMAS_PAGAMENTO">VENDAS POR FORMA DE PAGAMENTO</option>
            <option value="PRODUTOS_MAIS_VENDIDOS">PRODUTOS MAIS VENDIDOS (CURVA ABC)</option>
            <option value="DESPESAS_CATEGORIA">DESPESAS POR CATEGORIA</option>
            <option value="ESTOQUE_CRITICO">ESTOQUE ATUAL & CRÍTICO</option>
            <option value="DUPLICATAS_VENCIDAS">DUPLICATAS & RECEBIMENTOS PENDENTES</option>
            <option value="COMPRAS_FORNECEDOR">COMPRAS POR FORNECEDOR</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-slate-300 block">DATA INICIAL</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-slate-300 block">DATA FINAL</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono"
          />
        </div>
      </div>

      {/* Exibição do Relatório Selecionado */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        {reportType === 'VENDAS_PERIODO' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">VENDA</th>
                  <th className="py-3 px-3">DATA & HORA</th>
                  <th className="py-3 px-3">CLIENTE</th>
                  <th className="py-3 px-3">OPERADOR</th>
                  <th className="py-3 px-3 text-right">SUBTOTAL</th>
                  <th className="py-3 px-3 text-right">DESCONTO</th>
                  <th className="py-3 px-3 text-right">TOTAL LÍQUIDO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-white">#{s.saleNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{formatDateTime(s.createdAt)}</td>
                    <td className="py-3 px-3 font-bold uppercase">{s.customerName}</td>
                    <td className="py-3 px-3 text-slate-400">{s.operatorName}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(s.subtotal)}</td>
                    <td className="py-3 px-3 text-right font-mono text-red-400">{formatCurrency(s.discountAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold text-xs uppercase border-t border-slate-800 text-slate-300">
                <tr>
                  <td colSpan={4} className="py-3 px-3">TOTAL GERAL DO PERÍODO ({filteredSales.length} vendas)</td>
                  <td className="py-3 px-3 text-right font-mono">{formatCurrency(filteredSales.reduce((acc, s) => acc + s.subtotal, 0))}</td>
                  <td className="py-3 px-3 text-right font-mono text-red-400">-{formatCurrency(filteredSales.reduce((acc, s) => acc + s.discountAmount, 0))}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-base">{formatCurrency(filteredSales.reduce((acc, s) => acc + s.total, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {reportType === 'FORMAS_PAGAMENTO' && (() => {
          const payMap: Record<string, { total: number; count: number }> = {};
          let totalGeral = 0;
          filteredSales.forEach(s => {
            s.payments.forEach(p => {
              if (!payMap[p.method]) payMap[p.method] = { total: 0, count: 0 };
              payMap[p.method].total += p.amount;
              payMap[p.method].count += 1;
              totalGeral += p.amount;
            });
          });
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">FORMA DE PAGAMENTO</th>
                    <th className="py-3 px-3 text-center">TRANSAÇÕES</th>
                    <th className="py-3 px-3 text-right">TOTAL ARRECADADO</th>
                    <th className="py-3 px-3 text-right">PARTICIPAÇÃO NO FATURAMENTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {Object.entries(payMap).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-bold uppercase">
                        Nenhuma venda registrada no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(payMap).map(([method, data]) => (
                      <tr key={method} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white uppercase">{method}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">{data.count}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(data.total)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                          {totalGeral > 0 ? ((data.total / totalGeral) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-950 font-bold text-xs uppercase border-t border-slate-800 text-slate-300">
                  <tr>
                    <td className="py-3 px-3">TOTAL CONSOLIDADO</td>
                    <td className="py-3 px-3 text-center font-mono">{Object.values(payMap).reduce((acc, d) => acc + d.count, 0)}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-base">{formatCurrency(totalGeral)}</td>
                    <td className="py-3 px-3 text-right font-mono">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })()}

        {reportType === 'PRODUTOS_MAIS_VENDIDOS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">PRODUTO</th>
                  <th className="py-3 px-3 text-center">QUANTIDADE TOTAL VENDIDA</th>
                  <th className="py-3 px-3 text-right">FATURAMENTO GERADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {products.map(p => {
                  let totalSold = 0;
                  let totalRevenue = 0;
                  filteredSales.forEach(s => {
                    s.items.filter(it => it.productId === p.id).forEach(it => {
                      totalSold += it.quantity;
                      totalRevenue += it.totalPrice;
                    });
                  });
                  return { p, totalSold, totalRevenue };
                })
                .sort((a, b) => b.totalSold - a.totalSold)
                .map(({ p, totalSold, totalRevenue }) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white uppercase">{p.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-sm text-emerald-400">{totalSold} un</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">{formatCurrency(totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'ESTOQUE_CRITICO' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">PRODUTO</th>
                  <th className="py-3 px-3">CATEGORIA</th>
                  <th className="py-3 px-3 text-center">ESTOQUE MÍNIMO</th>
                  <th className="py-3 px-3 text-center">SALDO ATUAL</th>
                  <th className="py-3 px-3 text-center">SITUAÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {products.filter(p => p.active && p.stock <= p.minStock).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white uppercase">{p.name}</td>
                    <td className="py-3 px-3 text-slate-400 uppercase">{p.category}</td>
                    <td className="py-3 px-3 text-center font-mono">{p.minStock} un</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-red-400">{p.stock} un</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950 text-red-400 border border-red-800">
                        {p.stock <= 0 ? 'SEM ESTOQUE' : 'ABAIXO DO MÍNIMO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'DUPLICATAS_VENCIDAS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">TÍTULO</th>
                  <th className="py-3 px-3">CLIENTE</th>
                  <th className="py-3 px-3">CPF</th>
                  <th className="py-3 px-3 font-mono">VENCIMENTO</th>
                  <th className="py-3 px-3 text-right">VALOR TOTAL</th>
                  <th className="py-3 px-3 text-right">SALDO PENDENTE</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {duplicatas.filter(d => d.status !== 'PAGA' && d.status !== 'CANCELADA').map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-white">{d.documentNumber}</td>
                    <td className="py-3 px-3 font-bold uppercase">{d.customerName}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{d.customerDoc}</td>
                    <td className="py-3 px-3 font-mono">{formatDate(d.dueDate)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(d.totalAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">{formatCurrency(d.balance)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-800">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'DESPESAS_CATEGORIA' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">CATEGORIA</th>
                  <th className="py-3 px-3 text-right">TOTAL GASTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {settings.expenseCategories.map(cat => {
                  const total = filteredExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0);
                  return (
                    <tr key={cat} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white uppercase">{cat}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-red-400">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-950 font-bold text-xs uppercase border-t border-slate-800 text-slate-300">
                <tr>
                  <td className="py-3 px-3">TOTAL DE DESPESAS NO PERÍODO</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-red-400 text-base">
                    {formatCurrency(filteredExpenses.reduce((acc, e) => acc + e.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {reportType === 'COMPRAS_FORNECEDOR' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">COMPRA Nº</th>
                  <th className="py-3 px-3">NF Nº</th>
                  <th className="py-3 px-3">FORNECEDOR</th>
                  <th className="py-3 px-3 font-mono">DATA DE ENTRADA</th>
                  <th className="py-3 px-3 text-right">TOTAL (R$)</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold uppercase">
                      Nenhuma compra confirmada encontrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-white">#{p.purchaseNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{p.invoiceNumber}</td>
                      <td className="py-3 px-3 font-bold uppercase text-slate-100">{p.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{formatDate(p.entryDate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(p.totalAmount)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-bold text-xs uppercase border-t border-slate-800 text-slate-300">
                <tr>
                  <td colSpan={4} className="py-3 px-3">TOTAL DE COMPRAS NO PERÍODO ({filteredPurchases.length} notas)</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-base">
                    {formatCurrency(filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
