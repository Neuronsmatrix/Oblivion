-- Reference service seed data
-- 50 genetic syndromes (UUIDs match Uuid::from_u128(1..=50) used by recognition service)
-- 100 HPO terms with real HP: identifiers
-- syndrome_hpo linkage table rows

-- ─────────────────────────────────────────────────────────────────────────────
-- Syndromes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO reference.syndromes (id, name, omim_id, description, prevalence, inheritance) VALUES
('00000000-0000-0000-0000-000000000001', 'Down Syndrome',                   '190685', 'Trisomy of chromosome 21 causing intellectual disability, characteristic facial features, and variable medical complications including congenital heart defects.',                                          '1:700 births',       'Chromosomal'),
('00000000-0000-0000-0000-000000000002', 'Turner Syndrome',                 '313000', 'Complete or partial monosomy of the X chromosome in females, characterised by short stature, gonadal dysgenesis, and cardiovascular anomalies.',                                                           '1:2500 females',     'Chromosomal'),
('00000000-0000-0000-0000-000000000003', 'Noonan Syndrome',                 '163950', 'RASopathy caused predominantly by PTPN11 variants; features include short stature, congenital heart defects, distinctive facial features, and coagulation defects.',                                      '1:1000-2500',        'Autosomal dominant'),
('00000000-0000-0000-0000-000000000004', 'Williams Syndrome',               '194050', 'Microdeletion at 7q11.23 encompassing the elastin gene; characterised by supravalvular aortic stenosis, intellectual disability, hypercalcaemia, and a distinctive elfin facies.',                        '1:7500',             'Chromosomal'),
('00000000-0000-0000-0000-000000000005', 'Angelman Syndrome',               '105830', 'Caused by loss of function of the maternally inherited UBE3A allele; features include severe intellectual disability, seizures, absent speech, and a happy demeanour.',                                    '1:12000-20000',      'Imprinting / maternal'),
('00000000-0000-0000-0000-000000000006', 'Prader-Willi Syndrome',           '176270', 'Loss of paternal 15q11-q13 expression; characterised by neonatal hypotonia, hyperphagia leading to obesity, short stature, and mild intellectual disability.',                                            '1:10000-30000',      'Imprinting / paternal'),
('00000000-0000-0000-0000-000000000007', 'Cornelia de Lange Syndrome',      '122470', 'Caused mainly by NIPBL variants; features include growth retardation, limb anomalies, intellectual disability, and a distinctive facial appearance with synophrys.',                                      '1:10000-30000',      'Autosomal dominant'),
('00000000-0000-0000-0000-000000000008', 'Kabuki Syndrome',                 '147920', 'Caused by variants in KMT2D or KDM6A; characterised by intellectual disability, postnatal growth retardation, skeletal anomalies, and a distinctive facial gestalt.',                                     '1:32000',            'Autosomal dominant'),
('00000000-0000-0000-0000-000000000009', 'Rubinstein-Taybi Syndrome',       '180849', 'Caused by CREBBP or EP300 variants; features include broad thumbs and halluces, intellectual disability, short stature, and characteristic facial features.',                                             '1:125000',           'Autosomal dominant'),
('00000000-0000-0000-0000-00000000000a', 'Treacher Collins Syndrome',       '154500', 'Caused by TCOF1, POLR1C, or POLR1D variants; characterised by bilateral hypoplasia of the facial bones, microtia, and conductive hearing loss with normal intelligence.',                                 '1:50000',            'Autosomal dominant'),
('00000000-0000-0000-0000-00000000000b', 'Marfan Syndrome',                 '154700', 'FBN1 variant causing connective tissue disorder with tall stature, arachnodactyly, lens dislocation, and aortic root dilatation at risk of dissection.',                                                  '1:5000-10000',       'Autosomal dominant'),
('00000000-0000-0000-0000-00000000000c', 'Ehlers-Danlos Syndrome',          '130000', 'Heterogeneous group of connective tissue disorders caused by collagen biosynthesis defects; features include skin hyperextensibility, joint hypermobility, and vascular fragility.',                      '1:5000',             'Autosomal dominant / recessive'),
('00000000-0000-0000-0000-00000000000d', 'Fragile X Syndrome',              '300624', 'CGG trinucleotide repeat expansion in FMR1; the most common inherited cause of intellectual disability; features include macroorchidism, prominent ears, and autism spectrum traits.',                   '1:4000 males',       'X-linked dominant'),
('00000000-0000-0000-0000-00000000000e', 'Rett Syndrome',                   '312750', 'MECP2 loss-of-function in females; characterised by regression of hand use after a period of normal development, stereotypic hand-wringing, and acquired microcephaly.',                                  '1:10000-15000 girls', 'X-linked dominant'),
('00000000-0000-0000-0000-00000000000f', 'Apert Syndrome',                  '101200', 'FGFR2 variant causing craniosynostosis, midface hypoplasia, and symmetric complex syndactyly of hands and feet.',                                                                                         '1:65000',            'Autosomal dominant'),
('00000000-0000-0000-0000-000000000010', 'Crouzon Syndrome',                '123500', 'FGFR2 variant causing craniosynostosis and midface hypoplasia without limb anomalies; associated with proptosis and conductive hearing loss.',                                                             '1:25000',            'Autosomal dominant'),
('00000000-0000-0000-0000-000000000011', 'DiGeorge Syndrome',               '188400', '22q11.2 deletion causing conotruncal heart defects, palatal anomalies, immunodeficiency, hypocalcaemia, and variable cognitive impairment.',                                                              '1:4000',             'Chromosomal'),
('00000000-0000-0000-0000-000000000012', 'Wolf-Hirschhorn Syndrome',        '194190', '4p16.3 deletion characterised by a "Greek warrior helmet" facies, severe intellectual disability, growth retardation, and seizures.',                                                                     '1:50000',            'Chromosomal'),
('00000000-0000-0000-0000-000000000013', 'Cri du Chat Syndrome',            '123450', '5p deletion characterised by a high-pitched cat-like cry in infancy, severe intellectual disability, microcephaly, and hypertelorism.',                                                                   '1:20000-50000',      'Chromosomal'),
('00000000-0000-0000-0000-000000000014', 'Patau Syndrome',                  '264480', 'Trisomy 13 causing severe intellectual disability, polydactyly, holoprosencephaly, midline facial defects, and congenital heart disease; usually lethal in the first year.',                             '1:10000 births',     'Chromosomal'),
('00000000-0000-0000-0000-000000000015', 'Edwards Syndrome',                '601161', 'Trisomy 18 with severe intellectual disability, clenched fists with overlapping fingers, congenital heart disease, and rocker-bottom feet; high neonatal mortality.',                                    '1:5000 births',      'Chromosomal'),
('00000000-0000-0000-0000-000000000016', 'Klinefelter Syndrome',            '400045', '47,XXY karyotype in males causing hypergonadotropic hypogonadism, tall stature, infertility, gynecomastia, and variable learning difficulties.',                                                          '1:650 males',        'Chromosomal'),
('00000000-0000-0000-0000-000000000017', 'Sotos Syndrome',                  '117550', 'NSD1 haploinsufficiency causing cerebral gigantism, overgrowth in early childhood, advanced bone age, intellectual disability, and a distinctive facial gestalt.',                                        '1:14000',            'Autosomal dominant'),
('00000000-0000-0000-0000-000000000018', 'Beckwith-Wiedemann Syndrome',     '130650', 'Overgrowth syndrome caused by dysregulation of 11p15.5 imprinted genes; features include macroglossia, omphalocele, hemihyperplasia, and predisposition to embryonal tumours.',                         '1:10340',            'Imprinting / variable'),
('00000000-0000-0000-0000-000000000019', 'Russell-Silver Syndrome',         '180860', 'Growth restriction disorder, often caused by hypomethylation of 11p15.5 or maternal UPD7; features include prenatal growth retardation, relative macrocephaly, and body asymmetry.',                    '1:30000-100000',     'Imprinting / variable'),
('00000000-0000-0000-0000-00000000001a', 'Stickler Syndrome',               '108300', 'Collagen disorder caused by COL2A1, COL11A1, or COL11A2 variants; features include myopia, retinal detachment, sensorineural hearing loss, and arthropathy.',                                            '1:7500-9000',        'Autosomal dominant'),
('00000000-0000-0000-0000-00000000001b', 'Waardenburg Syndrome',            '193500', 'Caused by PAX3, MITF, SOX10, EDNRB, or EDN3 variants; features include congenital sensorineural hearing loss, dystopia canthorum, and pigmentation anomalies of skin, hair, and iris.',                 '1:42000',            'Autosomal dominant'),
('00000000-0000-0000-0000-00000000001c', 'Coffin-Siris Syndrome',           '135900', 'Caused by BAF complex subunit variants (ARID1B most commonly); features include intellectual disability, coarse facial features, and absent/hypoplastic fifth fingernails.',                              'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000001d', 'Floating-Harbor Syndrome',        '136140', 'SRCAP variant causing short stature, delayed bone age, intellectual disability, and a characteristic facial appearance with a triangular face and deep-set eyes.',                                        'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000001e', 'KBG Syndrome',                    '148050', 'ANKRD11 variant causing short stature, macrodontia, skeletal anomalies, and intellectual disability with a characteristic but variable facial gestalt.',                                                  '1:1000000',          'Autosomal dominant'),
('00000000-0000-0000-0000-00000000001f', 'Mowat-Wilson Syndrome',           '235730', 'ZEB2 loss-of-function causing severe intellectual disability, epilepsy, Hirschsprung disease, and characteristic facial features including deep-set eyes.',                                               'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-000000000020', 'Phelan-McDermid Syndrome',        '606232', '22q13.3 deletion or SHANK3 variant causing global developmental delay, absent or minimal speech, hypotonia, and autistic behaviour.',                                                                    '1:5000-10000',       'Chromosomal / dominant'),
('00000000-0000-0000-0000-000000000021', 'Costello Syndrome',               '218040', 'HRAS gain-of-function RASopathy causing coarse facial features, redundant skin, intellectual disability, cardiac defects, and predisposition to papillomata and malignancy.',                            '1:300000-1250000',   'Autosomal dominant'),
('00000000-0000-0000-0000-000000000022', 'Cardiofaciocutaneous Syndrome',   '115150', 'RASopathy caused by BRAF, MAP2K1/2, or KRAS variants; features include congenital heart defects, ectodermal anomalies, distinctive facies, and intellectual disability.',                                '1:810000',           'Autosomal dominant'),
('00000000-0000-0000-0000-000000000023', 'CHARGE Syndrome',                 '214800', 'CHD7 loss-of-function causing Coloboma, Heart defects, Atresia choanae, Retardation of growth, Genital anomalies, and Ear anomalies/deafness.',                                                         '1:10000-15000',      'Autosomal dominant'),
('00000000-0000-0000-0000-000000000024', 'Jacobsen Syndrome',               '147791', '11q24.1 deletion characterised by intellectual disability, thrombocytopaenia, and a characteristic facial appearance with trigonocephaly.',                                                               '1:100000',           'Chromosomal'),
('00000000-0000-0000-0000-000000000025', 'Smith-Magenis Syndrome',          '182290', '17p11.2 deletion or RAI1 variant; features include intellectual disability, self-injurious behaviour, sleep disturbance due to inverted melatonin rhythm, and a characteristic facies.',                  '1:15000-25000',      'Chromosomal / dominant'),
('00000000-0000-0000-0000-000000000026', 'Potocki-Lupski Syndrome',         '610883', '17p11.2 duplication (reciprocal of Smith-Magenis); features include hypotonia, autism spectrum disorder, cardiovascular anomalies, and intellectual disability.',                                         '1:20000',            'Chromosomal'),
('00000000-0000-0000-0000-000000000027', 'Kleefstra Syndrome',              '610253', '9q34 deletion or EHMT1 variant causing intellectual disability, childhood hypotonia, autistic behaviour, and a characteristic facial gestalt.',                                                           '1:200000',           'Chromosomal / dominant'),
('00000000-0000-0000-0000-000000000028', 'Koolen-de Vries Syndrome',        '610443', '17q21.31 deletion or KANSL1 variant; features include intellectual disability, friendly behaviour, epilepsy, and cardiac and urogenital malformations.',                                                  '1:16000',            'Chromosomal / dominant'),
('00000000-0000-0000-0000-000000000029', 'Schinzel-Giedion Syndrome',       '269150', 'SETBP1 gain-of-function causing severe intellectual disability, characteristic facial features, skeletal anomalies, and frequent early-onset epilepsy.',                                                  'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000002a', 'Marshall-Smith Syndrome',         '602535', 'NFIX variant causing advanced skeletal maturation, intellectual disability, and characteristic facial features with a flattened midface.',                                                                 'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000002b', 'Weaver Syndrome',                 '277590', 'EZH2 loss-of-function causing overgrowth, advanced bone age, intellectual disability, and a characteristic facial gestalt resembling Sotos syndrome.',                                                    'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000002c', 'Pallister-Killian Syndrome',      '601803', 'Tissue-limited tetrasomy 12p causing profound intellectual disability, seizures, sparse anterior scalp hair, and characteristic facial features.',                                                        '1:5000-10000',       'Chromosomal'),
('00000000-0000-0000-0000-00000000002d', 'Bohring-Opitz Syndrome',          '605039', 'ASXL1 variant causing severe intellectual disability, trigonocephaly, limb anomalies in a characteristic posture, and growth retardation.',                                                              'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000002e', 'Wiedemann-Steiner Syndrome',      '605130', 'KMT2A variant causing short stature, intellectual disability, hypertrichosis, and characteristic facial features.',                                                                                       'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-00000000002f', 'Nicolaides-Baraitser Syndrome',   '601358', 'SMARCA2 loss-of-function causing intellectual disability, sparse hair, short stature, and prominent inter-phalangeal joints.',                                                                            'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-000000000030', 'Genitopatellar Syndrome',         '606170', 'KAT6B variant causing absent/hypoplastic patellae, genital anomalies, corpus callosum agenesis, and intellectual disability.',                                                                            'Rare',               'Autosomal dominant'),
('00000000-0000-0000-0000-000000000031', 'DOORS Syndrome',                  '220500', 'TBC1D24 variant causing Deafness, Onychodystrophy, Osteodystrophy, intellectual disability, and Seizures.',                                                                                              'Rare',               'Autosomal recessive'),
('00000000-0000-0000-0000-000000000032', 'Bainbridge-Ropers Syndrome',      '615485', 'ASXL3 variant causing intellectual disability, hypotonia, autistic behaviour, and feeding difficulties in infancy.',                                                                                      'Rare',               'Autosomal dominant')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- HPO Terms (100 terms, each with a unique hpo_id)
-- IDs use the 00000000-0000-0000-0001-{n} scheme
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO reference.hpo_terms (id, hpo_id, name, definition, parent_id) VALUES
-- 01-10: Morphology — head / brain
('00000000-0000-0000-0001-000000000001', 'HP:0000252', 'Microcephaly',                    'Occipitofrontal circumference more than 3 SD below the mean for age and sex.',                                                          NULL),
('00000000-0000-0000-0001-000000000002', 'HP:0000256', 'Macrocephaly',                    'Occipitofrontal circumference more than 2 SD above the mean for age and sex.',                                                          NULL),
('00000000-0000-0000-0001-000000000003', 'HP:0001274', 'Agenesis of corpus callosum',      'Absence of the corpus callosum.',                                                                                                       NULL),
('00000000-0000-0000-0001-000000000004', 'HP:0001305', 'Dandy-Walker malformation',        'A complex brain malformation involving the posterior fossa.',                                                                           NULL),
('00000000-0000-0000-0001-000000000005', 'HP:0002119', 'Ventriculomegaly',                 'Abnormal enlargement of the cerebral ventricles.',                                                                                     NULL),
('00000000-0000-0000-0001-000000000006', 'HP:0002007', 'Frontal bossing',                  'Bilateral bulging of the lateral frontal bone eminences.',                                                                             NULL),
('00000000-0000-0000-0001-000000000007', 'HP:0000268', 'Dolichocephaly',                   'An abnormally long and narrow cranium.',                                                                                               NULL),
('00000000-0000-0000-0001-000000000008', 'HP:0001363', 'Craniosynostosis',                 'Premature fusion of the cranial sutures.',                                                                                             NULL),
('00000000-0000-0000-0001-000000000009', 'HP:0011220', 'Prominent forehead',               'Anteriorly prominent forehead.',                                                                                                       NULL),
('00000000-0000-0000-0001-00000000000a', 'HP:0002191', 'Progressive macrocephaly',         'Progressive increase in head circumference beyond 2 SD above the mean.',                                                              NULL),
-- 11-20: Facial features
('00000000-0000-0000-0001-00000000000b', 'HP:0000316', 'Hypertelorism',                    'Interpupillary distance more than 2 SD above the mean.',                                                                              NULL),
('00000000-0000-0000-0001-00000000000c', 'HP:0000601', 'Hypotelorism',                     'Interpupillary distance more than 2 SD below the mean.',                                                                              NULL),
('00000000-0000-0000-0001-00000000000d', 'HP:0000272', 'Malar flattening',                 'Underdevelopment of the malar eminence of the zygoma.',                                                                               NULL),
('00000000-0000-0000-0001-00000000000e', 'HP:0000337', 'Broad forehead',                   'Width of the forehead more than 2 SD above the mean.',                                                                                NULL),
('00000000-0000-0000-0001-00000000000f', 'HP:0000436', 'Depressed nasal bridge',           'Posterior displacement of the nasal root relative to standard facial development.',                                                   NULL),
('00000000-0000-0000-0001-000000000010', 'HP:0000463', 'Anteverted nares',                 'Forward-facing nares with the nasal openings directed anteriorly.',                                                                   NULL),
('00000000-0000-0000-0001-000000000011', 'HP:0000347', 'Micrognathia',                     'Underdevelopment of the mandible.',                                                                                                    NULL),
('00000000-0000-0000-0001-000000000012', 'HP:0000303', 'Mandibular prognathia',             'Abnormal protrusion of the mandible.',                                                                                                NULL),
('00000000-0000-0000-0001-000000000013', 'HP:0000322', 'Short philtrum',                   'Philtrum length more than 2 SD below the mean.',                                                                                      NULL),
('00000000-0000-0000-0001-000000000014', 'HP:0000343', 'Long philtrum',                    'Philtrum length more than 2 SD above the mean.',                                                                                      NULL),
-- 21-30: Oral / palate
('00000000-0000-0000-0001-000000000015', 'HP:0000219', 'Thin upper lip vermilion',         'Decreased thickness of the upper lip vermilion.',                                                                                     NULL),
('00000000-0000-0000-0001-000000000016', 'HP:0010804', 'Tented upper lip vermilion',       'A cupid bow shape of the upper lip with accentuated peaks.',                                                                          NULL),
('00000000-0000-0000-0001-000000000017', 'HP:0000218', 'High palate',                      'Height of the palate more than 2 SD above the mean.',                                                                                 NULL),
('00000000-0000-0000-0001-000000000018', 'HP:0000175', 'Cleft palate',                     'A developmental defect of the palate resulting from failure of fusion of the lateral palatine processes.',                           NULL),
('00000000-0000-0000-0001-000000000019', 'HP:0000202', 'Cleft lip',                        'Unilateral or bilateral clefting of the upper lip.',                                                                                  NULL),
('00000000-0000-0000-0001-00000000001a', 'HP:0000189', 'Narrow palate',                    'Palate transverse width more than 2 SD below the mean.',                                                                              NULL),
('00000000-0000-0000-0001-00000000001b', 'HP:0000954', 'Single transverse palmar crease',  'Only one transverse crease on the palm of the hand.',                                                                                 NULL),
('00000000-0000-0000-0001-00000000001c', 'HP:0000453', 'Choanal atresia',                  'Absence of the normal posterior nasal passage.',                                                                                      NULL),
('00000000-0000-0000-0001-00000000001d', 'HP:0001611', 'Hypernasal speech',                'Abnormal nasalisation of speech sounds.',                                                                                              NULL),
('00000000-0000-0000-0001-00000000001e', 'HP:0001999', 'Abnormal facial shape',            'An abnormal morphology of the face.',                                                                                                  NULL),
-- 31-40: Ears / hearing
('00000000-0000-0000-0001-00000000001f', 'HP:0000400', 'Macrotia',                         'Ear length or width more than 2 SD above the mean.',                                                                                  NULL),
('00000000-0000-0000-0001-000000000020', 'HP:0008551', 'Microtia',                         'Underdevelopment of the external ear.',                                                                                                NULL),
('00000000-0000-0000-0001-000000000021', 'HP:0000369', 'Low-set ears',                     'Upper insertion of the ear below the level of the outer corner of the eye.',                                                          NULL),
('00000000-0000-0000-0001-000000000022', 'HP:0000358', 'Posteriorly rotated ears',         'Posterior rotation of the ear more than 15 degrees.',                                                                                 NULL),
('00000000-0000-0000-0001-000000000023', 'HP:0000365', 'Hearing impairment',               'Decreased ability to perceive sounds.',                                                                                                NULL),
('00000000-0000-0000-0001-000000000024', 'HP:0000407', 'Sensorineural hearing impairment', 'Hearing impairment involving damage to the inner ear or auditory nerve.',                                                             '00000000-0000-0000-0001-000000000023'),
('00000000-0000-0000-0001-000000000025', 'HP:0000405', 'Conductive hearing impairment',    'Hearing impairment caused by dysfunction of the outer or middle ear.',                                                                '00000000-0000-0000-0001-000000000023'),
('00000000-0000-0000-0001-000000000026', 'HP:0002350', 'Cerebellopontine angle cyst',      'Cystic lesion in the cerebellopontine angle.',                                                                                         NULL),
-- 38-40: Eyes
('00000000-0000-0000-0001-000000000027', 'HP:0000545', 'Myopia',                           'Short-sightedness.',                                                                                                                   NULL),
('00000000-0000-0000-0001-000000000028', 'HP:0000589', 'Coloboma',                         'Structural eye defect caused by failure of fusion of the optic cup.',                                                                 NULL),
('00000000-0000-0000-0001-000000000029', 'HP:0000482', 'Microcornea',                      'Corneal diameter more than 2 SD below the mean.',                                                                                     NULL),
('00000000-0000-0000-0001-00000000002a', 'HP:0000486', 'Strabismus',                       'Misalignment of one eye relative to the other.',                                                                                      NULL),
('00000000-0000-0000-0001-00000000002b', 'HP:0000518', 'Cataract',                         'Opacity of the crystalline lens.',                                                                                                    NULL),
('00000000-0000-0000-0001-00000000002c', 'HP:0000648', 'Optic atrophy',                    'Atrophy of the optic nerve.',                                                                                                         NULL),
('00000000-0000-0000-0001-00000000002d', 'HP:0000527', 'Long eyelashes',                   'Increased length of the eyelashes.',                                                                                                  NULL),
-- 44-55: Neurodevelopment
('00000000-0000-0000-0001-00000000002e', 'HP:0001249', 'Intellectual disability',          'Subnormal intellectual functioning originating during the developmental period.',                                                     NULL),
('00000000-0000-0000-0001-00000000002f', 'HP:0001256', 'Intellectual disability, mild',    'Mildly below average intellectual functioning (IQ 50-69).',                                                                           '00000000-0000-0000-0001-00000000002e'),
('00000000-0000-0000-0001-000000000030', 'HP:0010864', 'Intellectual disability, severe',  'Severely below average intellectual functioning (IQ 20-34).',                                                                         '00000000-0000-0000-0001-00000000002e'),
('00000000-0000-0000-0001-000000000031', 'HP:0001263', 'Global developmental delay',       'Significant delay in the achievement of motor or mental milestones.',                                                                 NULL),
('00000000-0000-0000-0001-000000000032', 'HP:0001270', 'Motor delay',                      'A delay in the acquisition of motor skills.',                                                                                         '00000000-0000-0000-0001-000000000031'),
('00000000-0000-0000-0001-000000000033', 'HP:0000750', 'Delayed speech and language development', 'A delay in the development of speech and language skills.',                                                                    '00000000-0000-0000-0001-000000000031'),
('00000000-0000-0000-0001-000000000034', 'HP:0001344', 'Absent speech',                    'Complete lack of speech.',                                                                                                             NULL),
('00000000-0000-0000-0001-000000000035', 'HP:0000717', 'Autism',                           'Autism spectrum disorder.',                                                                                                            NULL),
('00000000-0000-0000-0001-000000000036', 'HP:0001250', 'Seizure',                          'An episode of abnormal electrical activity in the brain.',                                                                            NULL),
('00000000-0000-0000-0001-000000000037', 'HP:0002360', 'Sleep disturbance',                'An abnormality of sleep duration, quality, or architecture.',                                                                         NULL),
-- 56-65: Muscle tone / growth
('00000000-0000-0000-0001-000000000038', 'HP:0001290', 'Hypotonia',                        'Reduced muscle tone.',                                                                                                                 NULL),
('00000000-0000-0000-0001-000000000039', 'HP:0001252', 'Muscular hypotonia',               'Abnormally low muscle tone.',                                                                                                          '00000000-0000-0000-0001-000000000038'),
('00000000-0000-0000-0001-00000000003a', 'HP:0001276', 'Hypertonia',                       'Increased muscular tone.',                                                                                                             NULL),
('00000000-0000-0000-0001-00000000003b', 'HP:0001510', 'Growth retardation',               'A decrease in growth velocity.',                                                                                                      NULL),
('00000000-0000-0000-0001-00000000003c', 'HP:0004322', 'Short stature',                    'Height more than 2 SD below the mean for age and sex.',                                                                               '00000000-0000-0000-0001-00000000003b'),
('00000000-0000-0000-0001-00000000003d', 'HP:0000098', 'Tall stature',                     'Height more than 2 SD above the mean.',                                                                                               NULL),
('00000000-0000-0000-0001-00000000003e', 'HP:0001511', 'Intrauterine growth retardation',  'Slower than normal rate of fetal weight gain during pregnancy.',                                                                      '00000000-0000-0000-0001-00000000003b'),
('00000000-0000-0000-0001-00000000003f', 'HP:0008367', 'Postnatal growth retardation',     'Decreased growth velocity after birth.',                                                                                              '00000000-0000-0000-0001-00000000003b'),
('00000000-0000-0000-0001-000000000040', 'HP:0001513', 'Obesity',                          'BMI above 30 kg/m2 or above the 95th percentile for age and sex in children.',                                                       NULL),
('00000000-0000-0000-0001-000000000041', 'HP:0000824', 'Growth hormone deficiency',        'Decreased secretion or inadequate function of growth hormone.',                                                                       NULL),
-- 66-75: Cardiac / respiratory
('00000000-0000-0000-0001-000000000042', 'HP:0001627', 'Abnormal heart morphology',        'Any structural anomaly of the heart.',                                                                                                NULL),
('00000000-0000-0000-0001-000000000043', 'HP:0001629', 'Ventricular septal defect',        'A hole in the interventricular septum.',                                                                                              '00000000-0000-0000-0001-000000000042'),
('00000000-0000-0000-0001-000000000044', 'HP:0001631', 'Atrial septal defect',             'A developmental defect in the interatrial septum.',                                                                                   '00000000-0000-0000-0001-000000000042'),
('00000000-0000-0000-0001-000000000045', 'HP:0001636', 'Tetralogy of Fallot',              'Congenital cardiac malformation: pulmonary stenosis, VSD, overriding aorta, RV hypertrophy.',                                        '00000000-0000-0000-0001-000000000042'),
('00000000-0000-0000-0001-000000000046', 'HP:0001680', 'Coarctation of aorta',             'Narrowing of the lumen of the aortic arch.',                                                                                          '00000000-0000-0000-0001-000000000042'),
('00000000-0000-0000-0001-000000000047', 'HP:0002089', 'Pulmonary hypoplasia',             'Underdevelopment of the lung.',                                                                                                       NULL),
('00000000-0000-0000-0001-000000000048', 'HP:0002093', 'Respiratory insufficiency',        'Impaired pulmonary function.',                                                                                                        NULL),
-- 72-80: Limbs / skeleton
('00000000-0000-0000-0001-000000000049', 'HP:0001159', 'Syndactyly',                       'Webbing or fusion of the digits.',                                                                                                    NULL),
('00000000-0000-0000-0001-00000000004a', 'HP:0001156', 'Brachydactyly',                    'Abnormal shortness of fingers and toes.',                                                                                              NULL),
('00000000-0000-0000-0001-00000000004b', 'HP:0001166', 'Arachnodactyly',                   'Long and slender fingers and toes.',                                                                                                  NULL),
('00000000-0000-0000-0001-00000000004c', 'HP:0001167', 'Long fingers',                     'Abnormally long fingers.',                                                                                                             NULL),
('00000000-0000-0000-0001-00000000004d', 'HP:0004209', 'Clinodactyly of the 5th finger',   'Permanent deflection of the 5th finger toward the 4th finger.',                                                                      NULL),
('00000000-0000-0000-0001-00000000004e', 'HP:0002650', 'Scoliosis',                        'Abnormal lateral curvature of the spine.',                                                                                            NULL),
('00000000-0000-0000-0001-00000000004f', 'HP:0002751', 'Kyphoscoliosis',                   'Combination of kyphosis and scoliosis.',                                                                                              NULL),
('00000000-0000-0000-0001-000000000050', 'HP:0001385', 'Hip dysplasia',                    'Abnormal development of the hip joint.',                                                                                              NULL),
('00000000-0000-0000-0001-000000000051', 'HP:0001760', 'Abnormal foot morphology',         'Any structural anomaly of the foot.',                                                                                                 NULL),
('00000000-0000-0000-0001-000000000052', 'HP:0001840', 'Metatarsus adductus',              'Inward deviation of the forefoot relative to the hindfoot.',                                                                          '00000000-0000-0000-0001-000000000051'),
-- 81-90: Skin / connective tissue
('00000000-0000-0000-0001-000000000053', 'HP:0001382', 'Joint hypermobility',              'Increased mobility of joints beyond the normal range.',                                                                               NULL),
('00000000-0000-0000-0001-000000000054', 'HP:0001030', 'Fragile skin',                     'Thin skin that is easily damaged.',                                                                                                   NULL),
('00000000-0000-0000-0001-000000000055', 'HP:0001065', 'Striae distensae',                 'Linear scars resulting from rapid skin stretching.',                                                                                  NULL),
('00000000-0000-0000-0001-000000000056', 'HP:0001480', 'Freckling',                        'Multiple small brown spots caused by concentrations of melanin.',                                                                     NULL),
('00000000-0000-0000-0001-000000000057', 'HP:0000883', 'Thin ribs',                        'Gracile ribs on chest radiograph.',                                                                                                   NULL),
-- 86-90: Abdominal / urogenital
('00000000-0000-0000-0001-000000000058', 'HP:0000028', 'Cryptorchidism',                   'Failure of one or both testes to descend into the scrotum during development.',                                                      NULL),
('00000000-0000-0000-0001-000000000059', 'HP:0000023', 'Inguinal hernia',                  'Herniation of abdominal contents through the inguinal canal.',                                                                        NULL),
('00000000-0000-0000-0001-00000000005a', 'HP:0001433', 'Hepatosplenomegaly',               'Simultaneous enlargement of the liver and spleen.',                                                                                   NULL),
('00000000-0000-0000-0001-00000000005b', 'HP:0003270', 'Abdominal distension',             'Abnormal protrusion of the abdomen.',                                                                                                 NULL),
('00000000-0000-0000-0001-00000000005c', 'HP:0001004', 'Lymphedema',                       'Localised fluid retention and tissue swelling caused by a compromised lymphatic system.',                                            NULL),
-- 91-100: Prenatal / metabolic / other
('00000000-0000-0000-0001-00000000005d', 'HP:0001561', 'Polyhydramnios',                   'Excess of amniotic fluid.',                                                                                                            NULL),
('00000000-0000-0000-0001-00000000005e', 'HP:0001562', 'Oligohydramnios',                  'Reduced amniotic fluid volume.',                                                                                                      NULL),
('00000000-0000-0000-0001-00000000005f', 'HP:0001873', 'Thrombocytopenia',                 'A reduced platelet count.',                                                                                                            NULL),
('00000000-0000-0000-0001-000000000060', 'HP:0000820', 'Abnormality of the thyroid gland', 'Any structural or functional anomaly of the thyroid gland.',                                                                          NULL),
('00000000-0000-0000-0001-000000000061', 'HP:0001197', 'Abnormality of prenatal development', 'Anomaly occurring during embryonic or fetal development.',                                                                         NULL),
('00000000-0000-0000-0001-000000000062', 'HP:0002107', 'Pneumothorax',                     'Accumulation of air in the pleural space.',                                                                                            NULL),
('00000000-0000-0000-0001-000000000063', 'HP:0008689', 'Bilateral cryptorchidism',          'Failure of both testes to descend into the scrotum during fetal development.',                                                    NULL),
('00000000-0000-0000-0001-000000000064', 'HP:0003502', 'Mild short stature',               'Height between 1 and 2 SD below the mean for age and sex.',                                                                          '00000000-0000-0000-0001-00000000003b')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- syndrome_hpo linkage
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO reference.syndrome_hpo (syndrome_id, hpo_term_id) VALUES

