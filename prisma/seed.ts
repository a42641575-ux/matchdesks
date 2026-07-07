import 'dotenv/config';
import crypto from 'node:crypto';
import { PrismaClient, type EmploymentType, type Province, type SalaryPeriod, type WorkArrangement } from '@prisma/client';

const prisma = new PrismaClient();

const REF_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function makeJobRef(): string {
  const bytes = crypto.randomBytes(6);
  let s = '';
  for (let i = 0; i < 6; i++) s += REF_CHARS[bytes[i] % REF_CHARS.length];
  return `MD-${s}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface CompanySeed {
  name: string;
  website: string;
  description: string;
  city: string;
  province: Province;
}

const COMPANIES: CompanySeed[] = [
  {
    name: 'Arctic Fox Software',
    website: 'https://arcticfoxsoftware.example.com',
    description: 'A product engineering studio building B2B SaaS tools for logistics and manufacturing.',
    city: 'Toronto',
    province: 'ON',
  },
  {
    name: 'Northwind Digital',
    website: 'https://northwinddigital.example.com',
    description: 'Full-service digital agency helping Canadian retailers grow online.',
    city: 'Vancouver',
    province: 'BC',
  },
  {
    name: 'Maple Grove Health Group',
    website: 'https://maplegrovehealth.example.com',
    description: 'A network of community clinics and long-term care homes across Ontario.',
    city: 'Ottawa',
    province: 'ON',
  },
  {
    name: 'Prairie Steel Works',
    website: 'https://prairiesteelworks.example.com',
    description: 'Structural steel fabrication and industrial welding for the energy sector.',
    city: 'Calgary',
    province: 'AB',
  },
  {
    name: 'Harbourfront Financial',
    website: 'https://harbourfrontfinancial.example.com',
    description: 'Independent wealth management and accounting firm serving Atlantic Canada.',
    city: 'Halifax',
    province: 'NS',
  },
  {
    name: 'Evergreen Logistics',
    website: 'https://evergreenlogistics.example.com',
    description: 'Cross-Canada freight, warehousing, and last-mile delivery network.',
    city: 'Mississauga',
    province: 'ON',
  },
  {
    name: 'Beacon Retail Co.',
    website: 'https://beaconretail.example.com',
    description: 'A fast-growing home goods retailer with stores across Western Canada.',
    city: 'Edmonton',
    province: 'AB',
  },
  {
    name: 'Summit Analytics',
    website: 'https://summitanalytics.example.com',
    description: 'Data and analytics consultancy for public sector and healthcare clients.',
    city: 'Ottawa',
    province: 'ON',
  },
  {
    name: 'Cascade Manufacturing',
    website: 'https://cascademanufacturing.example.com',
    description: 'Precision parts manufacturer supplying the aerospace and automotive industries.',
    city: 'Surrey',
    province: 'BC',
  },
  {
    name: 'Frontier Hospitality Group',
    website: 'https://frontierhospitality.example.com',
    description: 'Operates hotels and restaurants in major tourist destinations across Canada.',
    city: 'Victoria',
    province: 'BC',
  },
  {
    name: 'Blue Spruce Marketing',
    website: 'https://bluesprucemarketing.example.com',
    description: 'Boutique marketing agency specializing in brand strategy and paid media.',
    city: 'Montreal',
    province: 'QC',
  },
  {
    name: 'Lakeside Education Partners',
    website: 'https://lakesideeducation.example.com',
    description: 'Operates private tutoring centres and early-learning programs.',
    city: 'Winnipeg',
    province: 'MB',
  },
  {
    name: 'Redwood Engineering Co.',
    website: 'https://redwoodengineering.example.com',
    description: 'Civil and structural engineering consultancy for infrastructure projects.',
    city: 'Saskatoon',
    province: 'SK',
  },
  {
    name: 'Granite Peak Construction',
    website: 'https://granitepeakconstruction.example.com',
    description: 'General contractor delivering residential and commercial builds.',
    city: 'Regina',
    province: 'SK',
  },
];

interface JobTemplate {
  category: string;
  title: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: SalaryPeriod;
  aiScreeningUsed?: boolean;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
}

const TEMPLATES: JobTemplate[] = [
  {
    category: 'technology',
    title: 'Senior Full-Stack Developer',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 95000,
    salaryMax: 135000,
    salaryPeriod: 'YEARLY',
    aiScreeningUsed: true,
    summary: 'Own end-to-end features across our TypeScript/React frontend and Node.js backend, working closely with product and design.',
    responsibilities: [
      'Design and build new features across the stack, from database schema to UI',
      'Review pull requests and mentor intermediate developers',
      'Participate in on-call rotation and incident response',
      'Collaborate with product managers to scope and estimate work',
    ],
    qualifications: [
      '5+ years of professional software development experience',
      'Strong TypeScript, React, and Node.js skills',
      'Experience with relational databases (Postgres preferred)',
      'Comfortable working in an agile, fast-moving team',
    ],
  },
  {
    category: 'technology',
    title: 'DevOps Engineer',
    employmentType: 'FULL_TIME',
    workArrangement: 'REMOTE',
    salaryMin: 90000,
    salaryMax: 125000,
    salaryPeriod: 'YEARLY',
    summary: 'Own our cloud infrastructure, CI/CD pipelines, and observability stack as we scale.',
    responsibilities: [
      'Maintain and improve CI/CD pipelines across multiple services',
      'Manage cloud infrastructure using Infrastructure as Code',
      'Set up monitoring, alerting, and on-call runbooks',
      'Partner with engineering teams to improve deployment reliability',
    ],
    qualifications: [
      '3+ years in a DevOps, SRE, or platform engineering role',
      'Experience with AWS or GCP, Terraform, and Docker',
      'Familiarity with Kubernetes is an asset',
    ],
  },
  {
    category: 'technology',
    title: 'Junior Software Developer',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 62000,
    salaryMax: 78000,
    salaryPeriod: 'YEARLY',
    summary: 'Join our engineering team to build and ship features under the guidance of senior developers.',
    responsibilities: [
      'Implement well-scoped features and bug fixes',
      'Write unit and integration tests for your code',
      'Participate in code reviews and daily standups',
    ],
    qualifications: [
      '1-2 years of experience or a strong portfolio of personal/academic projects',
      'Working knowledge of JavaScript or Python',
      'Eagerness to learn and take feedback well',
    ],
  },
  {
    category: 'technology',
    title: 'Software Engineering Intern',
    employmentType: 'INTERNSHIP',
    workArrangement: 'HYBRID',
    salaryMin: 22,
    salaryMax: 28,
    salaryPeriod: 'HOURLY',
    summary: 'A 4-month internship building real features alongside our product engineering team.',
    responsibilities: [
      'Ship small features and fixes with mentorship from senior engineers',
      'Write documentation and tests for your changes',
      'Present your work at the end-of-term demo day',
    ],
    qualifications: [
      'Currently enrolled in a Computer Science or related program',
      'Some experience with a modern programming language',
    ],
  },
  {
    category: 'healthcare',
    title: 'Registered Nurse',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 38,
    salaryMax: 52,
    salaryPeriod: 'HOURLY',
    summary: 'Provide direct patient care in our community clinic, working as part of a collaborative care team.',
    responsibilities: [
      'Conduct patient assessments and administer treatments per care plans',
      'Maintain accurate patient records in our EMR system',
      'Educate patients and families on care plans and medication',
    ],
    qualifications: [
      'Current registration with the provincial College of Nurses',
      '2+ years of clinical experience',
      'Strong communication and organizational skills',
    ],
  },
  {
    category: 'healthcare',
    title: 'Licensed Practical Nurse',
    employmentType: 'PART_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 30,
    salaryMax: 38,
    salaryPeriod: 'HOURLY',
    summary: 'Support our long-term care team with day-to-day resident care on a part-time schedule.',
    responsibilities: [
      'Assist residents with daily living activities and medication administration',
      'Monitor and document resident health status',
      'Work closely with RNs and care aides',
    ],
    qualifications: ['Current LPN licensure', 'Experience in long-term care is an asset'],
  },
  {
    category: 'healthcare',
    title: 'Medical Office Administrator',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 42000,
    salaryMax: 52000,
    salaryPeriod: 'YEARLY',
    summary: 'Keep our clinic front desk running smoothly, from scheduling to billing.',
    responsibilities: [
      'Greet patients and manage appointment scheduling',
      'Process billing and insurance claims',
      'Maintain patient confidentiality per PIPEDA and clinic policy',
    ],
    qualifications: ['Medical office administration certificate or equivalent experience', 'Comfortable with EMR software'],
  },
  {
    category: 'skilled-trades',
    title: 'Red Seal Electrician',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 38,
    salaryMax: 48,
    salaryPeriod: 'HOURLY',
    summary: 'Perform electrical installation and maintenance work on commercial and industrial job sites.',
    responsibilities: [
      'Install, maintain, and repair electrical systems per code',
      'Read and interpret blueprints and schematics',
      'Supervise apprentices on site',
    ],
    qualifications: ['Red Seal certification required', "Valid driver's license", '5+ years of journeyman experience'],
  },
  {
    category: 'skilled-trades',
    title: 'Welder / Fabricator',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 28,
    salaryMax: 40,
    salaryPeriod: 'HOURLY',
    summary: 'Fabricate and weld structural steel components to engineering specifications.',
    responsibilities: [
      'Perform MIG/TIG welding on structural steel components',
      'Read blueprints and verify dimensional accuracy',
      'Maintain a safe, organized shop floor',
    ],
    qualifications: ['Journeyman welding ticket or equivalent experience', 'CWB certification an asset'],
  },
  {
    category: 'skilled-trades',
    title: 'HVAC Technician',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 30,
    salaryMax: 42,
    salaryPeriod: 'HOURLY',
    summary: 'Install, service, and repair residential and light commercial HVAC systems.',
    responsibilities: [
      'Diagnose and repair heating, ventilation, and air conditioning systems',
      'Perform scheduled maintenance visits',
      'Provide clear explanations of work to customers',
    ],
    qualifications: ['Provincial HVAC/gas fitter license', "Valid driver's license"],
  },
  {
    category: 'sales',
    title: 'Account Executive',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 55000,
    salaryMax: 80000,
    salaryPeriod: 'YEARLY',
    summary: 'Own the full sales cycle for mid-market accounts, from prospecting to close.',
    responsibilities: [
      'Build and manage a pipeline of qualified prospects',
      'Run product demos and negotiate contracts',
      'Collaborate with marketing on lead generation campaigns',
    ],
    qualifications: ['2+ years of B2B sales experience', 'Track record of meeting or exceeding quota'],
  },
  {
    category: 'sales',
    title: 'Retail Sales Associate',
    employmentType: 'PART_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 17,
    salaryMax: 20,
    salaryPeriod: 'HOURLY',
    summary: 'Deliver a great in-store experience for customers while supporting daily store operations.',
    responsibilities: ['Assist customers on the sales floor', 'Process transactions at the till', 'Help with merchandising and restocking'],
    qualifications: ['Previous retail experience is an asset', 'Weekend and evening availability'],
  },
  {
    category: 'sales',
    title: 'Business Development Representative',
    employmentType: 'FULL_TIME',
    workArrangement: 'REMOTE',
    salaryMin: 48000,
    salaryMax: 62000,
    salaryPeriod: 'YEARLY',
    aiScreeningUsed: true,
    summary: 'Generate and qualify new business opportunities for our account executive team.',
    responsibilities: ['Prospect via cold outreach, email, and LinkedIn', 'Qualify inbound leads', 'Book discovery calls for account executives'],
    qualifications: ['1+ years in an SDR/BDR or customer-facing role', 'Excellent written and verbal communication'],
  },
  {
    category: 'customer-service',
    title: 'Customer Support Representative',
    employmentType: 'FULL_TIME',
    workArrangement: 'REMOTE',
    salaryMin: 19,
    salaryMax: 23,
    salaryPeriod: 'HOURLY',
    aiScreeningUsed: true,
    summary: 'Help customers resolve issues over chat and email for our e-commerce platform.',
    responsibilities: ['Respond to customer inquiries via chat and email', 'Troubleshoot order and account issues', 'Escalate complex cases to the right team'],
    qualifications: ['1+ years in a customer-facing role', 'Comfortable working evenings/weekends on a rotating schedule'],
  },
  {
    category: 'customer-service',
    title: 'Call Centre Agent',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 38000,
    salaryMax: 46000,
    salaryPeriod: 'YEARLY',
    summary: 'Handle inbound customer calls for billing, account, and general inquiries.',
    responsibilities: ['Answer inbound calls and resolve customer issues on first contact', 'Log call details accurately', 'Meet quality and handle-time targets'],
    qualifications: ['Strong verbal communication skills', 'Prior call centre experience an asset'],
  },
  {
    category: 'finance-accounting',
    title: 'Staff Accountant',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 58000,
    salaryMax: 75000,
    salaryPeriod: 'YEARLY',
    summary: 'Support month-end close, reconciliations, and financial reporting for our growing firm.',
    responsibilities: ['Prepare journal entries and account reconciliations', 'Assist with month-end and year-end close', 'Support external audit requests'],
    qualifications: ['Accounting diploma or degree', 'CPA in progress an asset', '2+ years of accounting experience'],
  },
  {
    category: 'finance-accounting',
    title: 'Financial Analyst',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 68000,
    salaryMax: 95000,
    salaryPeriod: 'YEARLY',
    summary: 'Build financial models and reporting to support planning and investment decisions.',
    responsibilities: ['Build and maintain financial models', 'Prepare monthly variance analysis and reporting packages', 'Support budgeting and forecasting cycles'],
    qualifications: ['Degree in Finance, Accounting, or Economics', '3+ years in FP&A or related role', 'Advanced Excel skills'],
  },
  {
    category: 'finance-accounting',
    title: 'Bookkeeper',
    employmentType: 'PART_TIME',
    workArrangement: 'REMOTE',
    salaryMin: 24,
    salaryMax: 32,
    salaryPeriod: 'HOURLY',
    summary: 'Manage day-to-day bookkeeping for a portfolio of small business clients.',
    responsibilities: ['Reconcile bank and credit card statements', 'Process accounts payable and receivable', 'Prepare basic financial statements'],
    qualifications: ['Experience with QuickBooks Online', '2+ years of bookkeeping experience'],
  },
  {
    category: 'marketing',
    title: 'Digital Marketing Specialist',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 55000,
    salaryMax: 75000,
    salaryPeriod: 'YEARLY',
    summary: 'Plan and execute paid and organic campaigns across search, social, and email.',
    responsibilities: ['Manage paid search and social campaigns', 'Analyze campaign performance and report on KPIs', 'Coordinate with design on creative assets'],
    qualifications: ['2+ years in digital marketing', 'Experience with Google Ads and Meta Ads Manager'],
  },
  {
    category: 'marketing',
    title: 'Content Marketing Manager',
    employmentType: 'FULL_TIME',
    workArrangement: 'REMOTE',
    salaryMin: 65000,
    salaryMax: 90000,
    salaryPeriod: 'YEARLY',
    summary: 'Own our content strategy and editorial calendar across blog, social, and email.',
    responsibilities: ['Develop and execute a content calendar', 'Write and edit long-form content', 'Partner with SEO on keyword strategy'],
    qualifications: ['4+ years in content or editorial roles', 'Excellent writing and editing skills'],
  },
  {
    category: 'marketing',
    title: 'Marketing Coordinator (Contract)',
    employmentType: 'CONTRACT',
    workArrangement: 'HYBRID',
    salaryMin: 25,
    salaryMax: 32,
    salaryPeriod: 'HOURLY',
    summary: 'A 6-month contract supporting campaign execution and event coordination.',
    responsibilities: ['Coordinate marketing collateral and campaign assets', 'Support trade show and event logistics', 'Maintain the marketing content calendar'],
    qualifications: ['1-2 years of marketing experience', 'Strong organizational skills'],
  },
  {
    category: 'administrative',
    title: 'Executive Assistant',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 48000,
    salaryMax: 62000,
    salaryPeriod: 'YEARLY',
    summary: 'Provide high-level administrative support to our executive team.',
    responsibilities: ['Manage complex calendars and travel arrangements', 'Prepare correspondence, reports, and presentations', 'Coordinate board and leadership meetings'],
    qualifications: ['3+ years supporting senior executives', 'Excellent discretion and organizational skills'],
  },
  {
    category: 'administrative',
    title: 'Office Administrator',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 42000,
    salaryMax: 52000,
    salaryPeriod: 'YEARLY',
    summary: 'Keep our office running smoothly, from reception to vendor management.',
    responsibilities: ['Greet visitors and manage incoming calls', 'Order office supplies and manage vendor relationships', 'Support HR with onboarding logistics'],
    qualifications: ['2+ years in an office administration role', 'Proficient with Microsoft Office / Google Workspace'],
  },
  {
    category: 'hospitality-food-service',
    title: 'Line Cook',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 18,
    salaryMax: 24,
    salaryPeriod: 'HOURLY',
    summary: 'Prepare menu items to spec in a fast-paced kitchen environment.',
    responsibilities: ['Prepare and plate menu items to recipe specifications', 'Maintain a clean and organized station', 'Follow food safety and sanitation standards'],
    qualifications: ['Food safety certification', '1+ years of kitchen experience'],
  },
  {
    category: 'hospitality-food-service',
    title: 'Hotel Front Desk Agent',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 19,
    salaryMax: 23,
    salaryPeriod: 'HOURLY',
    summary: 'Deliver a warm welcome to guests and manage check-in/check-out operations.',
    responsibilities: ['Check guests in and out efficiently', 'Handle guest requests and resolve concerns', 'Process payments and reservations'],
    qualifications: ['Previous hospitality experience an asset', 'Strong customer service skills'],
  },
  {
    category: 'hospitality-food-service',
    title: 'Restaurant Server',
    employmentType: 'PART_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 16,
    salaryMax: 18,
    salaryPeriod: 'HOURLY',
    summary: 'Provide attentive table service in a busy downtown restaurant (plus tips).',
    responsibilities: ['Take orders and serve food and beverages', 'Provide menu recommendations to guests', 'Process payments at the end of service'],
    qualifications: ['Smart Serve certification', 'Availability for evenings and weekends'],
  },
  {
    category: 'education',
    title: 'Elementary School Teacher',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 52000,
    salaryMax: 85000,
    salaryPeriod: 'YEARLY',
    summary: 'Teach a full curriculum to a class of elementary students in a supportive school community.',
    responsibilities: ['Plan and deliver lessons aligned to the provincial curriculum', 'Assess student progress and communicate with parents', 'Participate in school events and staff meetings'],
    qualifications: ['Bachelor of Education degree', 'Valid provincial teaching certificate'],
  },
  {
    category: 'education',
    title: 'Tutoring Centre Instructor',
    employmentType: 'PART_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 24,
    salaryMax: 32,
    salaryPeriod: 'HOURLY',
    summary: 'Provide small-group tutoring in math and literacy for K-12 students.',
    responsibilities: ['Deliver small-group and one-on-one tutoring sessions', 'Track student progress and adjust lesson plans', 'Communicate progress updates to parents'],
    qualifications: ['Post-secondary education in progress or completed', 'Experience tutoring or teaching an asset'],
  },
  {
    category: 'warehouse-logistics',
    title: 'Warehouse Associate',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 19,
    salaryMax: 24,
    salaryPeriod: 'HOURLY',
    summary: 'Pick, pack, and ship customer orders accurately in a fast-paced distribution centre.',
    responsibilities: ['Pick and pack orders to meet daily targets', 'Operate warehouse equipment safely', 'Maintain accurate inventory counts'],
    qualifications: ['Ability to lift up to 23 kg repeatedly', 'Forklift certification an asset'],
  },
  {
    category: 'warehouse-logistics',
    title: 'Delivery Driver (Class 5)',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 22,
    salaryMax: 28,
    salaryPeriod: 'HOURLY',
    summary: 'Deliver customer orders on time and safely across the local metro area.',
    responsibilities: ['Load and deliver packages on an assigned route', 'Conduct pre- and post-trip vehicle inspections', 'Provide friendly, professional service to customers'],
    qualifications: ['Valid Class 5 driver\u2019s license with clean abstract', '1+ years of driving experience'],
  },
  {
    category: 'warehouse-logistics',
    title: 'Logistics Coordinator',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 52000,
    salaryMax: 68000,
    salaryPeriod: 'YEARLY',
    summary: 'Coordinate inbound and outbound freight to keep our supply chain running smoothly.',
    responsibilities: ['Schedule and track inbound/outbound shipments', 'Liaise with carriers and resolve delivery issues', 'Maintain shipping records and documentation'],
    qualifications: ['2+ years in logistics or supply chain', 'Strong Excel and communication skills'],
  },
  {
    category: 'engineering',
    title: 'Civil Engineer (EIT)',
    employmentType: 'FULL_TIME',
    workArrangement: 'HYBRID',
    salaryMin: 68000,
    salaryMax: 90000,
    salaryPeriod: 'YEARLY',
    summary: 'Support the design and delivery of municipal infrastructure projects.',
    responsibilities: ['Prepare civil design drawings and specifications', 'Support site inspections and contract administration', 'Coordinate with municipal stakeholders'],
    qualifications: ['Degree in Civil Engineering', 'EIT designation (or eligible)', 'Proficiency with AutoCAD Civil 3D'],
  },
  {
    category: 'engineering',
    title: 'Mechanical Design Engineer',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 75000,
    salaryMax: 105000,
    salaryPeriod: 'YEARLY',
    summary: 'Design precision mechanical components for aerospace and automotive clients.',
    responsibilities: ['Design components using SolidWorks/CAD', 'Run tolerance and stress analysis', 'Work with production to resolve manufacturability issues'],
    qualifications: ['Degree in Mechanical Engineering', 'P.Eng. or eligible', '3+ years of design experience'],
  },
  {
    category: 'engineering',
    title: 'Structural EIT',
    employmentType: 'FULL_TIME',
    workArrangement: 'ONSITE',
    salaryMin: 65000,
    salaryMax: 85000,
    salaryPeriod: 'YEARLY',
    summary: 'Support structural design for commercial and institutional building projects.',
    responsibilities: ['Perform structural calculations and modelling', 'Prepare drawings in collaboration with senior engineers', 'Support construction administration'],
    qualifications: ['Degree in Civil/Structural Engineering', 'EIT designation (or eligible)'],
  },
];

const AI_SCREENING_DETAILS =
  'Initial resume screening is assisted by an AI tool that ranks applicants against the posted qualifications. All shortlisting and hiring decisions are reviewed and made by a human member of our recruitment team.';

function buildDescription(t: JobTemplate, companyName: string, city: string): string {
  const responsibilities = t.responsibilities.map((r) => `- ${r}`).join('\n');
  const qualifications = t.qualifications.map((q) => `- ${q}`).join('\n');
  return [
    `${companyName} is hiring a ${t.title} based in ${city}. ${t.summary}`,
    `What you'll do:\n${responsibilities}`,
    `What you bring:\n${qualifications}`,
    `${companyName} is an equal opportunity employer and welcomes applications from all qualified candidates.`,
  ].join('\n\n');
}

