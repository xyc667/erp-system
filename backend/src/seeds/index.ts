import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissions = [
  { name: '用户管理', code: 'user:manage', module: 'system' },
  { name: '用户查看', code: 'user:view', module: 'system' },
  { name: '用户创建', code: 'user:create', module: 'system' },
  { name: '用户编辑', code: 'user:update', module: 'system' },
  { name: '用户删除', code: 'user:delete', module: 'system' },
  { name: '角色管理', code: 'role:manage', module: 'system' },
  { name: '权限管理', code: 'permission:manage', module: 'system' },
  { name: '系统配置', code: 'system:config', module: 'system' },
  { name: '审计日志', code: 'system:audit', module: 'system' },
  { name: '租户管理', code: 'system:tenant', module: 'system' },
  { name: '文件管理', code: 'file:manage', module: 'system' },
  { name: '财务总账', code: 'finance:gl', module: 'finance' },
  { name: '应收管理', code: 'finance:ar', module: 'finance' },
  { name: '应付管理', code: 'finance:ap', module: 'finance' },
  { name: '固定资产', code: 'finance:asset', module: 'finance' },
  { name: '财务报表', code: 'finance:report', module: 'finance' },
  { name: '预算管理', code: 'finance:budget', module: 'finance' },
  { name: '供应商管理', code: 'procurement:vendor', module: 'procurement' },
  { name: '采购申请', code: 'procurement:request', module: 'procurement' },
  { name: '采购订单', code: 'procurement:order', module: 'procurement' },
  { name: '收货验收', code: 'procurement:receive', module: 'procurement' },
  { name: '客户管理', code: 'sales:customer', module: 'sales' },
  { name: '销售报价', code: 'sales:quote', module: 'sales' },
  { name: '销售订单', code: 'sales:order', module: 'sales' },
  { name: '发货管理', code: 'sales:delivery', module: 'sales' },
  { name: '售后服务', code: 'sales:service', module: 'sales' },
  { name: 'BOM管理', code: 'production:bom', module: 'production' },
  { name: '生产计划', code: 'production:plan', module: 'production' },
  { name: '工单管理', code: 'production:workorder', module: 'production' },
  { name: '质量管理', code: 'production:quality', module: 'production' },
  { name: '库存台账', code: 'inventory:stock', module: 'inventory' },
  { name: '出入库管理', code: 'inventory:inout', module: 'inventory' },
  { name: '库存预警', code: 'inventory:alert', module: 'inventory' },
  { name: '批次追溯', code: 'inventory:trace', module: 'inventory' },
  { name: '员工管理', code: 'hr:employee', module: 'hr' },
  { name: '考勤管理', code: 'hr:attendance', module: 'hr' },
  { name: '薪资管理', code: 'hr:salary', module: 'hr' },
  { name: '绩效管理', code: 'hr:performance', module: 'hr' },
  { name: '项目管理', code: 'project:manage', module: 'project' },
  { name: '报表中心', code: 'report:center', module: 'report' },
  { name: '系统集成', code: 'integration:sync', module: 'integration' },
];