-- Down Syndrome (1): trisomy 21
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001'), -- Microcephaly
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000043'), -- VSD
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000044'), -- ASD
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-00000000001b'), -- Single palmar crease
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000038'), -- Hypotonia

-- Turner Syndrome (2): monosomy X
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000046'), -- Coarctation of aorta
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-00000000005c'), -- Lymphedema
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000050'), -- Hip dysplasia

-- Noonan Syndrome (3): PTPN11 / RASopathy
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000045'), -- Tetralogy of Fallot
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000021'), -- Low-set ears
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000038'), -- Hypotonia

-- Williams Syndrome (4): 7q11.23 deletion
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart morphology
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000010'), -- Anteverted nares

-- Angelman Syndrome (5): UBE3A
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000034'), -- Absent speech
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000001'), -- Microcephaly

-- Prader-Willi Syndrome (6): 15q11-q13
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000040'), -- Obesity
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000038'), -- Hypotonia
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000058'), -- Cryptorchidism

-- Cornelia de Lange Syndrome (7): NIPBL
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-00000000003b'), -- Growth retardation
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-00000000004a'), -- Brachydactyly

-- Kabuki Syndrome (8): KMT2D / KDM6A
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-00000000003b'), -- Growth retardation
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-00000000002d'), -- Long eyelashes
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-000000000050'), -- Hip dysplasia

