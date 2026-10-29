-- ==============================================================================
-- SISTEMA PDV FITNESS PROFISSIONAL — ESQUEMA COMPLETO SUPABASE POSTGRESQL
-- Tabelas, Relacionamentos, Integridade, Triggers, RLS e Funções RPC Transacionais
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE USUÁRIOS E PERMISSÕES (Integrada ao Supabase Auth se configurado)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMINISTRADOR', 'GERENTE', 'OPERADOR')),
    active BOOLEAN DEFAULT TRUE,
    max_discount_percent NUMERIC(5,2) DEFAULT 10.00,
    can_cancel_sales BOOLEAN DEFAULT FALSE,
    can_adjust_stock BOOLEAN DEFAULT FALSE,
    can_restore_backup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'LA FITNESS MODA ESPORTIVA',
    trading_name TEXT DEFAULT 'LA FITNESS',
    cnpj TEXT DEFAULT '00.000.000/0001-00',
    ie TEXT DEFAULT 'ISENTO',
    phone TEXT DEFAULT '(11) 98765-4321',
    email TEXT DEFAULT 'contato@lafitness.com.br',
    address TEXT DEFAULT 'Av. Paulista, 1000 - Loja 42',
    city TEXT DEFAULT 'São Paulo',
    state TEXT DEFAULT 'SP',
    zip_code TEXT DEFAULT '01310-100',
    receipt_footer_message TEXT DEFAULT 'Obrigado pela preferência! Trocas em até 30 dias com etiqueta.',
    printer_type TEXT DEFAULT '80mm' CHECK (printer_type IN ('80mm', '58mm', 'A4')),
    default_markup_percent NUMERIC(5,2) DEFAULT 100.00,
    max_discount_without_approval NUMERIC(5,2) DEFAULT 5.00,
    enable_blind_inventory BOOLEAN DEFAULT FALSE,
    categories JSONB DEFAULT '["Leggings", "Tops", "Shorts", "Regatas", "Conjuntos", "Macacões", "Acessórios"]'::jsonb,
    sizes JSONB DEFAULT '["PP", "P", "M", "G", "GG", "U"]'::jsonb,
    colors JSONB DEFAULT '["Preto", "Mescla", "Rosa Neon", "Azul Royal", "Vinho", "Branco", "Verde Militar"]'::jsonb,
    expense_categories JSONB DEFAULT '["Aluguel", "Energia Elétrica", "Água", "Internet / Telefone", "Salários / Comissões", "Fornecedores", "Marketing", "Embalagens", "Manutenção"]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FORNECEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code SERIAL UNIQUE,
    corporate_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    payment_terms TEXT DEFAULT '30 dias',
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CLIENTES
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code SERIAL UNIQUE,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 1000.00,
    credit_used NUMERIC(12,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PRODUTOS E MATRIZ DE VARIAÇÕES (Tamanho / Cor / Saldo independente)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code SERIAL UNIQUE,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    reference TEXT,
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'LA FITNESS',
    description TEXT,
    unit TEXT DEFAULT 'UN',
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    markup_percent NUMERIC(6,2) DEFAULT 100.00,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    has_variations BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 2,
    cost_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_product_color_size UNIQUE(product_id, color, size)
);

