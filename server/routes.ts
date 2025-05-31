import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { urlResolveSchema } from "@shared/schema";
import { z } from "zod";

async function followRedirects(url: string, maxRedirects = 10): Promise<string> {
  let currentUrl = url;
  let redirectCount = 0;

  // Ensure URL has protocol
  if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
    currentUrl = 'https://' + currentUrl;
  }

  while (redirectCount < maxRedirects) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // If response is a redirect, follow it
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          // Handle relative URLs
          if (location.startsWith('/')) {
            const urlObj = new URL(currentUrl);
            currentUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
          } else if (location.startsWith('http')) {
            currentUrl = location;
          } else {
            // Handle relative paths
            const urlObj = new URL(currentUrl);
            currentUrl = new URL(location, urlObj.href).href;
          }
          redirectCount++;
          continue;
        }
      }

      // No more redirects, return current URL
      return currentUrl;
    } catch (error) {
      // If HEAD fails, try GET request
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            if (location.startsWith('/')) {
              const urlObj = new URL(currentUrl);
              currentUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
            } else if (location.startsWith('http')) {
              currentUrl = location;
            } else {
              const urlObj = new URL(currentUrl);
              currentUrl = new URL(location, urlObj.href).href;
            }
            redirectCount++;
            continue;
          }
        }

        return currentUrl;
      } catch (secondError) {
        throw new Error(`Failed to resolve URL: ${secondError instanceof Error ? secondError.message : 'Unknown error'}`);
      }
    }
  }

  throw new Error(`Too many redirects (max ${maxRedirects})`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Resolve URL endpoint
  app.post("/api/resolve-url", async (req, res) => {
    try {
      const { url } = urlResolveSchema.parse(req.body);
      
      const resolvedUrl = await followRedirects(url);
      const result = await storage.resolveAndStoreUrl(url, resolvedUrl);
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid URL format",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to resolve URL"
        });
      }
    }
  });

  // Get all resolved URLs
  app.get("/api/resolved-urls", async (req, res) => {
    try {
      const urls = await storage.getAllResolvedUrls();
      res.json(urls);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch resolved URLs"
      });
    }
  });

  // Clear all resolved URLs
  app.delete("/api/resolved-urls", async (req, res) => {
    try {
      await storage.clearAllResolvedUrls();
      res.json({ message: "All resolved URLs cleared" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to clear resolved URLs"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