-- Rubinstein-Taybi Syndrome (9): CREBBP / EP300
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0001-00000000004a'), -- Brachydactyly
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0001-00000000003c'), -- Short stature

-- Treacher Collins Syndrome (10): TCOF1
('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0001-000000000020'), -- Microtia
('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0001-000000000025'), -- Conductive hearing impairment
('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0001-00000000000d'), -- Malar flattening
('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0001-000000000011'), -- Micrognathia

-- Marfan Syndrome (11): FBN1
('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0001-00000000003d'), -- Tall stature
('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0001-00000000004b'), -- Arachnodactyly
('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0001-000000000027'), -- Myopia
('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0001-00000000004e'), -- Scoliosis
('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0001-000000000053'), -- Joint hypermobility

-- Ehlers-Danlos Syndrome (12): collagen
('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0001-000000000053'), -- Joint hypermobility
('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0001-000000000054'), -- Fragile skin
('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0001-000000000055'), -- Striae distensae

-- Fragile X Syndrome (13): FMR1
('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0001-00000000001f'), -- Macrotia
('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0001-000000000035'), -- Autism
('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0001-000000000002'), -- Macrocephaly

-- Rett Syndrome (14): MECP2
('00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0001-000000000001'), -- Microcephaly
('00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0001-000000000034'), -- Absent speech

