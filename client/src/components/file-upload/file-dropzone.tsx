import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { cn } from "@/lib/utils";

interface FileUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function FileDropzone() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, id }: { file: File; id: string }) => {
      console.log("Starting upload for file:", file.name);
      const formData = new FormData();
      formData.append('file', file);
      
      // Update progress to show upload started
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading', progress: 0 } : f
      ));
      
      try {
        console.log("=== STARTING UPLOAD ===");
        console.log("Sending request to /api/documents/upload");
        console.log("Auth token:", localStorage.getItem('access_token'));
        console.log("File details:", {
          name: file.name,
          size: file.size,
          type: file.type
        });
        
        // Check if we have a token
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        
        const response = await apiRequest('/api/documents/upload', {
          method: 'POST',
          body: formData
        });
        console.log("Upload response:", response);
        console.log("=== UPLOAD SUCCESS ===");
        return response;
      } catch (error) {
        console.error("=== UPLOAD FAILED ===");
        console.error("Upload API error:", error);
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Error type:", typeof error);
        if (error.response) {
          console.error("Error response:", error.response);
        }
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      setFiles(prev => prev.map(f => 
        f.id === variables.id ? { ...f, status: 'success', progress: 100 } : f
      ));
      
      toast({
        title: "Success",
        description: "Document uploaded and saved successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any, variables) => {
      console.error("Upload error:", error);
      console.error("Error type:", typeof error);
      console.error("Error object:", JSON.stringify(error, null, 2));
      
      setFiles(prev => prev.map(f => 
        f.id === variables.id ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error.message || 'Upload failed'
        } : f
      ));
      
      // Check if this is an unauthorized error
      const isUnauthorized = error.message?.includes('401') || 
                            error.message?.includes('Unauthorized') ||
                            error.status === 401;
      
      if (isUnauthorized) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please login again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
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

  const validateFile = (file: File): string | null => {
    // Check file extension instead of MIME type for better compatibility
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
      return "File type not supported. Please upload Excel (.xlsx, .xls), CSV, or PDF files.";
    }
    
    if (file.size > 100 * 1024 * 1024) {
      return "File size must be less than 100MB";
    }
    
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      const id = `${Date.now()}-${Math.random()}`;
      
      if (error) {
        toast({
          title: "Invalid File",
          description: error,
          variant: "destructive",
        });
        return;
      }
      
      const fileItem: FileUploadItem = {
        id,
        file,
        status: 'pending',
        progress: 0,
      };
      
      setFiles(prev => [...prev, fileItem]);
      
      // Start upload
      uploadMutation.mutate({ file, id });
    });
  }, [uploadMutation, toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    if (file.type.includes('csv')) return '📋';
    return '📄';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        className={cn(
          "upload-dropzone cursor-pointer",
          isDragOver && "drag-over"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <CardContent className="p-8 text-center">
          <CloudUpload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supports Excel (.xlsx, .xls), CSV, and PDF files up to 100MB
          </p>
          <Button type="button" variant="outline">
            Choose Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Upload Queue</h4>
          {files.map((fileItem) => (
            <Card key={fileItem.id} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(fileItem.file)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fileItem.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {fileItem.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-secondary" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className={cn(
                      "text-xs font-medium",
                      fileItem.status === 'success' ? "text-secondary" :
                      fileItem.status === 'error' ? "text-destructive" :
                      fileItem.status === 'uploading' ? "text-accent" :
                      "text-muted-foreground"
                    )}>
                      {fileItem.status === 'pending' && 'Pending'}
                      {fileItem.status === 'uploading' && 'Uploading...'}
                      {fileItem.status === 'success' && 'Uploaded'}
                      {fileItem.status === 'error' && 'Failed'}
                    </p>
                  </div>
                  
                  {fileItem.status === 'uploading' && (
                    <Progress value={fileItem.progress} className="mt-2" />
                  )}
                  
                  {fileItem.status === 'error' && fileItem.error && (
                    <p className="text-xs text-destructive mt-1">{fileItem.error}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
