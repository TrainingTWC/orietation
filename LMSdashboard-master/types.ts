
export interface EmployeeTrainingRecord {
  employee_code: string;
  employee_name: string;
  email: string;
  employee_status: string;
  gender: string;
  date_of_joining: string;
  department: string;
  designation: string;
  reporting_manager_code: string;
  reporting_manager_name: string;
  course_category: string;
  course_name: string;
  course_type: string;
  course_end_date: string;
  enrollment_status: string;
  course_completion_hours: number;
  course_enrolment_date: string;
  course_completion_date: string;
  course_progress: number;
  course_completion_status: 'Completed' | 'Not Completed';
  'Store ID'?: string;
}

export interface StoreRecord {
    'Store ID': string;
    location: string;
    Region: string;
    AM: string;
    Trainer: string;
    'Regional Training Manager'?: string;
    'E-Learning Specialist'?: string;
    'Training Head'?: string;
    'HR Head'?: string;
}

export type MergedData = EmployeeTrainingRecord & Omit<StoreRecord, 'Store ID'>;
