import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useAuthInit } from './hooks/useAuthInit'
import AppLayout from './components/Layout'
import PermissionRoute from './components/PermissionRoute'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))
const UserManagement = lazy(() => import('./pages/System/UserManagement'))
const RoleManagement = lazy(() => import('./pages/System/RoleManagement'))
const SystemConfigPage = lazy(() => import('./pages/System/SystemConfig'))
const IntegrationCenter = lazy(() => import('./pages/System/IntegrationCenter'))
const AuditLogManagement = lazy(() => import('./pages/System/AuditLogManagement'))
const TenantManagement = lazy(() => import('./pages/System/TenantManagement'))
const BudgetManagement = lazy(() => import('./pages/Finance/BudgetManagement'))
const BiScreen = lazy(() => import('./pages/BiScreen'))
const FileCenter = lazy(() => import('./pages/System/FileCenter'))
const InventoryTrace = lazy(() => import('./pages/Inventory/InventoryTrace'))
const GeneralLedger = lazy(() => import('./pages/Finance/GeneralLedger'))
const ReceivableManagement = lazy(() => import('./pages/Finance/ReceivableManagement'))
const PayableManagement = lazy(() => import('./pages/Finance/PayableManagement'))
const FixedAssetManagement = lazy(() => import('./pages/Finance/FixedAssetManagement'))
const FinancialReport = lazy(() => import('./pages/Finance/FinancialReport'))
const PurchaseRequestManagement = lazy(() => import('./pages/Procurement/PurchaseRequestManagement'))
const PurchaseOrderManagement = lazy(() => import('./pages/Procurement/PurchaseOrderManagement'))
const SalesQuoteManagement = lazy(() => import('./pages/Sales/SalesQuoteManagement'))
const SalesOrderManagement = lazy(() => import('./pages/Sales/SalesOrderManagement'))
const ServiceTicketManagement = lazy(() => import('./pages/Sales/ServiceTicketManagement'))
const VendorManagement = lazy(() => import('./pages/MasterData/VendorManagement'))
const CustomerManagement = lazy(() => import('./pages/MasterData/CustomerManagement'))
const ProductManagement = lazy(() => import('./pages/MasterData/ProductManagement'))
const WarehouseManagement = lazy(() => import('./pages/MasterData/WarehouseManagement'))
const DepartmentManagement = lazy(() => import('./pages/MasterData/DepartmentManagement'))
const StockLedger = lazy(() => import('./pages/Inventory/StockLedger'))
const StockInOut = lazy(() => import('./pages/Inventory/StockInOut'))
const StockAlert = lazy(() => import('./pages/Inventory/StockAlert'))
const StocktakeManagement = lazy(() => import('./pages/Inventory/StocktakeManagement'))
const StockTransfer = lazy(() => import('./pages/Inventory/StockTransfer'))
const BomManagement = lazy(() => import('./pages/Production/BomManagement'))
const ProductionPlanManagement = lazy(() => import('./pages/Production/ProductionPlanManagement'))
const WorkOrderManagement = lazy(() => import('./pages/Production/WorkOrderManagement'))
const QualityManagement = lazy(() => import('./pages/Production/QualityManagement'))
const EmployeeManagement = lazy(() => import('./pages/HR/EmployeeManagement'))
const PositionManagement = lazy(() => import('./pages/HR/PositionManagement'))
const AttendanceManagement = lazy(() => import('./pages/HR/AttendanceManagement'))
const SalaryManagement = lazy(() => import('./pages/HR/SalaryManagement'))
const PerformanceManagement = lazy(() => import('./pages/HR/PerformanceManagement'))
const ProjectManagement = lazy(() => import('./pages/Project/ProjectManagement'))
const ReportCenter = lazy(() => import('./pages/Report/ReportCenter'))
const IntelligenceCenter = lazy(() => import('./pages/Report/IntelligenceCenter'))

function PageLoader() {
  return <Spin size="large" className="flex justify-center items-center h-64" />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />
}