/** 预置角色权限模板（与 PRD 岗位划分一致） */
const roleTemplates: Array<{
  name: string;
  description: string;
  permissions: string[] | 'all';
  demoUser?: { username: string; name: string; email: string };
}> = [
  {
    name: '系统管理员',
    description: '拥有系统所有权限',
    permissions: 'all',
    demoUser: { username: 'admin', name: '系统管理员', email: 'admin@erp.com' },
  },
  {
    name: '财务总监',
    description: '财务全盘管理、预算与报表',
    permissions: [
      'finance:gl', 'finance:ar', 'finance:ap', 'finance:asset',
      'finance:report', 'finance:budget', 'report:center',
    ],
    demoUser: { username: 'finance_director', name: '张财务', email: 'finance.director@erp.com' },
  },
  {
    name: '财务专员',
    description: '日常记账、应收应付、固定资产',
    permissions: [
      'finance:gl', 'finance:ar', 'finance:ap', 'finance:asset', 'report:center',
    ],
    demoUser: { username: 'finance_clerk', name: '李会计', email: 'finance.clerk@erp.com' },
  },
  {
    name: '采购总监',
    description: '供应商与采购策略、采购全流程',
    permissions: [
      'procurement:vendor', 'procurement:request', 'procurement:order', 'procurement:receive',
      'finance:ap', 'inventory:alert', 'report:center',
    ],
    demoUser: { username: 'procurement_director', name: '王采购', email: 'procurement.director@erp.com' },
  },
  {
    name: '采购专员',
    description: '采购申请、订单与收货验收',
    permissions: [
      'procurement:vendor', 'procurement:request', 'procurement:order', 'procurement:receive',
    ],
    demoUser: { username: 'procurement_clerk', name: '赵采购', email: 'procurement.clerk@erp.com' },
  },
  {
    name: '销售总监',
    description: '客户与销售全盘、应收 oversight',
    permissions: [
      'sales:customer', 'sales:quote', 'sales:order', 'sales:delivery', 'sales:service',
      'finance:ar', 'report:center',
    ],
    demoUser: { username: 'sales_director', name: '刘销售', email: 'sales.director@erp.com' },
  },
  {
    name: '销售专员',
    description: '报价、订单、发货与售后',
    permissions: [
      'sales:customer', 'sales:quote', 'sales:order', 'sales:delivery', 'sales:service',
    ],
    demoUser: { username: 'sales_clerk', name: '陈销售', email: 'sales.clerk@erp.com' },
  },
  {
    name: '生产经理',
    description: 'BOM、计划、工单、质量与物料协调',
    permissions: [
      'production:bom', 'production:plan', 'production:workorder', 'production:quality',
      'inventory:stock', 'inventory:inout', 'inventory:alert', 'report:center',
    ],
    demoUser: { username: 'production_manager', name: '周生产', email: 'production.manager@erp.com' },
  },
  {
    name: '生产专员',
    description: '工单执行、质检与生产计划跟进',
    permissions: [
      'production:plan', 'production:workorder', 'production:quality', 'inventory:stock',
    ],
    demoUser: { username: 'production_clerk', name: '吴生产', email: 'production.clerk@erp.com' },
  },
  {
    name: '仓库管理员',
    description: '库存台账、出入库、预警与批次追溯',
    permissions: [
      'inventory:stock', 'inventory:inout', 'inventory:alert', 'inventory:trace',
      'procurement:receive',
    ],
    demoUser: { username: 'warehouse_admin', name: '郑仓管', email: 'warehouse@erp.com' },
  },
  {
    name: '人事专员',
    description: '员工、考勤、薪资与绩效',
    permissions: [
      'hr:employee', 'hr:attendance', 'hr:salary', 'hr:performance', 'user:view',
    ],
    demoUser: { username: 'hr_clerk', name: '孙人事', email: 'hr@erp.com' },
  },
  {
    name: '普通员工',
    description: '提交采购申请、查看库存与报表',
    permissions: ['procurement:request', 'inventory:stock', 'inventory:alert', 'report:center'],
    demoUser: { username: 'employee', name: '普通员工', email: 'employee@erp.com' },
  },
];

async function syncRolePermissions(roleId: string, codes: string[]) {
  const matched = await prisma.permission.findMany({ where: { code: { in: codes } } });
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  if (matched.length === 0) return;
  await prisma.rolePermission.createMany({
    data: matched.map((p) => ({ roleId, permissionId: p.id })),
    skipDuplicates: true,
  });
}

