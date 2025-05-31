import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { FileText, Download, Type, CheckCircle } from "lucide-react";

export default function TextToFile() {
  const [textInput, setTextInput] = useLocalStorage("textToFile_input", "");
  const [filename, setFilename] = useLocalStorage("textToFile_filename", "urls.txt");
  const [analysis, setAnalysis] = useState<{
    totalLines: number;
    uniqueLines: number;
    duplicateLines: number;
    urls: string[];
  } | null>(null);
  const { toast } = useToast();

  const analyzeText = () => {
    if (!textInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    const lines = textInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const uniqueLines = Array.from(new Set(lines));
    
    setAnalysis({
      totalLines: lines.length,
      uniqueLines: uniqueLines.length,
      duplicateLines: lines.length - uniqueLines.length,
      urls: uniqueLines
    });

    toast({
      title: "Analysis complete",
      description: `Found ${uniqueLines.length} unique URLs from ${lines.length} total lines`,
    });
  };

  const downloadFile = () => {
    if (!analysis) return;

    const content = analysis.urls.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "urls.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Downloaded ${analysis.uniqueLines} unique URLs`,
    });
  };

  const clearAll = () => {
    setTextInput("");
    setAnalysis(null);
    setFilename("urls.txt");
    toast({
      title: "Cleared",
      description: "All data has been cleared",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Text to .txt File Maker</h1>
        <p className="text-slate-600 mt-2">Paste or type URLs to create a clean .txt file with duplicates removed</p>
      </div>

      {/* Text Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Enter URLs</CardTitle>
          <CardDescription>
            Paste or type URLs, one per line. Duplicates will be automatically removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text-input">URL List</Label>
            <Textarea
              id="text-input"
              placeholder="https://example.com&#10;https://google.com&#10;https://github.com&#10;..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="mt-2 min-h-[200px] font-mono text-sm"
            />
            <p className="text-slate-500 text-sm mt-2">
              Enter one URL per line. Empty lines will be ignored.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={analyzeText}
              disabled={!textInput.trim()}
              className="flex items-center space-x-2"
            >
              <Type className="text-sm" />
              <span>Analyze Text</span>
            </Button>
            
            {textInput.trim() && (
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <span>Clear All</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Processing summary for your text input</CardDescription>
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
                <p className="text-red-800 text-sm font-medium">Duplicates Removed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Label htmlFor="output-filename">Output Filename</Label>
                  <Input
                    id="output-filename"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="urls.txt"
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={downloadFile}
                    className="flex items-center space-x-2"
                  >
                    <Download className="text-sm" />
                    <span>Download File</span>
                  </Button>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Ready to download! The file will contain {analysis.uniqueLines} unique URLs with all duplicates removed.
                </AlertDescription>
              </Alert>
            </div>

            {/* Preview of cleaned URLs */}
            {analysis.urls.length > 0 && (
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">Preview (First 10 URLs)</CardTitle>
                  <CardDescription>
                    Showing the first 10 unique URLs from your cleaned list
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {analysis.urls.slice(0, 10).map((url, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded">
                        <span className="text-slate-500 text-sm font-mono w-6">{index + 1}.</span>
                        <span className="text-slate-900 font-mono text-sm break-all">{url}</span>
                      </div>
                    ))}
                    {analysis.urls.length > 10 && (
                      <p className="text-slate-500 text-sm text-center py-2">
                        ... and {analysis.urls.length - 10} more URLs
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}