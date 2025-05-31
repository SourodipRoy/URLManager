import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Upload, Download, FileText, Search, AlertTriangle } from "lucide-react";
import type { FileAnalysis } from "@shared/schema";

export default function DuplicateChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useLocalStorage("duplicateChecker_filename", "cleaned-links.txt");
  const [preserveOrder, setPreserveOrder] = useLocalStorage("duplicateChecker_preserveOrder", true);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/analyze-file", { content });
      return response.json();
    },
    onSuccess: (data: FileAnalysis) => {
      setAnalysis(data);
      if (data.duplicateLines > 0) {
        toast({
          title: "Analysis complete",
          description: `Found ${data.duplicateLines} duplicate URLs out of ${data.totalLines} total lines`,
        });
      } else {
        toast({
          title: "No duplicates found",
          description: "Your file is already clean!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    
    try {
      const content = await uploadedFile.text();
      analyzeMutation.mutate(content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const downloadCleanedFile = () => {
    if (!analysis || !file) return;

    let content: string;
    
    if (preserveOrder) {
      // Preserve original order, just remove duplicates
      const lines = file.text().then(text => {
        const allLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const seen = new Set<string>();
        const uniqueLines = allLines.filter(line => {
          if (seen.has(line)) {
            return false;
          }
          seen.add(line);
          return true;
        });
        
        const content = uniqueLines.join("\n");
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "cleaned-links.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: `Downloaded ${uniqueLines.length} unique URLs`,
        });
      });
    } else {
      // Use sorted unique URLs from analysis
      content = analysis.urls.join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "cleaned-links.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Downloaded ${analysis.uniqueLines} unique URLs`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">TXT Duplicate Link Checker</h1>
        <p className="text-slate-600 mt-2">Upload a .txt file to analyze and remove duplicate URLs</p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload TXT File</CardTitle>
          <CardDescription>
            Select a .txt file to analyze for duplicate URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="text-slate-400 text-3xl mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Click to upload a .txt file</p>
              <p className="text-slate-500 text-sm mt-1">Only .txt files are supported</p>
            </label>
          </div>

          {file && (
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <FileText className="text-slate-400 text-lg" />
              <div className="flex-1">
                <p className="text-slate-900 font-medium">{file.name}</p>
                <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {analyzeMutation.isPending && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Duplicate analysis for {file?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analysis.totalLines}</p>
                <p className="text-blue-800 text-sm font-medium">Total Lines</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analysis.uniqueLines}</p>
                <p className="text-green-800 text-sm font-medium">Unique URLs</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{analysis.duplicateLines}</p>
                <p className="text-red-800 text-sm font-medium">Duplicates Found</p>
              </div>
            </div>

            {analysis.duplicateLines > 0 && (
              <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Found {analysis.duplicateLines} duplicate URLs. You can download a cleaned version below.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                  <Switch
                    id="preserve-order"
                    checked={preserveOrder}
                    onCheckedChange={setPreserveOrder}
                  />
                  <div className="flex-1">
                    <Label htmlFor="preserve-order" className="font-medium">
                      Preserve original line order
                    </Label>
                    <p className="text-slate-500 text-sm">
                      Keep URLs in the same order as the original file, or allow alphabetical sorting
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="clean-filename">Output Filename</Label>
                    <Input
                      id="clean-filename"
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="cleaned-links.txt"
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={downloadCleanedFile}
                      className="flex items-center space-x-2"
                    >
                      <Download className="text-sm" />
                      <span>Download Cleaned File</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {analysis.duplicateLines === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <Search className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Great! No duplicate URLs found in your file. It's already clean.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}