/** BI 大屏演示：销售/采购订单、库存 */
async function seedBiDemoData(
  adminUserId: string,
  customerId: string,
  vendorId: string,
  productId: string,
  warehouseId: string,
  fgProductId?: string,
) {
  const salesDemos: Array<{
    orderNo: string;
    month: string;
    day: number;
    totalAmount: number;
    status: string;
  }> = [
    { orderNo: 'SO-BI-001', month: '2026-01', day: 8, totalAmount: 85000, status: 'completed' },
    { orderNo: 'SO-BI-002', month: '2026-01', day: 22, totalAmount: 45000, status: 'approved' },
    { orderNo: 'SO-BI-003', month: '2026-02', day: 5, totalAmount: 92000, status: 'completed' },
    { orderNo: 'SO-BI-004', month: '2026-03', day: 12, totalAmount: 78000, status: 'completed' },
    { orderNo: 'SO-BI-005', month: '2026-03', day: 28, totalAmount: 56000, status: 'approved' },
    { orderNo: 'SO-BI-006', month: '2026-04', day: 10, totalAmount: 105000, status: 'completed' },
    { orderNo: 'SO-BI-007', month: '2026-05', day: 6, totalAmount: 118000, status: 'completed' },
    { orderNo: 'SO-BI-008', month: '2026-05', day: 20, totalAmount: 42000, status: 'draft' },
    { orderNo: 'SO-BI-009', month: '2026-06', day: 3, totalAmount: 96000, status: 'completed' },
    { orderNo: 'SO-BI-010', month: '2026-06', day: 18, totalAmount: 34000, status: 'approved' },
    { orderNo: 'SO-BI-011', month: '2026-06', day: 24, totalAmount: 28000, status: 'draft' },
    { orderNo: 'SO-BI-012', month: '2026-04', day: 25, totalAmount: 15000, status: 'cancelled' },
  ];

  for (const demo of salesDemos) {
    const createdAt = new Date(`${demo.month}-${String(demo.day).padStart(2, '0')}T10:00:00+08:00`);
    const qty = 10;
    const unitPrice = demo.totalAmount / qty;
    const existing = await prisma.salesOrder.findUnique({ where: { orderNo: demo.orderNo } });
    if (existing) {
      await prisma.salesOrder.update({
        where: { orderNo: demo.orderNo },
        data: { totalAmount: demo.totalAmount, status: demo.status, createdAt },
      });
      continue;
    }
    await prisma.salesOrder.create({
      data: {
        orderNo: demo.orderNo,
        customerId,
        createdById: adminUserId,
        totalAmount: demo.totalAmount,
        status: demo.status,
        createdAt,
        items: {
          create: {
            productId,
            quantity: qty,
            unitPrice,
            amount: demo.totalAmount,
          },
        },
      },
    });
  }

  const purchaseDemos: Array<{
    orderNo: string;
    totalAmount: number;
    status: string;
    month: string;
    day: number;
  }> = [
    { orderNo: 'PO-BI-001', totalAmount: 35000, status: 'completed', month: '2026-01', day: 15 },
    { orderNo: 'PO-BI-002', totalAmount: 48000, status: 'approved', month: '2026-02', day: 8 },
    { orderNo: 'PO-BI-003', totalAmount: 62000, status: 'completed', month: '2026-03', day: 20 },
    { orderNo: 'PO-BI-004', totalAmount: 41000, status: 'completed', month: '2026-04', day: 5 },
    { orderNo: 'PO-BI-005', totalAmount: 55000, status: 'approved', month: '2026-05', day: 14 },
    { orderNo: 'PO-BI-006', totalAmount: 29000, status: 'draft', month: '2026-06', day: 2 },
    { orderNo: 'PO-BI-007', totalAmount: 72000, status: 'completed', month: '2026-06', day: 10 },
    { orderNo: 'PO-BI-008', totalAmount: 38000, status: 'completed', month: '2026-06', day: 22 },
  ];

  for (const demo of purchaseDemos) {
    const createdAt = new Date(`${demo.month}-${String(demo.day).padStart(2, '0')}T14:00:00+08:00`);
    const qty = 20;
    const unitPrice = demo.totalAmount / qty;
    const existing = await prisma.purchaseOrder.findUnique({ where: { orderNo: demo.orderNo } });
    if (existing) {
      await prisma.purchaseOrder.update({
        where: { orderNo: demo.orderNo },
        data: { totalAmount: demo.totalAmount, status: demo.status, createdAt },
      });
      continue;
    }
    await prisma.purchaseOrder.create({
      data: {
        orderNo: demo.orderNo,
        vendorId,
        createdById: adminUserId,
        totalAmount: demo.totalAmount,
        status: demo.status,
        createdAt,
        items: {
          create: {
            productId,
            quantity: qty,
            unitPrice,
            amount: demo.totalAmount,
          },
        },
      },
    });
  }

  const rawInv = await prisma.inventory.findFirst({
    where: { productId, warehouseId, batchNo: null },
  });
  if (rawInv) {
    await prisma.inventory.update({
      where: { id: rawInv.id },
      data: { quantity: 1850 },
    });
  } else {
    await prisma.inventory.create({
      data: { productId, warehouseId, quantity: 1850, unit: '件' },
    });
  }

  if (fgProductId) {
    const fgInv = await prisma.inventory.findFirst({
      where: { productId: fgProductId, warehouseId, batchNo: null },
    });
    if (fgInv) {
      await prisma.inventory.update({ where: { id: fgInv.id }, data: { quantity: 730 } });
    } else {
      await prisma.inventory.create({
        data: { productId: fgProductId, warehouseId, quantity: 730, unit: '件' },
      });
    }
  }
}

