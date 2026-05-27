// In-memory mock database for VITE_USE_MOCKS mode. Seeded with realistic
// clinical-genetics data. Case/batch status advances on a timer so the polling
// UI is fully exercisable offline.
import type {
  User, Case, Diagnosis, Syndrome, HpoTerm, Plan, Notification,
  Batch, BatchItem, Subscription,
} from '../lib/api/types';

const uuid = () =>
  (crypto.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }));

const now = () => new Date().toISOString();

// ── Seed: syndromes + HPO ────────────────────────────────────────────────────
export const syndromes: Syndrome[] = [
  { id: uuid(), name: 'Noonan syndrome', omim_id: '163950', inheritance: 'Autosomal dominant', prevalence: '1 in 1,000–2,500', description: 'A RASopathy characterized by short stature, congenital heart defects, and distinctive facial features.', created_at: now() },
  { id: uuid(), name: 'Williams syndrome', omim_id: '194050', inheritance: 'Autosomal dominant', prevalence: '1 in 7,500–10,000', description: 'A contiguous gene deletion syndrome with cardiovascular disease, distinctive facies, and a characteristic cognitive profile.', created_at: now() },
  { id: uuid(), name: 'Kabuki syndrome', omim_id: '147920', inheritance: 'Autosomal dominant', prevalence: '1 in 32,000', description: 'A congenital disorder with distinctive facial features, skeletal anomalies, and intellectual disability.', created_at: now() },
  { id: uuid(), name: 'CHARGE syndrome', omim_id: '214800', inheritance: 'Autosomal dominant', prevalence: '1 in 8,500–10,000', description: 'A pattern of congenital anomalies including coloboma, heart defects, atresia of the choanae, and ear abnormalities.', created_at: now() },
  { id: uuid(), name: 'Cornelia de Lange syndrome', omim_id: '122470', inheritance: 'Autosomal dominant', prevalence: '1 in 10,000–30,000', description: 'A multisystem developmental disorder with distinctive facial features, growth retardation, and limb defects.', created_at: now() },
  { id: uuid(), name: 'Rubinstein–Taybi syndrome', omim_id: '180849', inheritance: 'Autosomal dominant', prevalence: '1 in 100,000–125,000', description: 'Characterized by broad thumbs and toes, distinctive facial features, and intellectual disability.', created_at: now() },
  { id: uuid(), name: 'Smith–Magenis syndrome', omim_id: '182290', inheritance: 'Autosomal dominant', prevalence: '1 in 15,000–25,000', description: 'A disorder with intellectual disability, sleep disturbance, and a recognizable behavioral phenotype.', created_at: now() },
  { id: uuid(), name: 'Costello syndrome', omim_id: '218040', inheritance: 'Autosomal dominant', prevalence: '1 in 300,000', description: 'A RASopathy with failure to thrive, coarse facial features, and increased tumor risk.', created_at: now() },
];

export const hpoTerms: HpoTerm[] = [
  { id: uuid(), hpo_id: 'HP:0000316', name: 'Hypertelorism', definition: 'Interpupillary distance more than 2 SD above the mean.' },
  { id: uuid(), hpo_id: 'HP:0000463', name: 'Anteverted nares', definition: 'Anteriorly-facing nostrils viewed with the head in the Frankfurt horizontal.' },
  { id: uuid(), hpo_id: 'HP:0000601', name: 'Hypotonic facies', definition: 'A facial appearance characteristic of muscular hypotonia.' },
  { id: uuid(), hpo_id: 'HP:0000286', name: 'Epicanthus', definition: 'A fold of skin starting above the medial aspect of the upper eyelid.' },
  { id: uuid(), hpo_id: 'HP:0009748', name: 'Downslanted palpebral fissures', definition: 'The palpebral fissure inclination is more than 2 SD below the mean.' },
  { id: uuid(), hpo_id: 'HP:0000322', name: 'Short philtrum', definition: 'Distance between nasal base and midline upper lip vermilion border more than 2 SD below the mean.' },
  { id: uuid(), hpo_id: 'HP:0000175', name: 'Cleft palate', definition: 'A developmental defect of the palate resulting from a failure of fusion.' },
  { id: uuid(), hpo_id: 'HP:0000252', name: 'Microcephaly', definition: 'Occipitofrontal head circumference more than 2 SD below the mean.' },
];

const SYNDROME_NAMES = syndromes.map((s) => ({ id: s.id, name: s.name }));

function makeDiagnoses(caseId: string): Diagnosis[] {
  // A descending random posterior over a few syndromes.
  const picks = [...SYNDROME_NAMES].sort(() => Math.random() - 0.5).slice(0, 6);
  let remaining = 1;
  return picks.map((s, i) => {
    const conf = i === picks.length - 1 ? remaining : +(remaining * (0.45 + Math.random() * 0.25)).toFixed(2);
    remaining = Math.max(0.02, +(remaining - conf).toFixed(2));
    return {
      id: uuid(), case_id: caseId, syndrome_id: s.id, syndrome_name: s.name,
      confidence: conf, rank: i + 1, created_at: now(),
    };
  }).sort((a, b) => b.confidence - a.confidence).map((d, i) => ({ ...d, rank: i + 1 }));
}

