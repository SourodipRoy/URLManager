import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Upload, Download, FileText, Merge, X } from "lucide-react";
import type { FileAnalysis } from "@shared/schema";

export default function FileMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [filename, setFilename] = useLocalStorage("fileMerger_filename", "merged-links.txt");
  const [mergeResult, setMergeResult] = useState<FileAnalysis | null>(null);
  const { toast } = useToast();

  const mergeMutation = useMutation({
    mutationFn: async (fileContents: string[]) => {
      const response = await apiRequest("POST", "/api/merge-files", { files: fileContents });
      return response.json();
    },
    onSuccess: (data: FileAnalysis) => {
      setMergeResult(data);
      toast({
        title: "Files merged successfully",
        description: `Found ${data.uniqueLines} unique URLs from ${data.totalLines} total lines`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to merge files",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    const txtFiles = uploadedFiles.filter(file => file.name.toLowerCase().endsWith('.txt'));
    
    if (txtFiles.length !== uploadedFiles.length) {
      toast({
        title: "Warning",
        description: "Only .txt files are supported",
        variant: "destructive",
      });
    }
    
    setFiles(prev => [...prev, ...txtFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setMergeResult(null);
    }
  };

  const handleMerge = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileContents = await Promise.all(
        files.map(file => file.text())
      );
      mergeMutation.mutate(fileContents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read files",
        variant: "destructive",
      });
    }
  };

  const downloadMergedFile = () => {
    if (!mergeResult) return;

    const content = mergeResult.urls.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "merged-links.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Downloaded ${mergeResult.uniqueLines} unique URLs`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">TXT File Merger</h1>
        <p className="text-slate-600 mt-2">Upload multiple .txt files and merge them into one unique set of URLs</p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload TXT Files</CardTitle>
          <CardDescription>
            Select multiple .txt files to merge. Duplicate URLs will be automatically removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="text-slate-400 text-3xl mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Click to upload .txt files</p>
              <p className="text-slate-500 text-sm mt-1">You can select multiple files at once</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Uploaded Files ({files.length})</h3>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-slate-400 text-lg" />
                    <div>
                      <p className="text-slate-900 font-medium">{file.name}</p>
                      <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="text-sm" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleMerge}
            disabled={files.length === 0 || mergeMutation.isPending}
            className="w-full flex items-center space-x-2"
          >
            <Merge className="text-sm" />
            <span>{mergeMutation.isPending ? "Merging..." : "Merge Files"}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Merge Results */}
      {mergeResult && (
        <Card>
          <CardHeader>
            <CardTitle>Merge Results</CardTitle>
            <CardDescription>Analysis of the merged files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{mergeResult.totalLines}</p>
                <p className="text-blue-800 text-sm font-medium">Total Lines</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{mergeResult.uniqueLines}</p>
                <p className="text-green-800 text-sm font-medium">Unique URLs</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{mergeResult.duplicateLines}</p>
                <p className="text-red-800 text-sm font-medium">Duplicates Removed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Label htmlFor="merge-filename">Output Filename</Label>
                  <Input
                    id="merge-filename"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="merged-links.txt"
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={downloadMergedFile}
                    className="flex items-center space-x-2"
                  >
                    <Download className="text-sm" />
                    <span>Download Merged File</span>
                  </Button>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <FileText className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Ready to download! The merged file contains {mergeResult.uniqueLines} unique URLs with all duplicates removed.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}