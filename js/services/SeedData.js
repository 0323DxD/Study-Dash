/**
 * SeedData.js — Initial default lessons and questions for Study Dash.
 * Automatically populates IndexedDB on first run if database is empty.
 */

import { DB } from '../db.js';

export const INITIAL_DATA = {
  subjects: [
    {
      id: 1,
      name: 'Information Technology',
      color: '#4361ee',
      icon: '💻',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'General Science',
      color: '#06d6a0',
      icon: '🔬',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Mathematics',
      color: '#f72585',
      icon: '🧮',
      createdAt: new Date().toISOString()
    }
  ],

  lessons: [
    {
      id: 1,
      subjectId: 1,
      title: 'OSI Model & Layers',
      description: 'Understanding the 7 layers of the Open Systems Interconnection model.',
      objectives: 'Memorize all 7 layers in order; Understand encapsulation and protocol functions at each layer.',
      content: `### The 7 Layers of the OSI Model

The Open Systems Interconnection (OSI) model describes seven layers that computer systems use to communicate over a network:

1. **Physical Layer**: Cables, radio frequencies, bits (0s and 1s).
2. **Data Link Layer**: Framing, MAC addressing, switches (Ethernet).
3. **Network Layer**: IP addressing, routing packets (Routers).
4. **Transport Layer**: End-to-end communication, TCP/UDP, flow control, segments.
5. **Session Layer**: Establishing, maintaining, and synchronizing dialogues.
6. **Presentation Layer**: Data formatting, encryption/decryption, compression.
7. **Application Layer**: User-facing protocols (HTTP, DNS, SMTP, FTP).

*Mnemonic:* **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way (Layers 1 to 7).`,
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      subjectId: 1,
      title: 'TCP/IP Protocol Suite',
      description: 'Core internet protocols, packet switching, and IP addressing.',
      objectives: 'Distinguish between TCP and UDP; Understand IPv4 vs IPv6 and port numbers.',
      content: `### TCP vs UDP

- **TCP (Transmission Control Protocol)**: Connection-oriented, reliable, guarantees delivery via 3-way handshake (SYN, SYN-ACK, ACK), error checking and flow control. Used by HTTP, HTTPS, SSH, FTP.
- **UDP (User Datagram Protocol)**: Connectionless, lightweight, unreliable, low latency. Used by DNS queries, video streaming, VoIP, online gaming.

### Common Well-Known Ports:
- 20/21: FTP
- 22: SSH
- 25: SMTP
- 53: DNS
- 80: HTTP
- 443: HTTPS`,
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      subjectId: 1,
      title: 'Network Security Fundamentals',
      description: 'Firewalls, cryptography, common cyber attacks, and CIA triad.',
      objectives: 'Understand Confidentiality, Integrity, Availability; Identify phishing, DDoS, and MITM attacks.',
      content: `### The CIA Triad
- **Confidentiality**: Ensuring sensitive information is accessed only by authorized parties (encryption, access control).
- **Integrity**: Maintaining the accuracy and consistency of data (checksums, hashing, digital signatures).
- **Availability**: Ensuring systems and resources are accessible when needed (redundancy, DDoS mitigation, backups).

### Common Threats:
- **Phishing**: Social engineering attack tricking users into revealing credentials.
- **DDoS**: Overwhelming a server with distributed traffic to deny service.
- **Man-in-the-Middle (MITM)**: Eavesdropping or altering communication between two parties.`,
      difficulty: 'hard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      subjectId: 2,
      title: 'Cell Biology & Organelles',
      description: 'The fundamental unit of life, cell structure, and energy production.',
      objectives: 'Identify cell organelles and their primary functions; Contrast plant and animal cells.',
      content: `### Key Cell Organelles
- **Nucleus**: Contains genetic material (DNA); controls cell activities.
- **Mitochondria**: The "powerhouse of the cell"; site of cellular respiration and ATP generation.
- **Ribosomes**: Protein synthesis factories.
- **Endoplasmic Reticulum (ER)**: Rough ER (studded with ribosomes, protein modification) and Smooth ER (lipid synthesis, detoxification).
- **Chloroplasts**: Found in plant cells; contains chlorophyll for photosynthesis.
- **Cell Wall**: Rigid outer layer in plant cells composed of cellulose.`,
      difficulty: 'easy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 5,
      subjectId: 3,
      title: 'Algebraic Equations & Functions',
      description: 'Linear equations, quadratics, and exponents.',
      objectives: 'Solve linear and quadratic equations; Evaluate function notation.',
      content: `### Quadratic Formula
For $ax^2 + bx + c = 0$:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Discriminant ($D = b^2 - 4ac$):
- $D > 0$: 2 real distinct roots
- $D = 0$: 1 real repeated root
- $D < 0$: 2 complex conjugate roots`,
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],

  questions: [
    // OSI Model Questions
    {
      id: 1,
      subjectId: 1,
      lessonId: 1,
      type: 'mcq',
      difficulty: 'easy',
      text: 'Which layer of the OSI model is responsible for routing packets across different networks?',
      options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Session Layer'],
      correctIndex: 1,
      explanation: 'The Network Layer (Layer 3) handles logical IP addressing and packet routing across intermediate routers.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      subjectId: 1,
      lessonId: 1,
      type: 'truefalse',
      difficulty: 'easy',
      text: 'The Transport Layer is Layer 4 in the 7-layer OSI model.',
      correct: true,
      explanation: 'Layer 4 is indeed the Transport Layer, positioned between Network (Layer 3) and Session (Layer 5).',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      subjectId: 1,
      lessonId: 1,
      type: 'identification',
      difficulty: 'medium',
      text: 'What is the Protocol Data Unit (PDU) called at the Transport Layer when using TCP?',
      correct: 'segment',
      alternates: ['segments', 'tcp segment'],
      explanation: 'At the Transport Layer with TCP, data packets are referred to as "segments" (or "datagrams" for UDP).',
      points: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      subjectId: 1,
      lessonId: 1,
      type: 'mcq',
      difficulty: 'medium',
      text: 'Which OSI layer handles data encryption, decryption, and data compression?',
      options: ['Application Layer', 'Presentation Layer', 'Session Layer', 'Transport Layer'],
      correctIndex: 1,
      explanation: 'The Presentation Layer (Layer 6) formats, encrypts, and compresses data so that the Application layer can process it.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    // TCP/IP Questions
    {
      id: 5,
      subjectId: 1,
      lessonId: 2,
      type: 'mcq',
      difficulty: 'easy',
      text: 'Which transport protocol is connection-oriented and guarantees reliable packet delivery?',
      options: ['UDP', 'ICMP', 'TCP', 'IP'],
      correctIndex: 2,
      explanation: 'TCP (Transmission Control Protocol) establishes a connection via a 3-way handshake and guarantees delivery through sequence numbers and acknowledgments.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 6,
      subjectId: 1,
      lessonId: 2,
      type: 'identification',
      difficulty: 'medium',
      text: 'What default port number does secure web traffic (HTTPS) use?',
      correct: '443',
      alternates: ['port 443'],
      explanation: 'HTTPS operates by default over TCP port 443, while standard unencrypted HTTP uses port 80.',
      points: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: 7,
      subjectId: 1,
      lessonId: 2,
      type: 'truefalse',
      difficulty: 'medium',
      text: 'UDP performs error correction and retransmits lost packets automatically.',
      correct: false,
      explanation: 'False. UDP is a connectionless, best-effort protocol that does NOT retransmit lost packets or perform error recovery.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    // Security Questions
    {
      id: 8,
      subjectId: 1,
      lessonId: 3,
      type: 'mcq',
      difficulty: 'easy',
      text: 'Which element of the CIA Triad focuses on preventing unauthorized modification of data?',
      options: ['Confidentiality', 'Integrity', 'Availability', 'Authentication'],
      correctIndex: 1,
      explanation: 'Integrity ensures that data remains accurate, complete, and protected against unauthorized alterations or tampering.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 9,
      subjectId: 1,
      lessonId: 3,
      type: 'identification',
      difficulty: 'easy',
      text: 'What type of social engineering attack deceives victims into submitting sensitive credentials via fraudulent emails or fake websites?',
      correct: 'phishing',
      alternates: ['phishing attack', 'spear phishing'],
      explanation: 'Phishing is the practice of sending fraudulent communications that appear to come from a reputable source to harvest credentials.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    // Biology Questions
    {
      id: 10,
      subjectId: 2,
      lessonId: 4,
      type: 'mcq',
      difficulty: 'easy',
      text: 'Which organelle is widely referred to as the powerhouse of the cell due to ATP synthesis?',
      options: ['Ribosome', 'Mitochondria', 'Golgi Apparatus', 'Lysosome'],
      correctIndex: 1,
      explanation: 'Mitochondria generate most of the chemical energy needed to power the biochemical reactions of the cell in the form of ATP.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 11,
      subjectId: 2,
      lessonId: 4,
      type: 'truefalse',
      difficulty: 'easy',
      text: 'Plant cells have both a cell wall and chloroplasts, whereas animal cells do not.',
      correct: true,
      explanation: 'True. Plant cells possess rigid cellulose cell walls and photosynthetic chloroplasts, which are absent in animal cells.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 12,
      subjectId: 2,
      lessonId: 4,
      type: 'identification',
      difficulty: 'easy',
      text: 'What is the green pigment in chloroplasts responsible for absorbing sunlight for photosynthesis?',
      correct: 'chlorophyll',
      alternates: ['chlorophyl'],
      explanation: 'Chlorophyll absorbs light primarily in the blue and red portions of the electromagnetic spectrum while reflecting green.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    // Math Questions
    {
      id: 13,
      subjectId: 3,
      lessonId: 5,
      type: 'mcq',
      difficulty: 'easy',
      text: 'Solve for x: 3x - 7 = 14',
      options: ['5', '6', '7', '8'],
      correctIndex: 2,
      explanation: '3x - 7 = 14 => 3x = 21 => x = 7.',
      points: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 14,
      subjectId: 3,
      lessonId: 5,
      type: 'identification',
      difficulty: 'medium',
      text: 'What is the value of 2 to the 5th power (2^5)?',
      correct: '32',
      alternates: ['thirty two'],
      explanation: '2 * 2 * 2 * 2 * 2 = 32.',
      points: 10,
      createdAt: new Date().toISOString()
    }
  ]
};

export const SeedData = {
  /**
   * Seeds the database with initial subjects, lessons, and questions if empty.
   */
  async seedDatabase() {
    try {
      const subjectCount = await DB.count('subjects');
      if (subjectCount > 0) {
        console.log('[SeedData] Database already seeded.');
        return;
      }

      console.log('[SeedData] Seeding initial subjects, lessons, and questions...');

      for (const subject of INITIAL_DATA.subjects) {
        await DB.add('subjects', subject);
      }

      for (const lesson of INITIAL_DATA.lessons) {
        await DB.add('lessons', lesson);
      }

      for (const question of INITIAL_DATA.questions) {
        await DB.add('questions', question);
      }

      console.log('[SeedData] Seeding completed successfully!');
    } catch (err) {
      console.error('[SeedData] Failed to seed database:', err);
    }
  }
};

export default SeedData;

