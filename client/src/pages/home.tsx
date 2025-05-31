import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Link, Copy, Download, Clipboard, ExternalLink, Save, Shield } from "lucide-react";
import type { ResolvedUrl } from "@shared/schema";

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [filename, setFilename] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resolved URLs
  const { data: resolvedUrls = [], isLoading: isLoadingUrls } = useQuery<ResolvedUrl[]>({
    queryKey: ["/api/resolved-urls"],
  });

  // Resolve URL mutation
  const resolveUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/resolve-url", { url });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolved-urls"] });
      setUrlInput("");
      toast({
        title: "Success",
        description: "URL resolved successfully!",
      });
    },
    onError: (error: any) => {
      // Handle duplicate URL case
      if (error.status === 409) {
        toast({
          title: "URL already exists",
          description: "This URL has already been resolved and is in your list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to resolve URL. Please check the URL and try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Clear URLs mutation
  const clearUrlsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/resolved-urls");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resolved-urls"] });
    },
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(text);
      if (text.trim()) {
        resolveUrlMutation.mutate(text.trim());
      }
      toast({
        title: "Success",
        description: "URL pasted from clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to read from clipboard",
        variant: "destructive",
      });
    }
  };

  const handleResolveUrl = () => {
    if (urlInput.trim()) {
      resolveUrlMutation.mutate(urlInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && urlInput.trim()) {
      handleResolveUrl();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const downloadResolvedUrls = () => {
    if (resolvedUrls.length === 0) {
      toast({
        title: "Error",
        description: "No URLs to download",
        variant: "destructive",
      });
      return;
    }

    const downloadFilename = filename.trim() || "links.txt";
    const content = resolvedUrls.map(link => link.resolvedUrl).join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Clear the list after download
    clearUrlsMutation.mutate();
    setFilename("");

    toast({
      title: "Success",
      description: `Downloaded ${resolvedUrls.length} URLs`,
    });
  };

  const getTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">URL Resolver</h1>
        <p className="text-slate-600 mt-2">Unshorten and resolve redirected links instantly</p>
      </div>

      <div className="space-y-8">
        {/* Link Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enter URL to Resolve</CardTitle>
            <CardDescription>
              Paste or enter any shortened or redirecting URL to resolve its final destination.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://bit.ly/example or any redirecting URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-slate-900 placeholder-slate-500"
                />
              </div>
              <Button
                onClick={handlePaste}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <Clipboard className="text-sm" />
                <span>Paste</span>
              </Button>
            </div>

            {resolveUrlMutation.isPending && (
              <div className="flex items-center space-x-3 text-slate-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                <span className="text-sm">Resolving URL...</span>
              </div>
            )}

            {resolveUrlMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {resolveUrlMutation.error?.message || "Error resolving URL. Please check the URL and try again."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Resolved Links Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resolved URLs</CardTitle>
                <CardDescription>Your resolved links are automatically saved locally</CardDescription>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {resolvedUrls.length} URLs
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUrls ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-4 p-4 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : resolvedUrls.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <Link className="text-4xl mx-auto" />
                </div>
                <h3 className="text-slate-600 font-medium mb-2">No URLs resolved yet</h3>
                <p className="text-slate-500 text-sm">Start by entering or pasting a URL above to resolve it.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedUrls.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-mono text-sm break-all">{link.resolvedUrl}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        Resolved {getTimeAgo(link.timestamp)}
                      </p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(link.resolvedUrl)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="text-sm" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export to File</CardTitle>
            <CardDescription>
              Download all resolved URLs as a text file. The list will be cleared after download.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  type="text"
                  placeholder="links.txt"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={downloadResolvedUrls}
                  disabled={resolvedUrls.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Download className="text-sm" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <ExternalLink className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Note:</strong> Downloading will clear your current list of resolved URLs. Make sure you're ready to export before clicking download.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Feature Info */}
        <Card className="bg-gradient-to-r from-primary/5 to-blue-50 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <ExternalLink className="text-primary text-lg" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Auto-Resolution</h3>
                <p className="text-slate-600 text-sm">Automatically follows redirects to find the final destination URL</p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Save className="text-primary text-lg" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Local Storage</h3>
                <p className="text-slate-600 text-sm">Your resolved URLs are saved locally and persist across browser sessions</p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="text-primary text-lg" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Privacy First</h3>
                <p className="text-slate-600 text-sm">Everything runs in your browser - no data is sent to external servers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
