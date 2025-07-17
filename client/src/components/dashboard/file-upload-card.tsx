import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

interface FileUploadStatus {
  fileName: string;
  status: 'completed' | 'processing' | 'queued' | 'failed';
}

export default function FileUploadCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [recentFiles] = useState<FileUploadStatus[]>([
    { fileName: "trial_balance_q3.xlsx", status: "completed" },
    { fileName: "gst_returns_jan.pdf", status: "processing" },
    { fileName: "bank_statements.csv", status: "queued" },
  ]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully and processing started",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error) => {
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
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload Excel (.xlsx, .xls), CSV, or PDF files only",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 100MB",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="status-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Document Upload</CardTitle>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`upload-dropzone p-8 text-center ${isDragging ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Upload Financial Documents</p>
          <p className="text-sm text-muted-foreground mt-2">Supports Excel, CSV, PDF up to 100MB</p>
          <div className="mt-4">
            <Button
              disabled={uploadMutation.isPending}
              onClick={() => document.getElementById('file-input')?.click()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Choose Files'}
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">Or drag and drop files here</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {recentFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{file.fileName}</span>
              <span className={`file-status-indicator ${file.status}`}>
                {file.status === 'completed' && '✓ Processed'}
                {file.status === 'processing' && '⚠ Validating'}
                {file.status === 'queued' && '⏳ Queued'}
                {file.status === 'failed' && '✗ Failed'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
