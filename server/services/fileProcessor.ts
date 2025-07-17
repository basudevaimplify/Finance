import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface FileProcessingResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: {
    size: number;
    mimeType: string;
    pages?: number;
    sheets?: string[];
  };
}

export class FileProcessorService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv (alternative)
    'text/plain', // .csv (sometimes detected as plain text)
    'application/octet-stream', // .csv (generic binary)
    'application/pdf', // .pdf
  ];
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async validateFile(file: Express.Multer.File): Promise<{ isValid: boolean; error?: string }> {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`,
      };
    }

    // Check file extension
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension ${fileExtension} not supported. Allowed types: .xlsx, .xls, .csv, .pdf`,
      };
    }

    // For CSV files, allow common MIME types
    if (fileExtension === '.csv') {
      const csvMimeTypes = ['text/csv', 'application/csv', 'text/plain', 'application/octet-stream'];
      if (!csvMimeTypes.includes(file.mimetype)) {
        return {
          isValid: false,
          error: `CSV file detected with unsupported MIME type: ${file.mimetype}`,
        };
      }
    } else {
      // For other files, check standard MIME types
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        return {
          isValid: false,
          error: `File type ${file.mimetype} not supported. Allowed types: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf)`,
        };
      }
    }

    // Additional validation based on file content
    const isValidContent = await this.validateFileContent(file);
    if (!isValidContent) {
      return {
        isValid: false,
        error: 'File content validation failed. File may be corrupted or invalid.',
      };
    }

    return { isValid: true };
  }

  private async validateFileContent(file: Express.Multer.File): Promise<boolean> {
    try {
      const buffer = file.buffer;
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      // Skip complex validation for now to avoid timeout issues
      if (fileExtension === '.csv') {
        // For CSV files, just check if it's valid UTF-8 text
        try {
          const text = buffer.toString('utf-8', 0, Math.min(1024, buffer.length));
          return text.length > 0;
        } catch (error) {
          return false;
        }
      }
      
      // For other files, basic validation
      if (file.mimetype === 'application/pdf') {
        return buffer.slice(0, 4).toString() === '%PDF';
      } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
        const signature = buffer.slice(0, 8);
        return signature.includes(Buffer.from('PK')) || signature.includes(Buffer.from('\xD0\xCF\x11\xE0'));
      }

      return true;
    } catch (error) {
      console.error("File content validation error:", error);
      return false;
    }
  }

  async saveFile(file: Express.Multer.File, fileName: string): Promise<FileProcessingResult> {
    try {
      const validation = await this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const filePath = path.join(this.uploadDir, fileName);
      await writeFile(filePath, file.buffer);

      // Extract metadata
      const metadata = await this.extractMetadata(filePath, file.mimetype);

      return {
        success: true,
        filePath,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save file: ${error.message}`,
      };
    }
  }

  private async extractMetadata(filePath: string, mimeType: string): Promise<any> {
    const stats = await fs.promises.stat(filePath);
    
    const metadata = {
      size: stats.size,
      mimeType,
    };

    if (mimeType === 'application/pdf') {
      // For PDF files, we could extract page count using a PDF library
      // For now, we'll use a simple approach
      try {
        const content = await readFile(filePath);
        const pageMatches = content.toString().match(/\/Type\s*\/Page\b/g);
        metadata.pages = pageMatches ? pageMatches.length : 1;
      } catch (error) {
        metadata.pages = 1;
      }
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      // For Excel files, we could extract sheet names using a library like xlsx
      // For now, we'll use a placeholder
      metadata.sheets = ['Sheet1'];
    }

    return metadata;
  }

  async extractTextContent(filePath: string): Promise<string> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.csv') {
        return await this.extractCSVContent(filePath);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        return await this.extractExcelContent(filePath);
      } else if (fileExtension === '.pdf') {
        return await this.extractPDFContent(filePath);
      }
      
      throw new Error(`Unsupported file type: ${fileExtension}`);
    } catch (error) {
      throw new Error(`Failed to extract content from ${filePath}: ${error.message}`);
    }
  }

  private async extractCSVContent(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf-8');
    return content;
  }

  private async extractExcelContent(filePath: string): Promise<string> {
    // In a real implementation, you would use a library like 'xlsx' to parse Excel files
    // For now, we'll return a placeholder that simulates extracted content
    const buffer = await readFile(filePath);
    
    // Simple text extraction - in production, use proper Excel parsing
    const textContent = buffer.toString('utf-8', 0, 2000);
    
    // Extract readable text portions
    const readableText = textContent.replace(/[^\x20-\x7E\n\r]/g, ' ').trim();
    
    return readableText || 'Excel content extracted (placeholder)';
  }

  private async extractPDFContent(filePath: string): Promise<string> {
    // In a real implementation, you would use a library like 'pdf-parse' or 'pdfjs-dist'
    // For now, we'll return a placeholder that simulates extracted content
    const buffer = await readFile(filePath);
    
    // Simple text extraction - in production, use proper PDF parsing
    const textContent = buffer.toString('utf-8', 0, 2000);
    
    // Extract readable text portions
    const readableText = textContent.replace(/[^\x20-\x7E\n\r]/g, ' ').trim();
    
    return readableText || 'PDF content extracted (placeholder)';
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  getFileUrl(filePath: string): string {
    const relativePath = path.relative(this.uploadDir, filePath);
    return `/uploads/${relativePath}`;
  }
}

export const fileProcessorService = new FileProcessorService();
