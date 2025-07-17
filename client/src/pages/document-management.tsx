import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Eye, Trash2, Calendar, RefreshCw, Database, User, Settings, Filter } from "lucide-react";
import { format } from "date-fns";
import type { Document } from "@shared/schema";

export default function DocumentManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [dataSourceFilter, setDataSourceFilter] = useState<string>("all");

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

  const { data: documents, isLoading: documentsLoading, refetch } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      // Force a refetch to ensure immediate UI update
      refetch();
    },
    onError: (error) => {
      console.error("Document deletion error:", error);
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: `Failed to delete document: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'journal':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'gst':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'tds':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'journal':
        return 'Journal Entry';
      case 'gst':
        return 'GST Document';
      case 'tds':
        return 'TDS Document';
      default:
        return 'Unknown';
    }
  };

  const getDataSourceInfo = (document: Document) => {
    // Mock data source information - in real implementation, this would come from the document metadata
    const dataSources = [
      { id: 'manual', name: 'Manual Upload', icon: User, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      { id: 'sap', name: 'SAP ERP', icon: Database, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      { id: 'zoho', name: 'Zoho Books', icon: Database, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      { id: 'tally', name: 'Tally Prime', icon: Database, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      { id: 'quickbooks', name: 'QuickBooks', icon: Database, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
      { id: 'excel', name: 'Excel Import', icon: FileText, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      { id: 'api', name: 'API Integration', icon: Settings, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
    ];

    // Determine data source based on document properties
    const fileName = document.originalName.toLowerCase();
    const documentType = document.documentType;
    
    // Logic to determine data source based on file patterns or metadata
    if (fileName.includes('sap') || fileName.includes('_sap_')) {
      return dataSources.find(ds => ds.id === 'sap') || dataSources[0];
    } else if (fileName.includes('zoho') || fileName.includes('_zoho_')) {
      return dataSources.find(ds => ds.id === 'zoho') || dataSources[0];
    } else if (fileName.includes('tally') || fileName.includes('_tally_')) {
      return dataSources.find(ds => ds.id === 'tally') || dataSources[0];
    } else if (fileName.includes('quickbooks') || fileName.includes('_qb_')) {
      return dataSources.find(ds => ds.id === 'quickbooks') || dataSources[0];
    } else if (fileName.includes('api') || document.extractedData?.source === 'api') {
      return dataSources.find(ds => ds.id === 'api') || dataSources[0];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return dataSources.find(ds => ds.id === 'excel') || dataSources[0];
    } else {
      return dataSources.find(ds => ds.id === 'manual') || dataSources[0];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageLayout title="Document Management">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {documents?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                System Extracted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents?.filter(d => getDataSourceInfo(d).id !== 'manual').length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                SAP, Zoho, APIs
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Manual Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {documents?.filter(d => getDataSourceInfo(d).id === 'manual').length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                User uploaded
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {documents?.filter(d => d.status === 'completed').length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Ready for use
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Data Source:</label>
                <Select value={dataSourceFilter} onValueChange={setDataSourceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual Upload</SelectItem>
                    <SelectItem value="sap">SAP ERP</SelectItem>
                    <SelectItem value="zoho">Zoho Books</SelectItem>
                    <SelectItem value="tally">Tally Prime</SelectItem>
                    <SelectItem value="quickbooks">QuickBooks</SelectItem>
                    <SelectItem value="excel">Excel Import</SelectItem>
                    <SelectItem value="api">API Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDataSourceFilter("all")}
                className="text-gray-600"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {dataSourceFilter === "all" ? "All Documents" : `Documents from ${dataSourceFilter === "manual" ? "Manual Upload" : dataSourceFilter.toUpperCase()}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents && documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents
                    .filter(document => 
                      dataSourceFilter === "all" || 
                      getDataSourceInfo(document).id === dataSourceFilter
                    )
                    .map((document: Document) => {
                      const dataSourceInfo = getDataSourceInfo(document);
                      const DataSourceIcon = dataSourceInfo.icon;
                      
                      return (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDocumentTypeIcon(document.documentType)}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {document.originalName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {document.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getDocumentTypeName(document.documentType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={dataSourceInfo.color}>
                                <DataSourceIcon className="h-3 w-3 mr-1" />
                                {dataSourceInfo.name}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(document.status)}>
                              {document.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {document.fileSize ? formatFileSize(document.fileSize) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDocument(document)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {document.filePath && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/uploads/${document.filePath}`, '_blank')}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{document.originalName}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(document.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {dataSourceFilter === "all" 
                    ? "No documents uploaded yet" 
                    : `No documents found from ${dataSourceFilter === "manual" ? "manual upload" : dataSourceFilter.toUpperCase()}`
                  }
                </p>
                {dataSourceFilter !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => setDataSourceFilter("all")}
                    className="mt-4"
                  >
                    Show All Documents
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Details Modal */}
        {selectedDocument && (
          <AlertDialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Document Details</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      File Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.originalName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Document Type
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {getDocumentTypeName(selectedDocument.documentType)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <Badge className={getStatusColor(selectedDocument.status)}>
                      {selectedDocument.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      File Size
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedDocument.fileSize ? formatFileSize(selectedDocument.fileSize) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Data Source
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const dataSourceInfo = getDataSourceInfo(selectedDocument);
                        const DataSourceIcon = dataSourceInfo.icon;
                        return (
                          <Badge className={dataSourceInfo.color}>
                            <DataSourceIcon className="h-3 w-3 mr-1" />
                            {dataSourceInfo.name}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Processing Method
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {getDataSourceInfo(selectedDocument).id === 'manual' ? 'Manual Upload' : 'Automated Extraction'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Uploaded
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {format(new Date(selectedDocument.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Last Updated
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {format(new Date(selectedDocument.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {selectedDocument.extractedData && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Extracted Data
                    </label>
                    <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(selectedDocument.extractedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </PageLayout>
  );
}