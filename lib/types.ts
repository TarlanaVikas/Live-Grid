export interface DocumentMeta {
  id: string;
  title: string;
  lastModified: number;
  ownerId: string;
  ownerName: string;
}

export interface CellData {
  value: string;
  formula?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    textColor?: string;
    bgColor?: string;
  };
}

export interface UserPresence {
  userId: string;
  displayName: string;
  color: string;
  lastSeen: number;
}

export const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
];
