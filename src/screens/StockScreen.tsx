import React, { useState } from 'react';
import { Product, ProductVariation, StockMovement, Supplier } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Sliders,
  Image as ImageIcon,
  Upload,
  Camera,
  ArrowUpDown
} from 'lucide-react';

export const StockScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUTOS' | 'MOVIMENTACOES'>('PRODUTOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  
  // Modais
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string>('');
  const [newAdjustStock, setNewAdjustStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Formulário de Cadastro de Produto e Matriz de Variações
  const settings = DatabaseService.getSettings();
  const suppliers = DatabaseService.getSuppliers();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    barcode: '',
    reference: '',
    category: settings.categories[0] || 'Leggings',
    brand: 'LA FITNESS',
    description: '',
    unit: 'UN',
    costPrice: 0,
    sellingPrice: 0,
    markupPercent: 100,
    minStock: 5,
    supplierId: suppliers[0]?.id || '',
    active: true,
    hasVariations: true,
    variations: []
  });

  const [tempVariations, setTempVariations] = useState<ProductVariation[]>([]);

  const products = DatabaseService.getProducts();
  const stockMovements = DatabaseService.getStockMovements();

  // Filtragem
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm) ||
      p.code.toString().includes(searchTerm) ||
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'TODAS' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: `789${Date.now().toString().slice(-10)}`,
      reference: 'REF-' + Math.floor(100 + Math.random() * 900),
      category: settings.categories[0] || 'Leggings',
      brand: 'LA FITNESS',
      description: '',
      unit: 'UN',
      costPrice: 35.00,
      sellingPrice: 79.90,
      markupPercent: 128.28,
      minStock: 4,
      supplierId: suppliers[0]?.id || '',
      imageUrl: '',
      active: true,
      hasVariations: true,
      variations: []
    });

    // Gera matriz padrão de variações para roupas fitness
    const defaultVars: ProductVariation[] = [
      { id: `var-${Date.now()}-1`, productId: '', sku: 'SKU-PR-P', barcode: '', color: 'Preto', size: 'P', stock: 5, minStock: 2, active: true },
      { id: `var-${Date.now()}-2`, productId: '', sku: 'SKU-PR-M', barcode: '', color: 'Preto', size: 'M', stock: 5, minStock: 2, active: true },
      { id: `var-${Date.now()}-3`, productId: '', sku: 'SKU-PR-G', barcode: '', color: 'Preto', size: 'G', stock: 4, minStock: 2, active: true },
    ];
    setTempVariations(defaultVars);
    setShowProductModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, imageUrl: compressed }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setTempVariations(product.variations ? [...product.variations] : []);
    setShowProductModal(true);
  };

  const handleCostOrMarkupChange = (cost: number, markup: number) => {
    const calculatedPrice = Number((cost * (1 + markup / 100)).toFixed(2));
    setFormData(prev => ({
      ...prev,
      costPrice: cost,
      markupPercent: markup,
      sellingPrice: calculatedPrice
    }));
  };

  const handlePriceChange = (price: number) => {
    const cost = formData.costPrice || 0;
    const markup = cost > 0 ? Number((((price - cost) / cost) * 100).toFixed(2)) : 0;
    setFormData(prev => ({
      ...prev,
      sellingPrice: price,
      markupPercent: markup
    }));
  };

  const handleAddVariationRow = () => {
    const newVar: ProductVariation = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: editingProduct?.id || '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: '',
      color: settings.colors[0] || 'Preto',
      size: settings.sizes[0] || 'M',
      stock: 0,
      minStock: 2,
      active: true
    };
    setTempVariations([...tempVariations, newVar]);
  };

  const handleRemoveVariationRow = (index: number) => {
    setTempVariations(tempVariations.filter((_, i) => i !== index));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Informe o nome do produto.');
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);

    const productToSave: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      code: editingProduct?.code || 0,
      barcode: formData.barcode || `789${Date.now().toString().slice(-10)}`,
      name: formData.name.toUpperCase(),
      reference: formData.reference || '',
      category: formData.category || 'Geral',
      brand: formData.brand || 'LA FITNESS',
      description: formData.description || '',
      unit: formData.unit || 'UN',
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      markupPercent: Number(formData.markupPercent) || 0,
      minStock: Number(formData.minStock) || 0,
      stock: 0, // recalculado pelas variações
      supplierId: supplier?.id,
      supplierName: supplier?.tradeName,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: formData.active !== false,
      hasVariations: tempVariations.length > 0,
      imageUrl: formData.imageUrl || '',
      variations: tempVariations.map(v => ({
        ...v,
        productId: editingProduct?.id || `prod-${Date.now()}`,
        sellingPrice: v.sellingPrice || Number(formData.sellingPrice),
        costPrice: v.costPrice || Number(formData.costPrice)
      }))
    };

    DatabaseService.saveProduct(productToSave);
    setShowProductModal(false);
    alert('Produto salvo com sucesso!');
  };

  const handleDeleteProduct = (id: string) => {
    if (!window.confirm('Deseja excluir ou inativar este produto?')) return;
    const res = DatabaseService.deleteProduct(id);
    alert(res.message);
  };

  // Ajuste Manual de Estoque com Justificativa
  const handleOpenAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setSelectedVariationId(product.variations?.[0]?.id || '');
    setNewAdjustStock(product.variations?.[0]?.stock || product.stock);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleConfirmAdjust = () => {
    if (!adjustingProduct) return;
    if (!adjustReason.trim()) {
      alert('Informe a justificativa do ajuste de estoque.');
      return;
    }

    const res = DatabaseService.adjustStock(
      adjustingProduct.id,
      selectedVariationId || undefined,
      newAdjustStock,
      adjustReason
    );

    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    alert(res.message);
    setShowAdjustModal(false);
    setAdjustingProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Abas e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PRODUTOS')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
              activeTab === 'PRODUTOS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            CONSULTAR PRODUTOS & GRADE
          </button>
          <button
            onClick={() => setActiveTab('MOVIMENTACOES')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
              activeTab === 'MOVIMENTACOES' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            HISTÓRICO DE MOVIMENTAÇÕES
          </button>
        </div>

        {activeTab === 'PRODUTOS' && (
          <button
            onClick={handleOpenNewProduct}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            CADASTRAR PRODUTO
          </button>
        )}
      </div>

      {activeTab === 'PRODUTOS' ? (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por código, código de barras, nome ou referência..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 uppercase"
              >
                <option value="TODAS">TODAS AS CATEGORIAS</option>
                {settings.categories.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-2 w-14 text-center">FOTO</th>
                    <th className="py-3 px-3 w-16 text-center">CÓD.</th>
                    <th className="py-3 px-3">DESCRIÇÃO DO PRODUTO</th>
                    <th className="py-3 px-3">CATEGORIA</th>
                    <th className="py-3 px-3 text-center">GRADE / VARIAÇÕES</th>
                    <th className="py-3 px-3 text-right">CUSTO</th>
                    <th className="py-3 px-3 text-right">PREÇO VENDA</th>
                    <th className="py-3 px-3 text-center">ESTOQUE ATUAL</th>
                    <th className="py-3 px-3 text-center">STATUS</th>
                    <th className="py-3 px-3 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-2 text-center">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-md border border-slate-700 bg-slate-950 mx-auto shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md border border-dashed border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-500 mx-auto">
                              <Camera className="w-4 h-4 text-slate-600" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {p.code}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white uppercase">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {p.reference || '-'} | EAN: {p.barcode || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 uppercase">
                          {p.category}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {p.variations && p.variations.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              {p.variations.map((v) => (
                                <span
                                  key={v.id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                    v.stock > 0
                                      ? 'bg-slate-950 border-slate-700 text-slate-300'
                                      : 'bg-red-950 border-red-800 text-red-400'
                                  }`}
                                  title={`${v.color} - Tam: ${v.size} (Estoque: ${v.stock})`}
                                >
                                  {v.color.slice(0, 2)}/{v.size}: {v.stock}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono">{p.stock} un</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(p.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(p.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              p.stock <= 0
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : isLowStock
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              p.active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {p.active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="Ajustar estoque manual"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                              title="Alterar produto e grade"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-red-950 text-red-400"
                              title="Inativar ou excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Aba de Movimentações */
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
          <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-bold uppercase">
            RASTREABILIDADE COMPLETA DE ENTRADAS, SAÍDAS E AJUSTES DE ESTOQUE
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">DATA & HORA</th>
                  <th className="py-2.5 px-3">PRODUTO</th>
                  <th className="py-2.5 px-3 text-center">GRADE</th>
                  <th className="py-2.5 px-3 text-center">TIPO</th>
                  <th className="py-2.5 px-3 text-center">QUANTIDADE</th>
                  <th className="py-2.5 px-3 text-center">ANTERIOR &gt; NOVO</th>
                  <th className="py-2.5 px-3">JUSTIFICATIVA / DOCUMENTO</th>
                  <th className="py-2.5 px-3">RESPONSÁVEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {formatDateTime(mov.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white uppercase">
                      {mov.productName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {mov.color || mov.size ? `${mov.color} / ${mov.size}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          mov.type.startsWith('ENTRADA') || mov.type.startsWith('DEVOLUCAO_CLIENTE')
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-red-950 text-red-300'
                        }`}
                      >
                        {mov.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-sm">
                      <span className={mov.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {mov.previousStock} &rarr; <span className="font-bold text-white">{mov.newStock}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {mov.reason || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {mov.userName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO E MATRIZ */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? `ALTERAR PRODUTO — CÓD: ${editingProduct.code}` : 'CADASTRAR NOVO PRODUTO FITNESS'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {/* Seção da Foto do Produto */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {formData.imageUrl ? (
                <div className="relative">
                  <img
                    src={formData.imageUrl}
                    alt="Preview do produto"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-500 shadow-md bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow"
                    title="Remover foto"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900 flex flex-col items-center justify-center text-slate-500">
                  <Camera className="w-7 h-7 mb-1 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">SEM FOTO</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                FOTO DO PRODUTO (ARQUIVO OU LINK)
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-bold uppercase cursor-pointer transition-colors shrink-0">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Escolher Foto do Computador</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Ou cole o link direto da imagem (https://...)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">
                NOME DO PRODUTO (DESCRIÇÃO COMERCIAL)
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: LEGGING SUPLEX ALTA COMPRESSÃO"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-semibold uppercase focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">
                CÓDIGO DE BARRAS PRINCIPAL (EAN)
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">CATEGORIA</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold uppercase"
              >
                {settings.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">REFERÊNCIA</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">MARCA</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300">FORNECEDOR</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs uppercase font-bold"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.tradeName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Formação de Preço */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400">CUSTO DE COMPRA (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => handleCostOrMarkupChange(parseFloat(e.target.value) || 0, formData.markupPercent || 0)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400">MARGEM ESTIMADA (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.markupPercent}
                onChange={(e) => handleCostOrMarkupChange(formData.costPrice || 0, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-emerald-400">PREÇO DE VENDA (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-emerald-600 rounded text-emerald-400 font-mono font-bold text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400">ESTOQUE MÍNIMO</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-sm"
              />
            </div>
          </div>

          {/* MATRIZ DE VARIAÇÕES (TAMANHOS E CORES) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  MATRIZ DE VARIAÇÕES (CORES & TAMANHOS)
                </span>
                <p className="text-[11px] text-slate-400">
                  Cadastre vários tamanhos e cores sem recadastrar o mesmo produto.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariationRow}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs font-bold uppercase border border-slate-700"
              >
                + Adicionar Variação
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="py-2 px-2.5">COR</th>
                    <th className="py-2 px-2.5">TAMANHO</th>
                    <th className="py-2 px-2.5">SKU / REF</th>
                    <th className="py-2 px-2.5 text-center">ESTOQUE SALDO</th>
                    <th className="py-2 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tempVariations.map((v, idx) => (
                    <tr key={idx} className="bg-slate-900">
                      <td className="py-1.5 px-2.5">
                        <select
                          value={v.color}
                          onChange={(e) => {
                            const updated = [...tempVariations];
                            updated[idx].color = e.target.value;
                            setTempVariations(updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        >
                          {settings.colors.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <select
                          value={v.size}
                          onChange={(e) => {
                            const updated = [...tempVariations];
                            updated[idx].size = e.target.value;
                            setTempVariations(updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono font-bold"
                        >
                          {settings.sizes.map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...tempVariations];
                            updated[idx].sku = e.target.value;
                            setTempVariations(updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => {
                            const updated = [...tempVariations];
                            updated[idx].stock = parseInt(e.target.value) || 0;
                            setTempVariations(updated);
                          }}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono font-bold text-emerald-400"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariationRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow"
            >
              Salvar Produto
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE AJUSTE MANUAL DE ESTOQUE */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={`AJUSTE DE ESTOQUE — ${adjustingProduct?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {adjustingProduct?.variations && adjustingProduct.variations.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                SELECIONE A VARIAÇÃO
              </label>
              <select
                value={selectedVariationId}
                onChange={(e) => {
                  setSelectedVariationId(e.target.value);
                  const v = adjustingProduct.variations.find(v => v.id === e.target.value);
                  if (v) setNewAdjustStock(v.stock);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-bold"
              >
                {adjustingProduct.variations.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.color} / TAM: {v.size} (Saldo Atual: {v.stock})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              NOVA QUANTIDADE TOTAL EM ESTOQUE
            </label>
            <input
              type="number"
              value={newAdjustStock}
              onChange={(e) => setNewAdjustStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              JUSTIFICATIVA DO AJUSTE (OBRIGATÓRIO)
            </label>
            <textarea
              required
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Ex: Quebra, avaria, amostra ou contagem física de prateleira..."
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAdjust}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase"
            >
              Confirmar Ajuste
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
