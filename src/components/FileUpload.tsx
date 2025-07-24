import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files);
    if (e.target.files && e.target.files[0]) {
      console.log('File selected:', e.target.files[0].name);
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    console.log('FileUpload: handleFile called with file:', file.name);
    setError(null);
    
    if (!file.name.endsWith('.xlsx')) {
      setError('Please upload an Excel file (.xlsx format only)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    console.log('FileUpload: calling onFileSelect with file:', file.name);
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2 border-dashed transition-colors duration-200 shadow-soft hover:shadow-medium">
        <CardContent className="p-8">
          <div
            className={`text-center transition-colors duration-200 ${
              dragActive ? 'bg-accent/10 border-accent' : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Portfolio Data
            </h3>
            <p className="text-muted-foreground mb-6">
              Upload an Excel file with your portfolio company data on the "Main Page" tab
            </p>
            
            <div className="space-y-4">
              <Button
                variant="outline"
                className="relative overflow-hidden"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Excel File
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Or drag and drop your .xlsx file here
              </p>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 text-sm text-muted-foreground space-y-2">
        <p className="font-medium">Required columns:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• Company Name</li>
          <li>• Industry</li>
          <li>• Total Investment to Date</li>
          <li>• Equity Stake (FD %)</li>
          <li>• MOIC</li>
          <li>• TTM Revenue Growth</li>
          <li>• Burn Multiple</li>
          <li>• Runway</li>
          <li>• TAM (1–5)</li>
          <li>• Exit Activity in Sector</li>
          <li>• Barrier to Entry (1–5)</li>
          <li>• Additional Investment Requested</li>
        </ul>
      </div>
    </div>
  );
}