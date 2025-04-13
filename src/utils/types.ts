interface ITeacherGuardian {
  facultyName?: string;
  facultyId?: string;
}

export interface IStudent {
  name: string;
  department: string;
  email: string;
  crn?: string;
  urn: string;
  password: string;
  semester: string;
  section: string;
  isDetailsFilled?: boolean;
  isVerified?: boolean;
  TG?: ITeacherGuardian;
}
