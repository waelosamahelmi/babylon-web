import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Loader2,
  Package,
  Award
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  ordersByType: Array<{ type: string; count: number; revenue: number }>;
  ordersByPayment: Array<{ method: string; count: number; revenue: number }>;
  customerStats: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
  couponUsage: Array<{ code: string; usageCount: number; totalDiscount: number }>;
}

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Fetch branches for filter
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reports', startDate, endDate, selectedBranch],
    queryFn: async (): Promise<ReportData> => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59`);

      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', parseInt(selectedBranch));
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Orders by status
      const ordersByStatus = orders?.reduce((acc: any[], order) => {
        const existing = acc.find(s => s.status === order.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: order.status, count: 1 });
        }
        return acc;
      }, []) || [];

      // Orders by type
      const ordersByType = orders?.reduce((acc: any[], order) => {
        const existing = acc.find(t => t.type === order.order_type);
        if (existing) {
          existing.count++;
          existing.revenue += order.total;
        } else {
          acc.push({ type: order.order_type, count: 1, revenue: order.total });
        }
        return acc;
      }, []) || [];

      // Orders by payment method
      const ordersByPayment = orders?.reduce((acc: any[], order) => {
        const existing = acc.find(p => p.method === order.payment_method);
        if (existing) {
          existing.count++;
          existing.revenue += order.total;
        } else {
          acc.push({ method: order.payment_method, count: 1, revenue: order.total });
        }
        return acc;
      }, []) || [];

      // Top products
      const productMap = new Map();
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const key = item.menu_item_id;
          if (!productMap.has(key)) {
            productMap.set(key, {
              name: `Product ${key}`, // Would need to join menu_items table
              quantity: 0,
              revenue: 0,
            });
          }
          const product = productMap.get(key);
          product.quantity += item.quantity;
          product.revenue += item.price * item.quantity;
        });
      });
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Customer stats (simplified - would need proper customer tracking)
      const uniqueEmails = new Set(orders?.map(o => o.customer_email) || []);
      const customerStats = {
        totalCustomers: uniqueEmails.size,
        newCustomers: uniqueEmails.size, // Would need to check registration dates
        returningCustomers: 0, // Would need order history analysis
      };

      // Coupon usage (would need to query coupon_usage table)
      const couponUsage: any[] = [];

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        ordersByStatus,
        ordersByType,
        ordersByPayment,
        customerStats,
        couponUsage,
      };
    },
  });

  // Generate PDF report
  const generatePDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Report', pageWidth / 2, 20, { align: 'center' });

    // Date range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, 30, { align: 'center' });

    // Summary metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Revenue: €${reportData.totalRevenue.toFixed(2)}`, 14, 55);
    doc.text(`Total Orders: ${reportData.totalOrders}`, 14, 62);
    doc.text(`Average Order Value: €${reportData.averageOrderValue.toFixed(2)}`, 14, 69);

    // Orders by Type table
    autoTable(doc, {
      startY: 80,
      head: [['Order Type', 'Count', 'Revenue']],
      body: reportData.ordersByType.map(t => [
        t.type,
        t.count.toString(),
        `€${t.revenue.toFixed(2)}`
      ]),
      headStyles: { fillColor: [234, 88, 12] }, // Orange
    });

    // Orders by Payment Method
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Payment Method', 'Count', 'Revenue']],
      body: reportData.ordersByPayment.map(p => [
        p.method,
        p.count.toString(),
        `€${p.revenue.toFixed(2)}`
      ]),
      headStyles: { fillColor: [234, 88, 12] },
    });

    // Top Products
    if (reportData.topProducts.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Product', 'Quantity', 'Revenue']],
        body: reportData.topProducts.map(p => [
          p.name,
          p.quantity.toString(),
          `€${p.revenue.toFixed(2)}`
        ]),
        headStyles: { fillColor: [234, 88, 12] },
      });
    }

    // Save PDF
    doc.save(`sales-report-${startDate}-to-${endDate}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Sales Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive sales analytics and insights
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches?.map(branch => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={() => refetch()} className="flex-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate
                </Button>
                <Button onClick={generatePDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                €{reportData?.totalRevenue.toFixed(2) || '0.00'}
              </CardContent>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {reportData?.totalOrders || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                €{reportData?.averageOrderValue.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="w-4 h-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="coupons">
              <Award className="w-4 h-4 mr-2" />
              Coupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Order Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData?.ordersByType.map((type, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-stone-800 rounded-lg">
                        <span className="font-medium capitalize">{type.type}</span>
                        <div className="text-right">
                          <p className="font-bold">{type.count} orders</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">€{type.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData?.ordersByPayment.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-stone-800 rounded-lg">
                        <span className="font-medium capitalize">{payment.method}</span>
                        <div className="text-right">
                          <p className="font-bold">{payment.count} orders</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">€{payment.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-stone-800 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{product.quantity} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">€{product.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData?.customerStats.totalCustomers}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">New Customers</p>
                    <p className="text-2xl font-bold text-green-600">{reportData?.customerStats.newCustomers}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Returning</p>
                    <p className="text-2xl font-bold text-purple-600">{reportData?.customerStats.returningCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData?.couponUsage.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">No coupon usage in this period</p>
                ) : (
                  <div className="space-y-3">
                    {reportData?.couponUsage.map((coupon, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-stone-800 rounded-lg">
                        <div>
                          <p className="font-bold">{coupon.code}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{coupon.usageCount} uses</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">-€{coupon.totalDiscount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
