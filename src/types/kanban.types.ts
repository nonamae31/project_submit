export interface Column {
  id: string;
  title: string;
  position: number;
  project_id: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  column_id: string;
  attachedFileUrl?: string;
  attachedFileName?: string;
  assignee?: string;
  assignee_email?: string;
  assignee_avatar_url?: string;
  project_id?: string;
  is_public?: boolean;
  ai_prompt?: string;
}

export interface BoardColumnType extends Column {
  tasks: Task[];
}

export interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  type: 'image' | 'video' | 'doc' | 'link' | 'text';
  content: string;
  cloudinary_public_id?: string;
  is_public: boolean;
  created_at?: string;
  approved_by?: string;
  approved_at?: string;
  // Bổ sung foreign key data
  ai_feedback?: any;
  approver?: {
    email: string;
  };
}