-- Apert Syndrome (15): FGFR2
('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0001-000000000008'), -- Craniosynostosis
('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0001-000000000049'), -- Syndactyly
('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0001-00000000000d'), -- Malar flattening
('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0001-000000000006'), -- Frontal bossing

-- Crouzon Syndrome (16): FGFR2
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0001-000000000008'), -- Craniosynostosis
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0001-00000000000d'), -- Malar flattening
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0001-000000000025'), -- Conductive hearing impairment

-- DiGeorge Syndrome (17): 22q11.2
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart morphology
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0001-000000000024'), -- Sensorineural hearing impairment
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0001-000000000018'), -- Cleft palate

-- Wolf-Hirschhorn Syndrome (18): 4p16.3
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0001-000000000001'), -- Microcephaly
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism

-- Cri du Chat Syndrome (19): 5p deletion
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0001-000000000001'), -- Microcephaly
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism

-- Patau Syndrome (20): trisomy 13
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart morphology
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0001-000000000019'), -- Cleft lip

-- Edwards Syndrome (21): trisomy 18
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0001-00000000003b'), -- Growth retardation

-- Klinefelter Syndrome (22): 47,XXY
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0001-00000000003d'), -- Tall stature
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0001-000000000035'), -- Autism

-- Sotos Syndrome (23): NSD1
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0001-00000000003d'), -- Tall stature
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0001-000000000002'), -- Macrocephaly
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0001-000000000031'), -- Global developmental delay

