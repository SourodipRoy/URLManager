import { resolvedUrls, type ResolvedUrl, type InsertResolvedUrl } from "@shared/schema";

export interface IStorage {
  resolveAndStoreUrl(originalUrl: string, resolvedUrl: string): Promise<ResolvedUrl>;
  getAllResolvedUrls(): Promise<ResolvedUrl[]>;
  clearAllResolvedUrls(): Promise<void>;
  checkUrlExists(resolvedUrl: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private resolvedUrls: Map<number, ResolvedUrl>;
  private currentId: number;

  constructor() {
    this.resolvedUrls = new Map();
    this.currentId = 1;
  }

  async resolveAndStoreUrl(originalUrl: string, resolvedUrl: string): Promise<ResolvedUrl> {
    const id = this.currentId++;
    const resolvedUrlEntry: ResolvedUrl = {
      id,
      originalUrl,
      resolvedUrl,
      timestamp: new Date(),
    };
    this.resolvedUrls.set(id, resolvedUrlEntry);
    return resolvedUrlEntry;
  }

  async getAllResolvedUrls(): Promise<ResolvedUrl[]> {
    return Array.from(this.resolvedUrls.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async clearAllResolvedUrls(): Promise<void> {
    this.resolvedUrls.clear();
  }

  async checkUrlExists(resolvedUrl: string): Promise<boolean> {
    const urlsArray = Array.from(this.resolvedUrls.values());
    return urlsArray.some(url => url.resolvedUrl === resolvedUrl);
  }
}

export const storage = new MemStorage();