async function clearReportCache() {
  const url = process.env.REDIS_URL;
  if (!url) return;
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(url);
    await redis.del('report:overview', 'report:finance');
    await redis.quit();
  } catch {
    // Redis optional during seed
  }
}

async function main() {
  const DEFAULT_TENANT_ID = 'a0000000-0000-4000-8000-000000000001';

  const defaultTenant = await prisma.tenant.upsert({
    where: { code: 'default' },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      code: 'default',
      name: '默认租户',
      schemaName: 'public',
    },
  });

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const allPermissionCodes = allPermissions.map((p) => p.code);
  const adminPlain = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-admin';
  const demoPlain = process.env.SEED_DEMO_PASSWORD ?? 'change-me-demo';
  const demoPassword = await bcrypt.hash(demoPlain, 12);
  const adminPassword = await bcrypt.hash(adminPlain, 12);

  for (const template of roleTemplates) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: defaultTenant.id, name: template.name } },
      update: { description: template.description },
      create: {
        tenantId: defaultTenant.id,
        name: template.name,
        description: template.description,
      },
    });

    const codes =
      template.permissions === 'all' ? allPermissionCodes : template.permissions;
    await syncRolePermissions(role.id, codes);

    if (template.demoUser) {
      const password =
        template.demoUser.username === 'admin' ? adminPassword : demoPassword;
      await prisma.user.upsert({
        where: {
          tenantId_username: {
            tenantId: defaultTenant.id,
            username: template.demoUser.username,
          },
        },
        update: { roleId: role.id, name: template.demoUser.name },
        create: {
          tenantId: defaultTenant.id,
          username: template.demoUser.username,
          password,
          name: template.demoUser.name,
          email: template.demoUser.email,
          roleId: role.id,
        },
      });
    }
  }

  const category = await prisma.productCategory.upsert({
    where: { code: 'RAW' },
    update: {},
    create: { code: 'RAW', name: '原材料' },
  });

  const fgCategory = await prisma.productCategory.upsert({
    where: { code: 'FG' },
    update: {},
    create: { code: 'FG', name: '成品' },
  });

  await prisma.product.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: 'P001' } },
    update: { safetyStock: 50 },
    create: {
      tenantId: defaultTenant.id,
      code: 'P001',
      name: '示例产品A',
      categoryId: category.id,
      unit: '件',
      price: 100,
      safetyStock: 50,
      trackSerial: true,
    },
  });

  await prisma.product.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: 'FG001' } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      code: 'FG001',
      name: '成品组件X',
      categoryId: fgCategory.id,
      unit: '件',
      price: 500,
    },
  });

  const rawProduct = await prisma.product.findFirst({
    where: { tenantId: defaultTenant.id, code: 'P001' },
  });
  const fgProduct = await prisma.product.findFirst({
    where: { tenantId: defaultTenant.id, code: 'FG001' },
  });
  if (rawProduct && fgProduct) {
    const bom = await prisma.bom.upsert({
      where: { code: 'BOM-FG001' },
      update: {},
      create: {
        code: 'BOM-FG001',
        name: '成品组件X BOM',
        productId: fgProduct.id,
        version: '1.0',
        description: '每件成品需要2个原材料A',
      },
    });
    const existingItem = await prisma.bomItem.findFirst({
      where: { bomId: bom.id, componentId: rawProduct.id },
    });
    if (!existingItem) {
      await prisma.bomItem.create({
        data: {
          bomId: bom.id,
          componentId: rawProduct.id,
          quantity: 2,
          unit: '件',
        },
      });
    }
  }

  await prisma.vendor.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: 'V001' } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      code: 'V001',
      name: '示例供应商',
      contactName: '张三',
      contactPhone: '13800138000',
    },
  });

  await prisma.customer.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: 'C001' } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      code: 'C001',
      name: '示例客户',
      contactName: '李四',
      contactPhone: '13900139000',
      creditLimit: 100000,
    },
  });

  await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: 'WH001' } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      code: 'WH001',
      name: '主仓库',
      address: '上海市浦东新区',
    },
  });

  const warehouse = await prisma.warehouse.findFirst({
    where: { tenantId: defaultTenant.id, code: 'WH001' },
  });
  const product = await prisma.product.findFirst({
    where: { tenantId: defaultTenant.id, code: 'P001' },
  });
  if (product && warehouse) {
    const existingInventory = await prisma.inventory.findFirst({
      where: { productId: product.id, warehouseId: warehouse.id, batchNo: null },
    });
    if (!existingInventory) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: 100,
          unit: product.unit,
        },
      });
    }
  }

  const customer = await prisma.customer.findFirst({
    where: { tenantId: defaultTenant.id, code: 'C001' },
  });
  const vendor = await prisma.vendor.findFirst({
    where: { tenantId: defaultTenant.id, code: 'V001' },
  });
  const adminUser = await prisma.user.findFirst({
    where: { tenantId: defaultTenant.id, username: 'admin' },
  });
  if (adminUser && customer && vendor && product && warehouse) {
    await seedBiDemoData(
      adminUser.id,
      customer.id,
      vendor.id,
      product.id,
      warehouse.id,
      fgProduct?.id,
    );
    await clearReportCache();
  }

  const glAccounts = [
    { code: '1001', name: '库存现金', type: 'asset' },
    { code: '1002', name: '银行存款', type: 'asset' },
    { code: '1403', name: '原材料', type: 'asset' },
    { code: '2202', name: '应付账款', type: 'liability' },
    { code: '1122', name: '应收账款', type: 'asset' },
    { code: '6001', name: '主营业务收入', type: 'revenue' },
    { code: '6401', name: '主营业务成本', type: 'expense' },
  ];

  for (const account of glAccounts) {
    await prisma.glAccount.upsert({
      where: { code: account.code },
      update: account,
      create: account,
    });
  }

  await prisma.department.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: 'D001' } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      code: 'D001',
      name: '总部',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'company.name' },
    update: {},
    create: {
      key: 'company.name',
      value: '示例企业有限公司',
      description: '公司名称',
      group: 'general',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'system.timezone' },
    update: {},
    create: {
      key: 'system.timezone',
      value: 'Asia/Shanghai',
      description: '系统时区',
      group: 'general',
    },
  });

  const orderStatusDict = await prisma.dictionary.upsert({
    where: { code: 'order_status' },
    update: {},
    create: {
      code: 'order_status',
      name: '订单状态',
      description: '通用订单状态字典',
    },
  });

  const orderStatuses = [
    { label: '草稿', value: 'draft', sortOrder: 1 },
    { label: '已审批', value: 'approved', sortOrder: 2 },
    { label: '已完成', value: 'completed', sortOrder: 3 },
    { label: '已取消', value: 'cancelled', sortOrder: 4 },
  ];

  for (const item of orderStatuses) {
    await prisma.dictionaryItem.upsert({
      where: {
        dictionaryId_value: {
          dictionaryId: orderStatusDict.id,
          value: item.value,
        },
      },
      update: item,
      create: {
        ...item,
        dictionaryId: orderStatusDict.id,
      },
    });
  }

  const department = await prisma.department.findFirst({
    where: { tenantId: defaultTenant.id, code: 'D001' },
  });
  const position = await prisma.position.upsert({
    where: { code: 'P-MGR' },
    update: {},
    create: { code: 'P-MGR', name: '部门经理', description: '管理部门日常事务' },
  });

  const employee = await prisma.employee.upsert({
    where: { employeeNo: 'E001' },
    update: {},
    create: {
      employeeNo: 'E001',
      name: '王五',
      departmentId: department?.id,
      positionId: position.id,
      email: 'wangwu@erp.com',
      phone: '13700137000',
      hireDate: new Date('2023-01-01'),
    },
  });

  if (adminUser) {
    const project = await prisma.project.upsert({
      where: { code: 'PRJ001' },
      update: {},
      create: {
        code: 'PRJ001',
        name: 'ERP系统升级项目',
        description: '第四阶段功能扩展',
        managerId: employee.id,
        budget: 500000,
        status: 'active',
        progress: 30,
        createdById: adminUser.id,
        startDate: new Date(),
      },
    });
    const existingTask = await prisma.projectTask.findFirst({
      where: { projectId: project.id, name: '人力资源模块开发' },
    });
    if (!existingTask) {
      await prisma.projectTask.create({
        data: {
          projectId: project.id,
          name: '人力资源模块开发',
          assigneeId: employee.id,
          status: 'in_progress',
          progress: 50,
        },
      });
    }
  }

  await prisma.fixedAsset.upsert({
    where: { assetNo: 'FA-SEED-001' },
    update: {},
    create: {
      assetNo: 'FA-SEED-001',
      name: '办公服务器',
      category: 'IT设备',
      originalValue: 60000,
      usefulLifeMonths: 60,
      startDate: new Date('2024-01-01'),
      location: '机房A',
    },
  });

  const year = new Date().getFullYear();
  await prisma.budget.upsert({
    where: { tenantId_code: { tenantId: defaultTenant.id, code: `BUD-${year}-PROC` } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      code: `BUD-${year}-PROC`,
      name: `${year}年采购预算`,
      year,
      category: 'procurement',
      departmentId: department?.id,
      totalAmount: 500000,
      usedAmount: 0,
    },
  });

  if (product && warehouse) {
    await prisma.serialNumber.upsert({
      where: { tenantId_serialNo: { tenantId: defaultTenant.id, serialNo: 'SN-DEMO-001' } },
      update: {},
      create: {
        tenantId: defaultTenant.id,
        serialNo: 'SN-DEMO-001',
        productId: product.id,
        batchNo: 'BATCH-2024-001',
        warehouseId: warehouse.id,
        status: 'in_stock',
      },
    });
  }

  console.log('Seed data created successfully!');
  console.log('BI demo: 12 sales orders, 8 purchase orders, inventory ~2580');
  console.log('Roles seeded:', roleTemplates.map((r) => r.name).join(', '));
  const demoUsers = roleTemplates
    .filter((r) => r.demoUser && r.demoUser.username !== 'admin')
    .map((r) => r.demoUser!.username)
    .join(', ');
  console.log('Demo usernames:', demoUsers || '(none)');
  console.log('Admin username: admin');
  console.log('Passwords are taken from SEED_ADMIN_PASSWORD / SEED_DEMO_PASSWORD in .env');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
