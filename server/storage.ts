import { users, urls, chatMessages, leoQuestions, userContexts, contextUrls, contextChatMessages, type User, type InsertUser, type Url, type InsertUrl, type ChatMessage, type InsertChatMessage, type LeoQuestion, type InsertLeoQuestion, type UserContext, type ContextUrl, type ContextChatMessage } from "@shared/schema";
import { hashPassword } from "./auth";

export interface IStorage {
  // Initialization
  initialize(): Promise<void>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // URL methods
  getUrls(userId: number): Promise<Url[]>;
  createUrl(userId: number, url: InsertUrl): Promise<Url>;
  deleteUrl(id: number, userId: number): Promise<boolean>;
  updateUrlAnalysis(id: number, userId: number, analysis: any): Promise<Url | undefined>;
  updateUrlContent(id: number, userId: number, content: string): Promise<Url | undefined>;
  
  // Chat message methods
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(userId: number, message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(userId: number): Promise<void>;
  
  // Leo question methods
  getLeoQuestions(userId: number): Promise<LeoQuestion[]>;
  createLeoQuestion(userId: number, question: InsertLeoQuestion): Promise<LeoQuestion>;
  updateLeoQuestion(id: number, userId: number, answer: string): Promise<LeoQuestion | undefined>;
  
  // Admin methods
  getAllUsersWithStats(): Promise<Array<{
    user: User;
    urlCount: number;
    messageCount: number;
    questionCount: number;
  }>>;
  updateUserRole(userId: number, role: "user" | "admin"): Promise<User | undefined>;
  
  // Context methods
  getUserContext(userId: number): Promise<UserContext | undefined>;
  updateUserContext(userId: number, context: any): Promise<UserContext>;
  
  // Context-specific data methods (for pro mode)
  getContextUrls(userId: number, profileId: number): Promise<ContextUrl[]>;
  createContextUrl(userId: number, profileId: number, url: InsertUrl): Promise<ContextUrl>;
  getContextChatMessages(userId: number, profileId: number): Promise<ContextChatMessage[]>;
  createContextChatMessage(userId: number, profileId: number, message: InsertChatMessage): Promise<ContextChatMessage>;
  migrateDataToContext(userId: number, profileId: number): Promise<{ urls: number; messages: number }>;
  loadContextData(userId: number, profileId: number): Promise<{ urls: number; messages: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private urls: Map<number, Url>;
  private chatMessages: Map<number, ChatMessage>;
  private leoQuestions: Map<number, LeoQuestion>;
  private userContexts: Map<number, UserContext>;
  private currentUserId: number;
  private currentUrlId: number;
  private currentChatMessageId: number;
  private currentLeoQuestionId: number;
  private currentContextId: number;

  constructor() {
    this.users = new Map();
    this.urls = new Map();
    this.chatMessages = new Map();
    this.leoQuestions = new Map();
    this.userContexts = new Map();
    this.currentUserId = 1;
    this.currentUrlId = 1;
    this.currentChatMessageId = 1;
    this.currentLeoQuestionId = 1;
    this.currentContextId = 1;
  }

  async initialize() {
    // Create a default user for demo purposes
    await this.initializeDefaultUser();
  }

  private async initializeDefaultUser() {
    const hashedPassword = await hashPassword("password");
    this.createUser({ username: "alex", password: hashedPassword });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, role: "user", proMode: false };
    this.users.set(id, user);
    return user;
  }

  async getUrls(userId: number): Promise<Url[]> {
    return Array.from(this.urls.values())
      .filter(url => url.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createUrl(userId: number, insertUrl: InsertUrl): Promise<Url> {
    const id = this.currentUrlId++;
    const url: Url = {
      ...insertUrl,
      id,
      userId,
      title: insertUrl.title || null,
      notes: insertUrl.notes || null,
      content: null,
      analysis: null,
      createdAt: new Date(),
    };
    this.urls.set(id, url);
    return url;
  }

  async deleteUrl(id: number, userId: number): Promise<boolean> {
    const url = this.urls.get(id);
    if (url && url.userId === userId) {
      this.urls.delete(id);
      return true;
    }
    return false;
  }

  async updateUrlAnalysis(id: number, userId: number, analysis: any): Promise<Url | undefined> {
    const url = this.urls.get(id);
    if (url && url.userId === userId) {
      const updatedUrl: Url = {
        ...url,
        analysis,
      };
      this.urls.set(id, updatedUrl);
      return updatedUrl;
    }
    return undefined;
  }

  async updateUrlContent(id: number, userId: number, content: string): Promise<Url | undefined> {
    const url = this.urls.get(id);
    if (url && url.userId === userId) {
      const updatedUrl: Url = {
        ...url,
        content,
      };
      this.urls.set(id, updatedUrl);
      return updatedUrl;
    }
    return undefined;
  }

  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createChatMessage(userId: number, insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      userId,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async clearChatHistory(userId: number): Promise<void> {
    const userMessages = Array.from(this.chatMessages.entries())
      .filter(([_, message]) => message.userId === userId);
    
    userMessages.forEach(([id, _]) => {
      this.chatMessages.delete(id);
    });
  }

  async getLeoQuestions(userId: number): Promise<LeoQuestion[]> {
    return Array.from(this.leoQuestions.values())
      .filter(question => question.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createLeoQuestion(userId: number, insertQuestion: InsertLeoQuestion): Promise<LeoQuestion> {
    const id = this.currentLeoQuestionId++;
    const question: LeoQuestion = {
      ...insertQuestion,
      id,
      userId,
      status: "pending",
      answer: null,
      createdAt: new Date(),
      answeredAt: null,
    };
    this.leoQuestions.set(id, question);
    return question;
  }

  async updateLeoQuestion(id: number, userId: number, answer: string): Promise<LeoQuestion | undefined> {
    const question = this.leoQuestions.get(id);
    if (question && question.userId === userId) {
      const updatedQuestion: LeoQuestion = {
        ...question,
        status: "answered",
        answer,
        answeredAt: new Date(),
      };
      this.leoQuestions.set(id, updatedQuestion);
      return updatedQuestion;
    }
    return undefined;
  }

  async getAllUsersWithStats(): Promise<Array<{
    user: User;
    urlCount: number;
    messageCount: number;
    questionCount: number;
  }>> {
    return Array.from(this.users.values()).map(user => ({
      user,
      urlCount: Array.from(this.urls.values()).filter(url => url.userId === user.id).length,
      messageCount: Array.from(this.chatMessages.values()).filter(msg => msg.userId === user.id).length,
      questionCount: Array.from(this.leoQuestions.values()).filter(q => q.userId === user.id).length,
    }));
  }

  async updateUserRole(userId: number, role: "user" | "admin"): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser: User = { ...user, role };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getUserContext(userId: number): Promise<UserContext | undefined> {
    return Array.from(this.userContexts.values())
      .filter(context => context.userId === userId)
      .sort((a, b) => b.version - a.version)[0];
  }

  async updateUserContext(userId: number, context: any): Promise<UserContext> {
    const existingContext = await this.getUserContext(userId);
    const newVersion = (existingContext?.version || 0) + 1;
    
    const userContext: UserContext = {
      id: this.currentContextId++,
      userId,
      context,
      lastUpdated: new Date(),
      version: newVersion,
    };
    
    this.userContexts.set(userContext.id, userContext);
    return userContext;
  }

  // Context-specific data methods (for pro mode)
  async getContextUrls(userId: number, profileId: number): Promise<ContextUrl[]> {
    // For memory storage, we'll use the main URLs table
    const urls = await this.getUrls(userId);
    return urls.map(url => ({
      ...url,
      profileId,
    })) as ContextUrl[];
  }

  async createContextUrl(userId: number, profileId: number, url: InsertUrl): Promise<ContextUrl> {
    // For memory storage, we'll use the main URLs table
    const createdUrl = await this.createUrl(userId, url);
    return {
      ...createdUrl,
      profileId,
    } as ContextUrl;
  }

  async getContextChatMessages(userId: number, profileId: number): Promise<ContextChatMessage[]> {
    // For memory storage, we'll use the main chat messages table
    const messages = await this.getChatMessages(userId);
    return messages.map(message => ({
      ...message,
      profileId,
    })) as ContextChatMessage[];
  }

  async createContextChatMessage(userId: number, profileId: number, message: InsertChatMessage): Promise<ContextChatMessage> {
    // For memory storage, we'll use the main chat messages table
    const createdMessage = await this.createChatMessage(userId, message);
    return {
      ...createdMessage,
      profileId,
    } as ContextChatMessage;
  }

  async migrateDataToContext(userId: number, profileId: number): Promise<{ urls: number; messages: number }> {
    // For memory storage, no migration needed
    return { urls: 0, messages: 0 };
  }

  async loadContextData(userId: number, profileId: number): Promise<{ urls: number; messages: number }> {
    // For memory storage, return current data
    const urls = await this.getUrls(userId);
    const messages = await this.getChatMessages(userId);
    return { urls: urls.length, messages: messages.length };
  }
}

import { PostgresStorage } from "./postgres-storage";
import { createChromaStorage, type IChromaStorage } from "./chroma-storage";

// Factory function to create the appropriate storage instance
export function createStorage(): IStorage {
  // Use PostgreSQL if DATABASE_URL is available, otherwise use memory storage
  let baseStorage: IStorage;
  if (process.env.DATABASE_URL) {
    baseStorage = new PostgresStorage();
  } else {
    baseStorage = new MemStorage();
  }
  
  // Wrap with ChromaDB enhancement if ChromaDB is configured
  if (process.env.CHROMA_API_KEY) {
    return createChromaStorage(baseStorage);
  }
  
  return baseStorage;
}

export const storage = createStorage();