-- Beckwith-Wiedemann Syndrome (24): 11p15.5
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0001-00000000003d'), -- Tall stature
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0001-00000000005d'), -- Polyhydramnios
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0001-00000000005a'), -- Hepatosplenomegaly

-- Russell-Silver Syndrome (25): 11p15.5 hypometh / UPD7
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0001-00000000003e'), -- IUGR
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0001-000000000002'), -- Macrocephaly

-- Stickler Syndrome (26): COL2A1
('00000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0001-000000000027'), -- Myopia
('00000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0001-000000000024'), -- Sensorineural hearing impairment
('00000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0001-00000000004e'), -- Scoliosis

-- Waardenburg Syndrome (27): PAX3 / MITF
('00000000-0000-0000-0000-00000000001b', '00000000-0000-0000-0001-000000000024'), -- Sensorineural hearing impairment
('00000000-0000-0000-0000-00000000001b', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism

-- Coffin-Siris Syndrome (28): ARID1B
('00000000-0000-0000-0000-00000000001c', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000001c', '00000000-0000-0000-0001-000000000038'), -- Hypotonia
('00000000-0000-0000-0000-00000000001c', '00000000-0000-0000-0001-00000000001e'), -- Abnormal facial shape

-- Floating-Harbor Syndrome (29): SRCAP
('00000000-0000-0000-0000-00000000001d', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-00000000001d', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability

-- KBG Syndrome (30): ANKRD11
('00000000-0000-0000-0000-00000000001e', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-00000000001e', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000001e', '00000000-0000-0000-0001-00000000004e'), -- Scoliosis

-- Mowat-Wilson Syndrome (31): ZEB2
('00000000-0000-0000-0000-00000000001f', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000001f', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-00000000001f', '00000000-0000-0000-0001-000000000003'), -- Agenesis of corpus callosum

-- Phelan-McDermid Syndrome (32): 22q13.3 / SHANK3
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0001-000000000034'), -- Absent speech
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0001-000000000038'), -- Hypotonia
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0001-000000000035'), -- Autism

-- Costello Syndrome (33): HRAS
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0001-000000000054'), -- Fragile skin
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart morphology

-- Cardiofaciocutaneous Syndrome (34): BRAF
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0001-00000000003c'), -- Short stature

-- CHARGE Syndrome (35): CHD7
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0001-000000000028'), -- Coloboma
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0001-00000000001c'), -- Choanal atresia
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0001-000000000024'), -- Sensorineural hearing impairment

-- Jacobsen Syndrome (36): 11q24.1
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0001-00000000005f'), -- Thrombocytopenia
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0001-00000000000b'), -- Hypertelorism

-- Smith-Magenis Syndrome (37): 17p11.2 / RAI1
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0001-000000000037'), -- Sleep disturbance
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0001-000000000036'), -- Seizure

-- Potocki-Lupski Syndrome (38): 17p11.2 dup
('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0001-000000000038'), -- Hypotonia
('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0001-000000000035'), -- Autism
('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart

-- Kleefstra Syndrome (39): 9q34 / EHMT1
('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0001-000000000038'), -- Hypotonia
('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0001-000000000035'), -- Autism

-- Koolen-de Vries Syndrome (40): 17q21.31 / KANSL1
('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0001-000000000042'), -- Abnormal heart

-- Schinzel-Giedion Syndrome (41): SETBP1
('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0001-00000000001e'), -- Abnormal facial shape

-- Marshall-Smith Syndrome (42): NFIX
('00000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0001-000000000048'), -- Respiratory insufficiency
('00000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0001-000000000009'), -- Prominent forehead

-- Weaver Syndrome (43): EZH2
('00000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0001-00000000003d'), -- Tall stature
('00000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0001-000000000031'), -- Global developmental delay

-- Pallister-Killian Syndrome (44): tetrasomy 12p
('00000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0001-000000000038'), -- Hypotonia

-- Bohring-Opitz Syndrome (45): ASXL1
('00000000-0000-0000-0000-00000000002d', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000002d', '00000000-0000-0000-0001-000000000008'), -- Craniosynostosis
('00000000-0000-0000-0000-00000000002d', '00000000-0000-0000-0001-00000000003b'), -- Growth retardation

-- Wiedemann-Steiner Syndrome (46): KMT2A
('00000000-0000-0000-0000-00000000002e', '00000000-0000-0000-0001-00000000003c'), -- Short stature
('00000000-0000-0000-0000-00000000002e', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability

-- Nicolaides-Baraitser Syndrome (47): SMARCA2
('00000000-0000-0000-0000-00000000002f', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-00000000002f', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-00000000002f', '00000000-0000-0000-0001-00000000003c'), -- Short stature

-- Genitopatellar Syndrome (48): KAT6B
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0001-000000000003'), -- Agenesis of corpus callosum
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability

-- DOORS Syndrome (49): TBC1D24
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0001-000000000024'), -- Sensorineural hearing impairment
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0001-000000000036'), -- Seizure
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability

-- Bainbridge-Ropers Syndrome (50): ASXL3
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0001-00000000002e'), -- Intellectual disability
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0001-000000000038'), -- Hypotonia
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0001-000000000035')  -- Autism

ON CONFLICT DO NOTHING;
