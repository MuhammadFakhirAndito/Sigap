export interface SimulationParams {
  magnitudo: number;
  kedalamanKm: number;
  lat: number;
  lon: number;
  tipeLokasi: 'DARAT' | 'LAUT';
  namaLokasi?: string;
}

export interface IsoseismalZone {
  mmi: string;
  mmiNumber: number;
  radiusKm: number;
  label: string;
  deskripsi: string;
  color: string;
}

export interface WaveTravelTime {
  jarakKm: number;
  pWaveSeconds: number;
  sWaveSeconds: number;
  goldenTimeSeconds: number; // Selisih kedatangan gelombang S dan P
}

export interface StructureDamageAssessment {
  tipe: 'STANDAR' | 'TAHAN_GEMPA';
  judul: string;
  tingkatKerusakan: 'RINGAN' | 'SEDANG' | 'BERAT' | 'HANCUR TOTAL';
  persentaseRisiko: number;
  deskripsi: string;
  rekomendasi: string[];
}

export interface SimulationResult {
  params: SimulationParams;
  energiJoule: number;
  energiTntTon: number;
  intensitasEpisentrumMmi: number;
  intensitasEpisentrumRomawi: string;
  statusTsunami: {
    potensi: boolean;
    level: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';
    keterangan: string;
  };
  zonaDampak: IsoseismalZone[];
  goldenTimeTabel: WaveTravelTime[];
  responsStruktur: {
    standar: StructureDamageAssessment;
    tahanGempa: StructureDamageAssessment;
  };
}

const MMI_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Konversi angka MMI (1 - 12) ke angka romawi
 */
export function toMmiRomawi(mmi: number): string {
  const rounded = Math.min(12, Math.max(1, Math.round(mmi)));
  return MMI_ROMAWI[rounded - 1] || 'I';
}

/**
 * Menghitung estimasi dampak guncangan gempa bumi berbasis parameter seismologi
 */