async function main() {
  console.log('Seeding companies...');
  const companyRecords = [];
  for (const c of COMPANIES) {
    const slug = slugify(c.name);
    const company = await prisma.company.upsert({
      where: { slug },
      update: {},
      create: {
        name: c.name,
        slug,
        website: c.website,
        description: c.description,
        city: c.city,
        province: c.province,
      },
    });
    companyRecords.push(company);
  }
  console.log(`Upserted ${companyRecords.length} companies.`);

  console.log('Seeding jobs...');
  const usedSlugs = new Set<string>();
  let created = 0;

  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    const company = pick(companyRecords, i * 3 + 1);

    const useRemoteCity = t.workArrangement === 'REMOTE' && Math.random() < 0.5;
    const city = useRemoteCity ? null : company.city;
    const province = useRemoteCity ? null : company.province;

    const baseSlug = slugify(`${t.title}-${company.name}`);
    let slug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    usedSlugs.add(slug);

    const postedDaysAgo = randomInt(0, 21);
    const postedAt = new Date();
    postedAt.setDate(postedAt.getDate() - postedDaysAgo);

    const expiresAt = new Date(postedAt);
    expiresAt.setDate(expiresAt.getDate() + 45);

    await prisma.job.create({
      data: {
        title: t.title,
        slug,
        publicRef: makeJobRef(),
        description: buildDescription(t, company.name, city ?? 'Canada (Remote)'),
        companyId: company.id,
        category: t.category,
        employmentType: t.employmentType,
        workArrangement: t.workArrangement,
        city,
        province,
        salaryMin: t.salaryMin,
        salaryMax: t.salaryMax,
        salaryPeriod: t.salaryPeriod,
        currency: 'CAD',
        aiScreeningUsed: Boolean(t.aiScreeningUsed),
        aiScreeningDetails: t.aiScreeningUsed ? AI_SCREENING_DETAILS : null,
        ...(Math.random() < 0.5
          ? { applyEmail: `careers@${slugify(company.name)}.example.com`, applyUrl: null }
          : { applyUrl: `${company.website}/careers/${slug}`, applyEmail: null }),
        source: 'NATIVE',
        status: 'ACTIVE',
        postedAt,
        expiresAt,
      },
    });
    created++;
  }

  console.log(`Created ${created} jobs.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