-- 7. HISTÓRICO DE MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variation_id UUID REFERENCES product_variations(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('ENTRADA_COMPRA', 'SAIDA_VENDA', 'AJUSTE_MANUAL', 'AJUSTE_INVENTARIO', 'DEVOLUCAO_CLIENTE', 'DEVOLUCAO_FORNECEDOR')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    document_number TEXT,
    user_id UUID REFERENCES app_users(id),
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SESSÕES DE CAIXA E MOVIMENTAÇÕES DO CAIXA
CREATE TABLE IF NOT EXISTS register_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number INTEGER NOT NULL DEFAULT 1,
    operator_id UUID NOT NULL REFERENCES app_users(id),
    operator_name TEXT NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'FECHADO')),
    initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cash_sales NUMERIC(12,2) DEFAULT 0.00,
    total_pix_sales NUMERIC(12,2) DEFAULT 0.00,
    total_debit_sales NUMERIC(12,2) DEFAULT 0.00,
    total_credit_sales NUMERIC(12,2) DEFAULT 0.00,
    total_duplicata_sales NUMERIC(12,2) DEFAULT 0.00,
    total_cash_inflows NUMERIC(12,2) DEFAULT 0.00,
    total_cash_outflows NUMERIC(12,2) DEFAULT 0.00,
    expected_cash NUMERIC(12,2) DEFAULT 0.00,
    counted_cash NUMERIC(12,2),
    cash_difference NUMERIC(12,2),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS register_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_session_id UUID NOT NULL REFERENCES register_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('SUPRIMENTO', 'SANGRIA', 'DESPESA', 'RECEBIMENTO_DUPLICATA', 'VENDA')),
    amount NUMERIC(12,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'A_PRAZO', 'DUPLICATA')),
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES app_users(id),
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. VENDAS, ITENS E PAGAMENTOS
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number SERIAL UNIQUE,
    register_session_id UUID NOT NULL REFERENCES register_sessions(id),
    operator_id UUID NOT NULL REFERENCES app_users(id),
    operator_name TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT DEFAULT 'CONSUMIDOR FINAL',
    customer_doc TEXT,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'CONCLUIDA' CHECK (status IN ('CONCLUIDA', 'CANCELADA', 'SUSPENSA')),
    notes TEXT,
    cancel_reason TEXT,
    canceled_by TEXT,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variation_id UUID REFERENCES product_variations(id),
    product_name TEXT NOT NULL,
    color TEXT,
    size TEXT,
    barcode TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    total_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'A_PRAZO', 'DUPLICATA')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    card_brand TEXT,
    installments INTEGER DEFAULT 1,
    received_amount NUMERIC(12,2),
    change_amount NUMERIC(12,2) DEFAULT 0.00
);

-- 10. DUPLICATAS E CONTAS A RECEBER
CREATE TABLE IF NOT EXISTS duplicatas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number TEXT UNIQUE NOT NULL,
    sale_id UUID NOT NULL REFERENCES sales(id),
    sale_number INTEGER NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_doc TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12,2) NOT NULL,
    installments_count INTEGER NOT NULL DEFAULT 1,
    installments JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'PARCIAL', 'PAGA', 'VENCIDA', 'CANCELADA')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. DESPESAS E CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_from_register BOOLEAN DEFAULT FALSE,
    register_session_id UUID REFERENCES register_sessions(id),
    payment_method TEXT CHECK (payment_method IN ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'A_PRAZO', 'DUPLICATA')),
    is_paid BOOLEAN DEFAULT TRUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    responsible_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bills_to_pay (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number TEXT NOT NULL,
    description TEXT NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    balance NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PARCIAL', 'PAGA', 'VENCIDA', 'CANCELADA')),
    notes TEXT,
    category TEXT DEFAULT 'Fornecedores',
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. COMPRAS E NOTAS DE ENTRADA
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number SERIAL UNIQUE,
    invoice_number TEXT NOT NULL,
    access_key TEXT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    issue_date DATE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    freight_amount NUMERIC(12,2) DEFAULT 0.00,
    other_expenses NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_terms TEXT DEFAULT '30 dias',
    installments_count INTEGER DEFAULT 1,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'CONFIRMADA' CHECK (status IN ('CONFIRMADA', 'CANCELADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. INVENTÁRIO DE ESTOQUE
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_number SERIAL UNIQUE,
    title TEXT NOT NULL,
    filter_category TEXT,
    is_blind_count BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    responsible_name TEXT NOT NULL,
    total_items INTEGER DEFAULT 0,
    items_with_divergence INTEGER DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT
);

-- 14. LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT
);

-- 15. BACKUPS AUTOMÁTICOS EM NUVEM
CREATE TABLE IF NOT EXISTS system_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('FECHAMENTO_CAIXA', 'NUVEM_DIARIO', 'MANUAL')),
    filename TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    operator_name TEXT NOT NULL,
    data_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'SINCRONIZADO_NUVEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- FUNÇÕES RPC TRANSACIONAIS CRÍTICAS (Garantem integridade no servidor)
-- ==============================================================================

-- Trigger para recalcular estoque consolidado do produto após mudança em variações
CREATE OR REPLACE FUNCTION trg_update_consolidated_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = COALESCE((
        SELECT SUM(stock) FROM product_variations WHERE product_id = NEW.product_id AND active = true
    ), 0),
    updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_stock ON product_variations;
CREATE TRIGGER trg_recalc_stock
AFTER INSERT OR UPDATE OF stock, active ON product_variations
FOR EACH ROW EXECUTE FUNCTION trg_update_consolidated_product_stock();