function withLayout(page: React.ReactNode) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <PermissionRoute>
          <Suspense fallback={<PageLoader />}>{page}</Suspense>
        </PermissionRoute>
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  const loading = useAuthInit()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (loading && isAuthenticated) {
    return <Spin size="large" className="flex justify-center items-center h-screen" />
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={withLayout(<Dashboard />)} />
        <Route path="/dashboard" element={withLayout(<Dashboard />)} />
        <Route path="/bi-screen" element={<ProtectedRoute><BiScreen /></ProtectedRoute>} />
        <Route path="/system/user" element={withLayout(<UserManagement />)} />
        <Route path="/system/role" element={withLayout(<RoleManagement />)} />
        <Route path="/system/config" element={withLayout(<SystemConfigPage />)} />
        <Route path="/system/integration" element={withLayout(<IntegrationCenter />)} />
        <Route path="/system/audit" element={withLayout(<AuditLogManagement />)} />
        <Route path="/system/tenant" element={withLayout(<TenantManagement />)} />
        <Route path="/system/files" element={withLayout(<FileCenter />)} />
        <Route path="/finance/gl" element={withLayout(<GeneralLedger />)} />
        <Route path="/finance/ar" element={withLayout(<ReceivableManagement />)} />
        <Route path="/finance/ap" element={withLayout(<PayableManagement />)} />
        <Route path="/finance/assets" element={withLayout(<FixedAssetManagement />)} />
        <Route path="/finance/report" element={withLayout(<FinancialReport />)} />
        <Route path="/finance/budget" element={withLayout(<BudgetManagement />)} />
        <Route path="/procurement/vendor" element={withLayout(<VendorManagement />)} />
        <Route path="/procurement/request" element={withLayout(<PurchaseRequestManagement />)} />
        <Route path="/procurement/order" element={withLayout(<PurchaseOrderManagement />)} />
        <Route path="/procurement/receive" element={withLayout(<PurchaseOrderManagement />)} />
        <Route path="/sales/customer" element={withLayout(<CustomerManagement />)} />
        <Route path="/sales/quote" element={withLayout(<SalesQuoteManagement />)} />
        <Route path="/sales/order" element={withLayout(<SalesOrderManagement />)} />
        <Route path="/sales/delivery" element={withLayout(<SalesOrderManagement />)} />
        <Route path="/sales/service" element={withLayout(<ServiceTicketManagement />)} />
        <Route path="/production/bom" element={withLayout(<BomManagement />)} />
        <Route path="/production/plan" element={withLayout(<ProductionPlanManagement />)} />
        <Route path="/production/work-order" element={withLayout(<WorkOrderManagement />)} />
        <Route path="/production/quality" element={withLayout(<QualityManagement />)} />
        <Route path="/inventory/stock" element={withLayout(<StockLedger />)} />
        <Route path="/inventory/inout" element={withLayout(<StockInOut />)} />
        <Route path="/inventory/alert" element={withLayout(<StockAlert />)} />
        <Route path="/inventory/stocktake" element={withLayout(<StocktakeManagement />)} />
        <Route path="/inventory/transfer" element={withLayout(<StockTransfer />)} />
        <Route path="/inventory/trace" element={withLayout(<InventoryTrace />)} />
        <Route path="/inventory/product" element={withLayout(<ProductManagement />)} />
        <Route path="/inventory/warehouse" element={withLayout(<WarehouseManagement />)} />
        <Route path="/hr/employee" element={withLayout(<EmployeeManagement />)} />
        <Route path="/hr/department" element={withLayout(<DepartmentManagement />)} />
        <Route path="/hr/position" element={withLayout(<PositionManagement />)} />
        <Route path="/hr/attendance" element={withLayout(<AttendanceManagement />)} />
        <Route path="/hr/salary" element={withLayout(<SalaryManagement />)} />
        <Route path="/hr/performance" element={withLayout(<PerformanceManagement />)} />
        <Route path="/project" element={withLayout(<ProjectManagement />)} />
        <Route path="/report" element={withLayout(<ReportCenter />)} />
        <Route path="/report/intelligence" element={withLayout(<IntelligenceCenter />)} />
        <Route path="*" element={withLayout(<NotFound />)} />
      </Routes>
    </Suspense>
  )
}