export function calculateEarthquakeSimulation(params: SimulationParams): SimulationResult {
  const { magnitudo, kedalamanKm, tipeLokasi } = params;

  // 1. Energi Seismik (Formula Gutenberg-Richter)
  // log10(E) = 4.8 + 1.5 * M (Joule)
  const logE = 4.8 + 1.5 * magnitudo;
  const energiJoule = Math.pow(10, logE);
  // 1 ton TNT = 4.184 x 10^9 Joule
  const energiTntTon = energiJoule / (4.184 * 1e9);

  // 2. Intensitas Episentrum (I0) dengan Redaman Kedalaman (Esteva & Rosenblueth)
  // I0 = 1.5 * M - 3.5 * log10(h) + 3.0
  const effectiveDepth = Math.max(5, kedalamanKm);
  let rawI0 = 1.5 * magnitudo - 3.5 * Math.log10(effectiveDepth) + 3.0;
  rawI0 = Math.max(1, Math.min(12, rawI0));
  const intensitasEpisentrumMmi = parseFloat(rawI0.toFixed(1));
  const intensitasEpisentrumRomawi = toMmiRomawi(intensitasEpisentrumMmi);

  // 3. Radius Isoseismal (Zona Dampak Jarak MMI)
  // Rumus atenuasi: I(R) = I0 - 3.2 * log10( sqrt(R^2 + h^2) / h )
  // R = sqrt( (h * 10^((I0 - I_target) / 3.2))^2 - h^2 )
  const hitungRadius = (targetMmi: number): number => {
    if (intensitasEpisentrumMmi < targetMmi) return 0;
    const exponent = (intensitasEpisentrumMmi - targetMmi) / 3.2;
    const hypoDist = effectiveDepth * Math.pow(10, exponent);
    const radiusSq = Math.pow(hypoDist, 2) - Math.pow(effectiveDepth, 2);
    if (radiusSq <= 0) return 5;
    return Math.round(Math.sqrt(radiusSq));
  };

  const zonaDampak: IsoseismalZone[] = [
    {
      mmi: 'VI+',
      mmiNumber: 6,
      radiusKm: hitungRadius(6.0),
      label: 'Zona Kerusakan Berat - Signifikan',
      deskripsi: 'Guncangan hebat. Bangunan tanpa perkuatan berisiko roboh atau dinding jebol. Retakan di jalan tanah.',
      color: '#dc2626', // red
    },
    {
      mmi: 'IV - V',
      mmiNumber: 4.5,
      radiusKm: hitungRadius(4.5),
      label: 'Zona Guncangan Kuat / Terasa Nyata',
      deskripsi: 'Dirasakan oleh hampir semua orang. Barang pecah belah berdenting, bandul jam berhenti, pintu terbuka tertutup.',
      color: '#f97316', // orange
    },
    {
      mmi: 'II - III',
      mmiNumber: 2.5,
      radiusKm: hitungRadius(2.5),
      label: 'Zona Getaran Lemah / Sedang',
      deskripsi: 'Dirasakan nyata di dalam rumah, terutama di lantai tingkat. Getaran bagaikan ada truk bermuatan lewat.',
      color: '#eab308', // yellow
    },
  ];

  // 4. Perhitungan Waktu Rambat Gelombang & Golden Time
  // Kecepatan rata-rata kerak bumi: Vp = 6.0 km/s, Vs = 3.5 km/s
  const Vp = 6.0;
  const Vs = 3.5;
  const sampleDistances = [25, 50, 100, 150, 250];
  const goldenTimeTabel: WaveTravelTime[] = sampleDistances.map((dist) => {
    const hypo = Math.sqrt(Math.pow(dist, 2) + Math.pow(effectiveDepth, 2));
    const pTime = hypo / Vp;
    const sTime = hypo / Vs;
    const goldenTime = Math.max(0, sTime - pTime);
    return {
      jarakKm: dist,
      pWaveSeconds: parseFloat(pTime.toFixed(1)),
      sWaveSeconds: parseFloat(sTime.toFixed(1)),
      goldenTimeSeconds: parseFloat(goldenTime.toFixed(1)),
    };
  });

  // 5. Penilaian Potensi Tsunami
  let statusTsunami = {
    potensi: false,
    level: 'AMAN' as 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS',
    keterangan: 'Gempa berada di daratan atau magnitudo tidak memenuhi ambang batas tsunami.',
  };

  if (tipeLokasi === 'LAUT') {
    if (magnitudo >= 7.5 && effectiveDepth <= 30) {
      statusTsunami = {
        potensi: true,
        level: 'AWAS',
        keterangan: 'POTENSI TSUNAMI TINGGI! Kedalaman sangat dangkal dengan energi sangat masif. Segera evakuasi ke tempat tinggi!',
      };
    } else if (magnitudo >= 7.0 && effectiveDepth <= 60) {
      statusTsunami = {
        potensi: true,
        level: 'SIAGA',
        keterangan: 'BERPOTENSI TSUNAMI. Berada di laut dangkal (<60 km). Warga pesisir diimbau menjauh dari pantai.',
      };
    } else if (magnitudo >= 6.5 && effectiveDepth <= 50) {
      statusTsunami = {
        potensi: true,
        level: 'WASPADA',
        keterangan: 'WASPADA ANOMALI GELOMBANG. Terjadi di laut dengan kedalaman relatif dangkal.',
      };
    } else {
      statusTsunami = {
        potensi: false,
        level: 'AMAN',
        keterangan: 'Gempa di laut namun kedalaman cukup dalam (>60 km) atau magnitudo di bawah batas pemicu deformasi dasar laut signifikan.',
      };
    }
  }

  // 6. Penilaian Respons Struktur Bangunan
  const isExtreme = intensitasEpisentrumMmi >= 8;
  const isSevere = intensitasEpisentrumMmi >= 6.5;
  const isModerate = intensitasEpisentrumMmi >= 5;

  const responsStruktur = {
    standar: {
      tipe: 'STANDAR' as const,
      judul: 'Bangunan Biasa / Non-Rekayasa (Tanpa Tulangan SNI)',
      tingkatKerusakan: isExtreme
        ? ('HANCUR TOTAL' as const)
        : isSevere
        ? ('BERAT' as const)
        : isModerate
        ? ('SEDANG' as const)
        : ('RINGAN' as const),
      persentaseRisiko: isExtreme ? 90 : isSevere ? 65 : isModerate ? 35 : 10,
      deskripsi: isExtreme
        ? 'Struktur dinding bata tanpa kolom praktis mengalami keruntuhan total (pancake collapse). Bahaya fatalitas tinggi.'
        : isSevere
        ? 'Dinding bata retak tembus, plafon runtuh, dan sambungan atap terlepas.'
        : 'Plesteran dinding retak halus dan perabot bergeser/terjatuh.',
      rekomendasi: [
        'Segera keluar bangunan jika guncangan selesai.',
        'Waspadai keruntuhan dinding saat gempa susulan.',
        'Lakukan evaluasi kelayakan struktur sebelum kembali masuk.',
      ],
    },
    tahanGempa: {
      tipe: 'TAHAN_GEMPA' as const,
      judul: 'Bangunan Rekayasa Tahan Gempa (SNI 1726)',
      tingkatKerusakan: isExtreme
        ? ('SEDANG' as const)
        : isSevere
        ? ('RINGAN' as const)
        : ('RINGAN' as const),
      persentaseRisiko: isExtreme ? 25 : isSevere ? 10 : 2,
      deskripsi: isExtreme
        ? 'Kerangka kolom dan balok elastis tetap berdiri kokoh. Kerusakan terkontrol pada dinding pengisi non-struktural.'
        : 'Guncangan teredam dengan baik. Struktur utama terikat secara integral dengan fondasi.',
      rekomendasi: [
        'Tetap berlindung di bawah furnitur kokoh (Drop-Cover-Hold On).',
        'Struktur menyediakan ruang penyelamatan aman bagi penghuni.',
        'Cek instalasi listrik dan gas pasca guncangan.',
      ],
    },
  };

  return {
    params,
    energiJoule,
    energiTntTon,
    intensitasEpisentrumMmi,
    intensitasEpisentrumRomawi,
    statusTsunami,
    zonaDampak,
    goldenTimeTabel,
    responsStruktur,
  };
}

