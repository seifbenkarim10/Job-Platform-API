export interface NormalizedJob {
  title: string;
  description: string;
  companyName: string;
  companyWebsite?: string;
  companyLogo?: string;
  location?: string;
  isRemote?: boolean;
  type?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applyUrl?: string;
  externalId: string;
  sourceName: string;
  postedAt?: Date;
  skills?: string[];
}
