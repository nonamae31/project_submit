export interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardData {
  board: Board;
  columns: Column[];
}
