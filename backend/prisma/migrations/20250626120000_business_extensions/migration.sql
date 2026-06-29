-- AlterTable
ALTER TABLE "products" ADD COLUMN "safety_stock" DECIMAL(18,4) DEFAULT 0;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN "purchase_request_id" TEXT;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN "sales_quote_id" TEXT;

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "request_no" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200),
    "reason" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "estimated_price" DECIMAL(18,2),

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotes" (
    "id" TEXT NOT NULL,
    "quote_no" VARCHAR(50) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quote_items" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "sales_quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_receivables" (
    "id" TEXT NOT NULL,
    "bill_no" VARCHAR(50) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "sales_order_id" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "received_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_payables" (
    "id" TEXT NOT NULL,
    "bill_no" VARCHAR(50) NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "paid_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_payables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_purchase_request_id_key" ON "purchase_orders"("purchase_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_sales_quote_id_key" ON "sales_orders"("sales_quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_request_no_key" ON "purchase_requests"("request_no");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotes_quote_no_key" ON "sales_quotes"("quote_no");

-- CreateIndex
CREATE UNIQUE INDEX "account_receivables_bill_no_key" ON "account_receivables"("bill_no");

-- CreateIndex
CREATE UNIQUE INDEX "account_payables_bill_no_key" ON "account_payables"("bill_no");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sales_quote_id_fkey" FOREIGN KEY ("sales_quote_id") REFERENCES "sales_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quote_items" ADD CONSTRAINT "sales_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "sales_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quote_items" ADD CONSTRAINT "sales_quote_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_receivables" ADD CONSTRAINT "account_receivables_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_receivables" ADD CONSTRAINT "account_receivables_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_payables" ADD CONSTRAINT "account_payables_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_payables" ADD CONSTRAINT "account_payables_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