// ── Seed: plans ───────────────────────────────────────────────────────────────
export const plans: Plan[] = [
  { id: uuid(), name: 'bronze', monthly_limit: 40, overage_price_cents: 5000, created_at: now() },
  { id: uuid(), name: 'silver', monthly_limit: 150, overage_price_cents: 4000, created_at: now() },
  { id: uuid(), name: 'gold', monthly_limit: 500, overage_price_cents: 3000, created_at: now() },
];

// ── Mutable state ─────────────────────────────────────────────────────────────
interface CaseRecord extends Case { confirmedAt?: number; diagnoses?: Diagnosis[] }
interface BatchRecord { batch: Batch; items: BatchItem[]; confirmedAt: number }

const PROCESS_MS = 4000; // pending→processing is immediate; →completed after this.

export const db = {
  users: [] as User[],
  passwords: new Map<string, string>(), // email -> password
  cases: [] as CaseRecord[],
  notifications: [] as Notification[],
  batches: [] as BatchRecord[],
  subscriptions: [] as Subscription[],

  seedDemoUser() {
    if (this.users.length) return;
    const doctor: User = { id: uuid(), email: 'doctor@phenograph.test', role: 'doctor', name: 'Dr. E. Okafor', organization: "Boston Children's · Clinical Genetics" };
    const lab: User = { id: uuid(), email: 'lab@phenograph.test', role: 'lab', name: 'Helix Diagnostics', organization: 'Helix Diagnostics Lab' };
    this.users.push(doctor, lab);
    this.passwords.set(doctor.email, 'password');
    this.passwords.set(lab.email, 'password');
    // A couple of seed cases for the doctor.
    const seedCases: Array<Partial<Case>> = [
      { patient_name: 'Patient 0481', patient_age: 4, patient_ethnicity: 'European' },
      { patient_name: 'Patient 0480', patient_age: 11, patient_ethnicity: 'East Asian' },
    ];
    seedCases.forEach((sc, i) => {
      const id = uuid();
      this.cases.push({
        id, user_id: doctor.id, patient_name: sc.patient_name ?? null,
        patient_age: sc.patient_age ?? null, patient_ethnicity: sc.patient_ethnicity ?? null,
        image_key: `seed/${id}.jpg`, status: 'completed',
        created_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
        updated_at: now(), confirmedAt: Date.now() - 100000, diagnoses: makeDiagnoses(id),
      });
    });
    this.notifications.push({
      id: uuid(), user_id: doctor.id, type: 'analysis_complete',
      title: 'Analysis complete', body: 'Case 0481 finished processing with 6 candidate syndromes.',
      read: false, created_at: now(), metadata: null,
    });
  },

  findUserByEmail(email: string) { return this.users.find((u) => u.email === email); },
  findUserById(id: string) { return this.users.find((u) => u.id === id); },

  // Lazily advance a case's status based on elapsed time since confirm-upload.
  resolveCase(c: CaseRecord): CaseRecord {
    if (c.confirmedAt && c.status !== 'completed' && c.status !== 'failed') {
      const elapsed = Date.now() - c.confirmedAt;
      if (elapsed >= PROCESS_MS) {
        c.status = 'completed';
        c.updated_at = now();
        if (!c.diagnoses) c.diagnoses = makeDiagnoses(c.id);
        this.notifications.push({
          id: uuid(), user_id: c.user_id, type: 'analysis_complete',
          title: 'Analysis complete',
          body: `Case for ${c.patient_name ?? 'patient'} finished processing.`,
          read: false, created_at: now(), metadata: { case_id: c.id },
        });
      } else {
        c.status = 'processing';
      }
    }
    return c;
  },

  resolveBatch(b: BatchRecord): BatchRecord {
    const elapsed = Date.now() - b.confirmedAt;
    const done = Math.min(b.items.length, Math.floor((elapsed / PROCESS_MS) * b.items.length));
    b.items.forEach((it, i) => {
      it.status = i < done ? 'completed' : 'processing';
      if (i < done && !it.case_id) {
        // Each finished item produces a result-bearing case (owned by the lab),
        // mirroring the real flow where BatchItem.case_id → GET /cases/{id}.
        const caseId = uuid();
        this.cases.push({
          id: caseId, user_id: b.batch.lab_id, patient_name: null,
          patient_age: null, patient_ethnicity: null, image_key: it.image_key,
          status: 'completed', created_at: now(), updated_at: now(),
          confirmedAt: Date.now() - PROCESS_MS, diagnoses: makeDiagnoses(caseId),
        });
        it.case_id = caseId;
      }
    });
    b.batch.processed_items = done;
    b.batch.status = done >= b.items.length ? 'completed' : 'processing';
    b.batch.updated_at = now();
    return b;
  },
};

export { uuid, now, makeDiagnoses };
