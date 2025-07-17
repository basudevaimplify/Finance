import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, FileText, Calendar, DollarSign, Building, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExtractedData {
  id: string;
  documentId: string;
  documentType: string;
  fileName: string;
  data: any;
  extractedAt: string;
  confidence: number;
}

export default function DataTables() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("Q1_2025");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: extractedData, isLoading: dataLoading, error } = useQuery<ExtractedData[]>({
    queryKey: [`/api/extracted-data?period=${selectedPeriod}&docType=${selectedDocType}`],
  });

  console.log('Data Tables Query:', { extractedData, isLoading, error });
  console.log('Extracted data length:', extractedData?.length || 0);
  console.log('Selected period:', selectedPeriod, 'Selected doc type:', selectedDocType);

  const filteredData = extractedData?.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedDocType === "all" || item.documentType === selectedDocType;
    
    return matchesSearch && matchesType;
  }) || [];

  const documentTypes = [
    { value: "vendor_invoice", label: "Vendor Invoices", icon: FileText, color: "bg-blue-500" },
    { value: "sales_register", label: "Sales Register", icon: DollarSign, color: "bg-green-500" },
    { value: "salary_register", label: "Salary Register", icon: Users, color: "bg-purple-500" },
    { value: "bank_statement", label: "Bank Statement", icon: Building, color: "bg-orange-500" },
    { value: "purchase_register", label: "Purchase Register", icon: Calendar, color: "bg-red-500" },
  ];

  const getDocumentTypeData = (docType: string) => {
    return filteredData.filter(item => item.documentType === docType);
  };

  const renderVendorInvoiceData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.invoices?.map((invoice: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{invoice.invoiceNumber || "N/A"}</TableCell>
                    <TableCell>{invoice.vendorName || "N/A"}</TableCell>
                    <TableCell>{invoice.invoiceDate || "N/A"}</TableCell>
                    <TableCell className="font-mono">₹{invoice.amount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono text-sm">{invoice.gstin || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                        {invoice.status || "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSalesRegisterData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Taxable Amount</TableHead>
                  <TableHead>GST Amount</TableHead>
                  <TableHead>Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.sales?.map((sale: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{sale.invoiceNumber || "N/A"}</TableCell>
                    <TableCell>{sale.customerName || "N/A"}</TableCell>
                    <TableCell>{sale.saleDate || "N/A"}</TableCell>
                    <TableCell className="font-mono">₹{sale.taxableAmount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{sale.gstAmount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono font-semibold">₹{sale.totalAmount?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSalaryRegisterData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>TDS Deducted</TableHead>
                  <TableHead>Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.employees?.map((employee: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{employee.employeeId || "N/A"}</TableCell>
                    <TableCell>{employee.employeeName || "N/A"}</TableCell>
                    <TableCell>{employee.department || "N/A"}</TableCell>
                    <TableCell className="font-mono">₹{employee.basicSalary?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono">₹{employee.tdsDeducted?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="font-mono font-semibold">₹{employee.netSalary?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderBankStatementData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.transactions?.map((transaction: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{transaction.date || "N/A"}</TableCell>
                    <TableCell>{transaction.description || "N/A"}</TableCell>
                    <TableCell className="font-mono text-sm">{transaction.reference || "N/A"}</TableCell>
                    <TableCell className="font-mono text-red-600">
                      {transaction.debit ? `₹${transaction.debit.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-green-600">
                      {transaction.credit ? `₹${transaction.credit.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">₹{transaction.balance?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPurchaseRegisterData = (data: any[]) => (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.fileName}</CardTitle>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {(item.confidence * 100).toFixed(1)}% confidence
              </Badge>
            </div>
            <CardDescription>
              Extracted on {new Date(item.extractedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Item Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.data.purchases?.map((purchase: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{purchase.purchaseOrder || "N/A"}</TableCell>
                    <TableCell>{purchase.vendorName || "N/A"}</TableCell>
                    <TableCell>{purchase.purchaseDate || "N/A"}</TableCell>
                    <TableCell>{purchase.itemDescription || "N/A"}</TableCell>
                    <TableCell className="font-mono">{purchase.quantity || "0"}</TableCell>
                    <TableCell className="font-mono font-semibold">₹{purchase.amount?.toLocaleString() || "0"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <main className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Data Tables</h1>
                <p className="text-muted-foreground">View extracted data from financial documents</p>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Data Tables</h1>
              <p className="text-muted-foreground">View extracted data from financial documents</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1_2025">Q1 2025</SelectItem>
                  <SelectItem value="Q2_2025">Q2 2025</SelectItem>
                  <SelectItem value="Q3_2025">Q3 2025</SelectItem>
                  <SelectItem value="Q4_2025">Q4 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctype">Document Type</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="vendor_invoice" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {documentTypes.map((type) => {
            const Icon = type.icon;
            const count = getDocumentTypeData(type.value).length;
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {type.label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="vendor_invoice" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vendor Invoices Data</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {getDocumentTypeData("vendor_invoice").length} documents
            </Badge>
          </div>
          {renderVendorInvoiceData(getDocumentTypeData("vendor_invoice"))}
        </TabsContent>

        <TabsContent value="sales_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sales Register Data</h2>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {getDocumentTypeData("sales_register").length} documents
            </Badge>
          </div>
          {renderSalesRegisterData(getDocumentTypeData("sales_register"))}
        </TabsContent>

        <TabsContent value="salary_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Salary Register Data</h2>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {getDocumentTypeData("salary_register").length} documents
            </Badge>
          </div>
          {renderSalaryRegisterData(getDocumentTypeData("salary_register"))}
        </TabsContent>

        <TabsContent value="bank_statement" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bank Statement Data</h2>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {getDocumentTypeData("bank_statement").length} documents
            </Badge>
          </div>
          {renderBankStatementData(getDocumentTypeData("bank_statement"))}
        </TabsContent>

        <TabsContent value="purchase_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Purchase Register Data</h2>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {getDocumentTypeData("purchase_register").length} documents
            </Badge>
          </div>
          {renderPurchaseRegisterData(getDocumentTypeData("purchase_register"))}
        </TabsContent>
      </Tabs>

      {filteredData.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No data found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedDocType !== "all" 
                  ? "No documents match your current filters. Try adjusting your search or filters."
                  : "No extracted data available for the selected period. Upload and process documents to see data here."
                }
              </p>
            </div>
          </div>
        </Card>
      )}
        </main>
      </div>
    </div>
  );
}