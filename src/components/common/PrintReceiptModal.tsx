import React from 'react';
import { Sale, StoreSettings } from '../../types';
import { formatCurrency, formatDateTime, formatDocument } from '../../utils/formatters';
import { Printer } from 'lucide-react';
import { Modal } from './Modal';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: StoreSettings;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="COMPROVANTE DE VENDA" maxWidth="md">
      <div className="space-y-4">
        {/* Visualizador de Cupom Térmico 80mm */}
        <div 
          id="printable-receipt"
          className="bg-white text-black p-6 rounded shadow-inner font-mono text-xs leading-relaxed max-w-sm mx-auto border border-slate-300"
        >
          {/* Cabeçalho */}
          <div className="text-center pb-3 border-b border-dashed border-gray-400 space-y-1">
            <h1 className="font-bold text-sm tracking-wider uppercase">{settings.storeName}</h1>
            <p className="text-gray-600">{settings.tradingName}</p>
            <p>CNPJ: {settings.cnpj} - IE: {settings.ie}</p>
            <p>{settings.address}</p>
            <p>{settings.city} - {settings.state} | Tel: {settings.phone}</p>
          </div>

          {/* Dados do Cupom */}
          <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>VENDA Nº {sale.saleNumber}</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>OPERADOR: {sale.operatorName}</span>
              <span>PDV: 01</span>
            </div>
            <div className="text-gray-700">
              <span>CLIENTE: {sale.customerName}</span>
              {sale.customerDoc && <span> ({formatDocument(sale.customerDoc)})</span>}
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="py-2 border-b border-dashed border-gray-400">
            <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 pb-1 mb-1">
              <span className="w-8">QTD</span>
              <span className="flex-1 px-1">ITEM / TAM / COR</span>
              <span className="w-16 text-right">UNIT.</span>
              <span className="w-16 text-right">TOTAL</span>
            </div>
            <div className="space-y-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="w-8 font-semibold">{item.quantity}x</span>
                  <div className="flex-1 px-1">
                    <p className="font-medium">{item.productName}</p>
                    {(item.size || item.color) && (
                      <p className="text-[10px] text-gray-600">
                        {item.color && `Cor: ${item.color}`} {item.size && `| Tam: ${item.size}`}
                      </p>
                    )}
                  </div>
                  <span className="w-16 text-right">{formatCurrency(item.unitPrice)}</span>
                  <span className="w-16 text-right font-semibold">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>DESCONTO:</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
              <span>TOTAL A PAGAR:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
            <span className="font-bold text-gray-700">PAGAMENTO:</span>
            {sale.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {p.method} {p.installments && p.installments > 1 ? `(${p.installments}x de ${formatCurrency(p.amount / p.installments)})` : ''}:
                </span>
                <span className="font-semibold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {sale.payments.some(p => p.changeAmount && p.changeAmount > 0) && (
              <div className="flex justify-between font-bold text-emerald-800 pt-1">
                <span>TROCO:</span>
                <span>{formatCurrency(sale.payments.find(p => p.changeAmount)?.changeAmount)}</span>
              </div>
            )}
          </div>

          {/* Observações / Endereço de Entrega */}
          {sale.notes && (
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-gray-700">
              <span className="font-bold">OBSERVAÇÕES / ENTREGA:</span>
              <p className="font-medium whitespace-pre-wrap">{sale.notes}</p>
            </div>
          )}

          {/* Mensagem de Rodapé */}
          <div className="text-center pt-3 text-[10px] text-gray-600 space-y-1">
            <p className="font-semibold">{settings.receiptFooterMessage}</p>
            <p>SISTEMA LA FITNESS PDV PROFISSIONAL</p>
            <p>*** NÃO É DOCUMENTO FISCAL ***</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 justify-end pt-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-sm transition-colors"
          >
            FECHAR
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow transition-colors"
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR COMPROVANTE
          </button>
        </div>
      </div>
    </Modal>
  );
};
