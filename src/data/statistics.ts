/**
 * Historical PSA figures transcribed from public text of PSA-CAR releases.
 * The official PDF host returned HTTP 403 during this build, so these rows
 * are marked unverified-by-file. They are not satellite estimates and not forecasts.
 * Implied yield is volume ÷ area from the same row.
 */

export type StatRow = {
  id: string;
  label: string;
  year: number;
  geography: string;
  productionMt: number;
  areaHa: number | null;
  source: string;
  sourceUrl: string;
};

export const statisticsCaveat =
  "Transcribed from PSA-CAR special-release text. The PDF host returned HTTP 403 when this app was built, so the file was not re-parsed here. Do not use these tonnes for trade or credit. They are historical official statistics, not a Green Radar estimate.";

export const vegetableRows: StatRow[] = [
  {
    id: "car-2020",
    label: "All vegetables",
    year: 2020,
    geography: "CAR",
    productionMt: 366314,
    areaHa: 23559,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
  {
    id: "abra-2020",
    label: "All vegetables",
    year: 2020,
    geography: "Abra",
    productionMt: 5836,
    areaHa: 636,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
  {
    id: "apayao-2020",
    label: "All vegetables",
    year: 2020,
    geography: "Apayao",
    productionMt: 15102,
    areaHa: 721,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
  {
    id: "benguet-2020",
    label: "All vegetables",
    year: 2020,
    geography: "Benguet",
    productionMt: 305052,
    areaHa: 17408,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
  {
    id: "ifugao-2020",
    label: "All vegetables",
    year: 2020,
    geography: "Ifugao",
    productionMt: 6771,
    areaHa: 1499,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
  {
    id: "kalinga-2020",
    label: "All vegetables",
    year: 2020,
    geography: "Kalinga",
    productionMt: 1038,
    areaHa: 234,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
  {
    id: "mp-2020",
    label: "All vegetables",
    year: 2020,
    geography: "Mountain Province",
    productionMt: 32513,
    areaHa: 3056,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer, Table 4",
    sourceUrl: "https://rssocar.psa.gov.ph/",
  },
];

export const regionalHistory: { year: number; productionMt: number; areaHa: number | null; source: string }[] = [
  {
    year: 2018,
    productionMt: 368670,
    areaHa: null,
    source: "PSA-CAR newsletter: 2019 volume was 0.02% below 368,670.0 MT",
  },
  {
    year: 2019,
    productionMt: 368608.2,
    areaHa: 23976.9,
    source: "PSA-CAR newsletter, vegetable production in CAR, CY 2019",
  },
  {
    year: 2020,
    productionMt: 366314,
    areaHa: 23559,
    source: "PSA-CAR, 2020 Cordillera Vegetables Situationer",
  },
];

export const cropSnapshots: {
  id: string;
  cropId: string;
  year: number;
  geography: string;
  productionMt: number;
  source: string;
  sourceUrl: string;
}[] = [
  {
    id: "cabbage-car-2016",
    cropId: "cabbage",
    year: 2016,
    geography: "CAR",
    productionMt: 94728,
    source: "PSA-CAR Special Release 2017-29",
    sourceUrl: "https://rssocar.psa.gov.ph/system/files/attachment-dir/2017-29-SR-PSACAR-AgriStat.pdf",
  },
  {
    id: "cabbage-benguet-2016",
    cropId: "cabbage",
    year: 2016,
    geography: "Benguet",
    productionMt: 81778,
    source: "PSA-CAR Special Release 2017-29",
    sourceUrl: "https://rssocar.psa.gov.ph/system/files/attachment-dir/2017-29-SR-PSACAR-AgriStat.pdf",
  },
  {
    id: "cabbage-mp-2016",
    cropId: "cabbage",
    year: 2016,
    geography: "Mountain Province",
    productionMt: 12450,
    source: "PSA-CAR Special Release 2017-29",
    sourceUrl: "https://rssocar.psa.gov.ph/system/files/attachment-dir/2017-29-SR-PSACAR-AgriStat.pdf",
  },
  {
    id: "potato-car-2016",
    cropId: "potato",
    year: 2016,
    geography: "CAR",
    productionMt: 99981,
    source: "PSA-CAR Special Release 2017-29",
    sourceUrl: "https://rssocar.psa.gov.ph/system/files/attachment-dir/2017-29-SR-PSACAR-AgriStat.pdf",
  },
  {
    id: "carrot-car-2016",
    cropId: "carrot",
    year: 2016,
    geography: "CAR",
    productionMt: 58695,
    source: "PSA-CAR Special Release 2017-29",
    sourceUrl: "https://rssocar.psa.gov.ph/system/files/attachment-dir/2017-29-SR-PSACAR-AgriStat.pdf",
  },
];
