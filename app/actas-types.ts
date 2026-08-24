export type ActMember = {
  name: string;
  career: string;
  careerName: string;
  studentCode: string;
  dni: string;
  startDate: string;
};

export type ActJuror = {
  name: string;
  dni: string;
};

export type ActAdvisor = {
  name: string;
  dni: string;
};

export type ActGroup = {
  group: string;
  careerFolder: string;
  actNumber: string;
  faculty: string;
  title: string;
  hour: string;
  day: string;
  month: string;
  year: string;
  professionalTitle: string;
  members: ActMember[];
  advisor: ActAdvisor;
  jurors: [ActJuror, ActJuror];
};

export type GenerationBatchResponse = {
  ok: boolean;
  periodUrl?: string;
  results?: Array<{
    actNumber: string;
    careerFolder: string;
    wordUrl: string;
    pdfUrl: string;
  }>;
  error?: string;
};
