import { useState, useMemo } from "react";
import { ExternalLink, Play, Search, BookOpen, Video, Filter, GraduationCap, Globe } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Article {
  title: string;
  titleEn: string;
  source: string;
  sourceType: "who" | "mayo" | "acs" | "nccn" | "tr" | "nih" | "cruk" | "other";
  description: string;
  descriptionEn: string;
  url: string;
  lang: "tr" | "en" | "both";
}

interface EduVideo {
  title: string;
  titleEn: string;
  channel: string;
  videoId: string;
  durationMin: number;
  lang: "tr" | "en";
}

interface CancerEdu {
  key: string;
  nameTr: string;
  nameEn: string;
  color: string;
  articles: Article[];
  videos: EduVideo[];
}

// ─── Static curated education data ───────────────────────────────────────────

const EDU_DATA: CancerEdu[] = [
  {
    key: "breast",
    nameTr: "Meme Kanseri",
    nameEn: "Breast Cancer",
    color: "#e91e8c",
    articles: [
      {
        title: "Meme Kanseri: Genel Bakış",
        titleEn: "Breast Cancer: Overview",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Meme kanserinin belirtileri, nedenleri, risk faktörleri, tanı ve tedavi seçeneklerine kapsamlı genel bakış.",
        descriptionEn: "Comprehensive overview of breast cancer signs, causes, risk factors, diagnosis, and treatment options.",
        url: "https://www.mayoclinic.org/diseases-conditions/breast-cancer/symptoms-causes/syc-20352470",
        lang: "en",
      },
      {
        title: "Meme Kanseri",
        titleEn: "Breast Cancer",
        source: "Dünya Sağlık Örgütü (WHO)",
        sourceType: "who",
        description: "Küresel meme kanseri istatistikleri, risk faktörleri ve erken tanı stratejileri hakkında WHO'nun kapsamlı kaynağı.",
        descriptionEn: "WHO's comprehensive resource on global breast cancer statistics, risk factors, and early detection strategies.",
        url: "https://www.who.int/news-room/fact-sheets/detail/breast-cancer",
        lang: "en",
      },
      {
        title: "Meme Kanseri Gerçekleri ve İstatistikler",
        titleEn: "Breast Cancer Facts & Figures",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "ABD ve küresel meme kanseri insidansı, mortalite, sağkalım oranları ve tarama önerileri.",
        descriptionEn: "US and global breast cancer incidence, mortality, survival rates, and screening recommendations.",
        url: "https://www.cancer.org/cancer/types/breast-cancer.html",
        lang: "en",
      },
      {
        title: "Meme Kanseri Kılavuzu",
        titleEn: "Breast Cancer Guidelines",
        source: "NCCN",
        sourceType: "nccn",
        description: "Meme kanseri tanı, evreleme ve tedavisinde kullanılan kanıta dayalı NCCN kılavuzları.",
        descriptionEn: "Evidence-based NCCN guidelines for breast cancer diagnosis, staging, and treatment.",
        url: "https://www.nccn.org/patients/guidelines/content/PDF/breast-invasive-patient.pdf",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Meme Kanseri Nedir? Belirtiler ve Tedavi",
        titleEn: "What Is Breast Cancer? Signs and Treatment",
        channel: "Mayo Clinic",
        videoId: "Y5Z0-3M0s_M",
        durationMin: 4,
        lang: "en",
      },
      {
        title: "Meme Kanseri: Evreleme ve Tedavi Seçenekleri",
        titleEn: "Breast Cancer Staging and Treatment Options",
        channel: "Memorial Sloan Kettering",
        videoId: "cLQXfPqMVAk",
        durationMin: 7,
        lang: "en",
      },
      {
        title: "Triple-Negatif Meme Kanseri Açıklandı",
        titleEn: "Triple-Negative Breast Cancer Explained",
        channel: "Dana-Farber Cancer Institute",
        videoId: "yYCkVg7glrE",
        durationMin: 5,
        lang: "en",
      },
    ],
  },
  {
    key: "prostate",
    nameTr: "Prostat Kanseri",
    nameEn: "Prostate Cancer",
    color: "#2196F3",
    articles: [
      {
        title: "Prostat Kanseri",
        titleEn: "Prostate Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Prostat kanserinin belirtileri, nedenleri, tanı yöntemleri ve tedavi seçenekleri.",
        descriptionEn: "Signs, causes, diagnostic methods, and treatment options for prostate cancer.",
        url: "https://www.mayoclinic.org/diseases-conditions/prostate-cancer/symptoms-causes/syc-20353087",
        lang: "en",
      },
      {
        title: "Prostat Kanseri Hakkında Temel Bilgiler",
        titleEn: "Key Statistics for Prostate Cancer",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Prostat kanseri istatistikleri, risk faktörleri, PSA taraması ve erken teşhis rehberi.",
        descriptionEn: "Prostate cancer statistics, risk factors, PSA screening, and early detection guide.",
        url: "https://www.cancer.org/cancer/types/prostate-cancer.html",
        lang: "en",
      },
      {
        title: "Prostat Kanseri Gerçek Bilgiler",
        titleEn: "Prostate Cancer Information",
        source: "NIH / MedlinePlus",
        sourceType: "nih",
        description: "NIH'den kanıta dayalı prostat kanseri bilgileri, tedavi seçenekleri ve klinik araştırmalar.",
        descriptionEn: "Evidence-based prostate cancer information from NIH, treatment options, and clinical trials.",
        url: "https://www.cancer.gov/types/prostate",
        lang: "en",
      },
      {
        title: "Prostat Kanseri Taraması",
        titleEn: "Prostate Cancer Screening",
        source: "WHO",
        sourceType: "who",
        description: "Dünya Sağlık Örgütü'nün prostat kanseri tarama programları ve küresel yük üzerine raporu.",
        descriptionEn: "WHO report on prostate cancer screening programs and global burden.",
        url: "https://www.who.int/news-room/fact-sheets/detail/prostate-cancer",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Prostat Kanseri Belirtileri ve PSA Testi",
        titleEn: "Prostate Cancer Symptoms and PSA Test",
        channel: "Mayo Clinic",
        videoId: "BJ3gfNhNt_o",
        durationMin: 5,
        lang: "en",
      },
      {
        title: "Prostat Kanseri Tedavisi: Seçenekler",
        titleEn: "Prostate Cancer Treatment Options",
        channel: "Memorial Sloan Kettering",
        videoId: "kfluqHRxnYs",
        durationMin: 8,
        lang: "en",
      },
      {
        title: "Robotiik Prostatektomi Nedir?",
        titleEn: "What Is Robotic Prostatectomy?",
        channel: "Cleveland Clinic",
        videoId: "JWCFgnBV4aA",
        durationMin: 3,
        lang: "en",
      },
    ],
  },
  {
    key: "bladder",
    nameTr: "Mesane Kanseri",
    nameEn: "Bladder Cancer",
    color: "#FF9800",
    articles: [
      {
        title: "Mesane Kanseri",
        titleEn: "Bladder Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Mesane kanserinin türleri, belirtileri, risk faktörleri, tanı ve tedavi yöntemleri.",
        descriptionEn: "Types, symptoms, risk factors, diagnosis, and treatment methods of bladder cancer.",
        url: "https://www.mayoclinic.org/diseases-conditions/bladder-cancer/symptoms-causes/syc-20352104",
        lang: "en",
      },
      {
        title: "Mesane Kanseri Hakkında",
        titleEn: "About Bladder Cancer",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Mesane kanseri istatistikleri, risk faktörleri ve tedavi seçenekleri.",
        descriptionEn: "Bladder cancer statistics, risk factors, and treatment options.",
        url: "https://www.cancer.org/cancer/types/bladder-cancer.html",
        lang: "en",
      },
      {
        title: "Mesane Kanseri: Genel Bakış",
        titleEn: "Bladder Cancer Overview",
        source: "Cancer Research UK",
        sourceType: "cruk",
        description: "Mesane kanseri türleri, nedenleri ve tedavisi hakkında kapsamlı bilgi kaynağı.",
        descriptionEn: "Comprehensive information on bladder cancer types, causes and treatment.",
        url: "https://www.cancerresearchuk.org/about-cancer/bladder-cancer",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Mesane Kanseri: Belirtiler ve Tanı",
        titleEn: "Bladder Cancer: Symptoms and Diagnosis",
        channel: "Mayo Clinic",
        videoId: "JzR1xCnNr4I",
        durationMin: 4,
        lang: "en",
      },
      {
        title: "Sistoskopi Nedir?",
        titleEn: "What Is Cystoscopy?",
        channel: "Cleveland Clinic",
        videoId: "QLJrqJZ9GzA",
        durationMin: 3,
        lang: "en",
      },
    ],
  },
  {
    key: "lung",
    nameTr: "Akciğer Kanseri",
    nameEn: "Lung Cancer",
    color: "#607D8B",
    articles: [
      {
        title: "Akciğer Kanseri",
        titleEn: "Lung Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Akciğer kanserinin türleri (KHDAK / KHAK), risk faktörleri, belirtiler ve tedavi seçenekleri.",
        descriptionEn: "Lung cancer types (NSCLC / SCLC), risk factors, symptoms, and treatment options.",
        url: "https://www.mayoclinic.org/diseases-conditions/lung-cancer/symptoms-causes/syc-20374620",
        lang: "en",
      },
      {
        title: "Akciğer Kanseri Gerçekleri",
        titleEn: "Lung Cancer Facts",
        source: "Dünya Sağlık Örgütü (WHO)",
        sourceType: "who",
        description: "Dünya genelinde en ölümcül kanser türü olan akciğer kanserine ilişkin WHO verileri ve önleme stratejileri.",
        descriptionEn: "WHO data on lung cancer, the world's deadliest cancer, and prevention strategies.",
        url: "https://www.who.int/news-room/fact-sheets/detail/lung-cancer",
        lang: "en",
      },
      {
        title: "Akciğer Kanseri Bilgileri",
        titleEn: "Lung Cancer Information",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan akciğer kanseri türleri, evreleme, tedavi ve klinik araştırma bilgileri.",
        descriptionEn: "NCI lung cancer types, staging, treatment, and clinical trial information.",
        url: "https://www.cancer.gov/types/lung",
        lang: "en",
      },
      {
        title: "Akciğer Kanseri Taraması",
        titleEn: "Lung Cancer Screening",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Düşük doz BT taraması ile akciğer kanseri erken tanısı rehberi.",
        descriptionEn: "Guide to early detection of lung cancer with low-dose CT scan.",
        url: "https://www.cancer.org/cancer/types/lung-cancer.html",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Akciğer Kanseri Türleri ve Tedavisi",
        titleEn: "Lung Cancer Types and Treatment",
        channel: "Memorial Sloan Kettering",
        videoId: "Nj0bGHBfHiA",
        durationMin: 6,
        lang: "en",
      },
      {
        title: "Akciğer Kanseri: İmmünoterapi",
        titleEn: "Lung Cancer Immunotherapy",
        channel: "Dana-Farber Cancer Institute",
        videoId: "vFOQKkyj6xU",
        durationMin: 5,
        lang: "en",
      },
    ],
  },
  {
    key: "liver",
    nameTr: "Karaciğer Kanseri",
    nameEn: "Liver Cancer",
    color: "#795548",
    articles: [
      {
        title: "Karaciğer Kanseri (HCC)",
        titleEn: "Liver Cancer (HCC)",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Hepatosellüler karsinom belirtileri, risk faktörleri (hepatit, siroz), tanı ve tedavi.",
        descriptionEn: "Hepatocellular carcinoma symptoms, risk factors (hepatitis, cirrhosis), diagnosis and treatment.",
        url: "https://www.mayoclinic.org/diseases-conditions/liver-cancer/symptoms-causes/syc-20353659",
        lang: "en",
      },
      {
        title: "Karaciğer Kanseri",
        titleEn: "Liver Cancer",
        source: "WHO",
        sourceType: "who",
        description: "Dünya genelinde karaciğer kanseri yükü, hepatit B/C ilişkisi ve önleme stratejileri.",
        descriptionEn: "Global burden of liver cancer, hepatitis B/C link, and prevention strategies.",
        url: "https://www.who.int/news-room/fact-sheets/detail/liver-cancer",
        lang: "en",
      },
      {
        title: "Karaciğer Kanseri Tedavisi",
        titleEn: "Liver Cancer Treatment",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan primer ve metastatik karaciğer kanseri için tedavi seçenekleri.",
        descriptionEn: "Treatment options for primary and metastatic liver cancer from NCI.",
        url: "https://www.cancer.gov/types/liver",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Karaciğer Kanseri: Risk ve Tedavi",
        titleEn: "Liver Cancer: Risk and Treatment",
        channel: "Mayo Clinic",
        videoId: "h5VqnBUReHY",
        durationMin: 5,
        lang: "en",
      },
      {
        title: "Hepatosellüler Karsinom Açıklandı",
        titleEn: "Hepatocellular Carcinoma Explained",
        channel: "Memorial Sloan Kettering",
        videoId: "6y-7p1fJrX4",
        durationMin: 7,
        lang: "en",
      },
    ],
  },
  {
    key: "colorectal",
    nameTr: "Kolon/Rektum Kanseri",
    nameEn: "Colorectal Cancer",
    color: "#4CAF50",
    articles: [
      {
        title: "Kolorektal Kanser",
        titleEn: "Colorectal Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Kolon ve rektum kanserinin belirtileri, risk faktörleri, kolonoskopi taraması ve tedavi.",
        descriptionEn: "Colon and rectal cancer symptoms, risk factors, colonoscopy screening and treatment.",
        url: "https://www.mayoclinic.org/diseases-conditions/colon-cancer/symptoms-causes/syc-20353669",
        lang: "en",
      },
      {
        title: "Kolorektal Kanser Gerçekleri",
        titleEn: "Colorectal Cancer Facts",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Kolorektal kanser istatistikleri, tarama kılavuzları ve risk azaltma önerileri.",
        descriptionEn: "Colorectal cancer statistics, screening guidelines and risk reduction recommendations.",
        url: "https://www.cancer.org/cancer/types/colon-rectal-cancer.html",
        lang: "en",
      },
      {
        title: "Kolorektal Kanser Önleme",
        titleEn: "Colorectal Cancer Prevention",
        source: "WHO",
        sourceType: "who",
        description: "WHO'nun diyet, fiziksel aktivite ve tarama programları aracılığıyla kolorektal kanser önleme önerileri.",
        descriptionEn: "WHO recommendations for colorectal cancer prevention through diet, physical activity and screening programs.",
        url: "https://www.who.int/news-room/fact-sheets/detail/colorectal-cancer",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Kolon Kanseri: Belirtiler ve Tarama",
        titleEn: "Colon Cancer: Symptoms and Screening",
        channel: "Mayo Clinic",
        videoId: "aBhm8NVG9I8",
        durationMin: 5,
        lang: "en",
      },
      {
        title: "Kolonoskopi Nedir?",
        titleEn: "What Is a Colonoscopy?",
        channel: "Cleveland Clinic",
        videoId: "V4gmCj5UrG0",
        durationMin: 4,
        lang: "en",
      },
    ],
  },
  {
    key: "pancreatic",
    nameTr: "Pankreas Kanseri",
    nameEn: "Pancreatic Cancer",
    color: "#9C27B0",
    articles: [
      {
        title: "Pankreas Kanseri",
        titleEn: "Pancreatic Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Pankreas kanserinin neden zor tanı aldığı, belirtileri, risk faktörleri ve tedavi seçenekleri.",
        descriptionEn: "Why pancreatic cancer is difficult to diagnose, symptoms, risk factors and treatment options.",
        url: "https://www.mayoclinic.org/diseases-conditions/pancreatic-cancer/symptoms-causes/syc-20355421",
        lang: "en",
      },
      {
        title: "Pankreas Kanseri Araştırması",
        titleEn: "Pancreatic Cancer Research",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan pankreas kanseri tanı, evreleme ve tedavi protokolleri.",
        descriptionEn: "Pancreatic cancer diagnosis, staging and treatment protocols from NCI.",
        url: "https://www.cancer.gov/types/pancreatic",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Pankreas Kanseri: Erken Belirtiler",
        titleEn: "Pancreatic Cancer: Early Signs",
        channel: "Mayo Clinic",
        videoId: "tHYlaSQqfIk",
        durationMin: 4,
        lang: "en",
      },
      {
        title: "Pankreas Kanseri Tedavisi",
        titleEn: "Pancreatic Cancer Treatment",
        channel: "Memorial Sloan Kettering",
        videoId: "4cqJiMXfHf4",
        durationMin: 6,
        lang: "en",
      },
    ],
  },
  {
    key: "cervical",
    nameTr: "Serviks/Endometriyum Kanseri",
    nameEn: "Cervical/Endometrial Cancer",
    color: "#E91E63",
    articles: [
      {
        title: "Serviks Kanseri",
        titleEn: "Cervical Cancer",
        source: "WHO",
        sourceType: "who",
        description: "WHO'nun serviks kanseri — HPV aşısı, tarama ve küresel yük üzerine kapsamlı kaynağı.",
        descriptionEn: "WHO's comprehensive resource on cervical cancer — HPV vaccine, screening, and global burden.",
        url: "https://www.who.int/news-room/fact-sheets/detail/cervical-cancer",
        lang: "en",
      },
      {
        title: "Serviks Kanseri Tedavisi",
        titleEn: "Cervical Cancer Treatment",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Serviks kanserinin HPV ile ilişkisi, smear testi ve tedavi seçenekleri.",
        descriptionEn: "Cervical cancer's link to HPV, Pap smear testing, and treatment options.",
        url: "https://www.mayoclinic.org/diseases-conditions/cervical-cancer/symptoms-causes/syc-20352501",
        lang: "en",
      },
      {
        title: "Endometriyum Kanseri",
        titleEn: "Endometrial Cancer",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Rahim kanseri risk faktörleri, belirtiler ve tedavi rehberi.",
        descriptionEn: "Uterine cancer risk factors, symptoms, and treatment guide.",
        url: "https://www.cancer.org/cancer/types/endometrial-cancer.html",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "HPV ve Serviks Kanseri Açıklandı",
        titleEn: "HPV and Cervical Cancer Explained",
        channel: "Cancer Research UK",
        videoId: "dDWnZjh5V4Q",
        durationMin: 4,
        lang: "en",
      },
      {
        title: "Endometriyum Kanseri: Belirtiler",
        titleEn: "Endometrial Cancer: Signs and Symptoms",
        channel: "Mayo Clinic",
        videoId: "Mz0Gkw_GHqM",
        durationMin: 3,
        lang: "en",
      },
    ],
  },
  {
    key: "lymphoma",
    nameTr: "Lenfoma",
    nameEn: "Lymphoma",
    color: "#00BCD4",
    articles: [
      {
        title: "Lenfoma: Hodgkin ve Non-Hodgkin",
        titleEn: "Lymphoma: Hodgkin and Non-Hodgkin",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Lenfoma türleri, lenf bezi büyümesi, evreleme ve kemoterapi / immünoterapi.",
        descriptionEn: "Lymphoma types, lymph node swelling, staging, and chemotherapy / immunotherapy.",
        url: "https://www.mayoclinic.org/diseases-conditions/lymphoma/symptoms-causes/syc-20352638",
        lang: "en",
      },
      {
        title: "Lenfoma Bilgileri",
        titleEn: "Lymphoma Information",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan Non-Hodgkin ve Hodgkin lenfoma evreleme, tedavi protokolleri.",
        descriptionEn: "Non-Hodgkin and Hodgkin lymphoma staging and treatment protocols from NCI.",
        url: "https://www.cancer.gov/types/lymphoma",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Lenfoma Nedir? Genel Bakış",
        titleEn: "What Is Lymphoma? An Overview",
        channel: "Mayo Clinic",
        videoId: "Qe_Z2znjEpk",
        durationMin: 5,
        lang: "en",
      },
      {
        title: "Non-Hodgkin Lenfoma Tedavisi",
        titleEn: "Non-Hodgkin Lymphoma Treatment",
        channel: "Memorial Sloan Kettering",
        videoId: "rqU9JXhg7T8",
        durationMin: 6,
        lang: "en",
      },
    ],
  },
  {
    key: "stomach",
    nameTr: "Mide Kanseri",
    nameEn: "Stomach Cancer",
    color: "#FF5722",
    articles: [
      {
        title: "Mide Kanseri",
        titleEn: "Stomach Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Mide (gastrik) kanserin belirtileri, Helicobacter pylori ilişkisi, tanı ve cerrahi tedavi.",
        descriptionEn: "Stomach (gastric) cancer symptoms, Helicobacter pylori link, diagnosis, and surgical treatment.",
        url: "https://www.mayoclinic.org/diseases-conditions/stomach-cancer/symptoms-causes/syc-20352438",
        lang: "en",
      },
      {
        title: "Mide Kanseri Bilgileri",
        titleEn: "Stomach Cancer Facts",
        source: "WHO",
        sourceType: "who",
        description: "WHO küresel mide kanseri istatistikleri ve H. pylori ile ilişkisi.",
        descriptionEn: "WHO global stomach cancer statistics and H. pylori link.",
        url: "https://www.who.int/news-room/fact-sheets/detail/stomach-cancer",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Mide Kanseri: Risk ve Tanı",
        titleEn: "Stomach Cancer: Risk and Diagnosis",
        channel: "Mayo Clinic",
        videoId: "EsxIGRCsW_g",
        durationMin: 4,
        lang: "en",
      },
    ],
  },
  {
    key: "myeloma",
    nameTr: "Multipl Miyelom",
    nameEn: "Multiple Myeloma",
    color: "#3F51B5",
    articles: [
      {
        title: "Multipl Miyelom",
        titleEn: "Multiple Myeloma",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Plazma hücreli kanser olan multipl miyelomun belirtileri, kemik ağrısı, evreleme ve tedavi.",
        descriptionEn: "Multiple myeloma plasma cell cancer symptoms, bone pain, staging and treatment.",
        url: "https://www.mayoclinic.org/diseases-conditions/multiple-myeloma/symptoms-causes/syc-20353378",
        lang: "en",
      },
      {
        title: "Multipl Miyelom Tedavisi",
        titleEn: "Multiple Myeloma Treatment",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan multipl miyelom tedavi seçenekleri: kök hücre nakli ve hedefli tedaviler.",
        descriptionEn: "Multiple myeloma treatment options from NCI: stem cell transplant and targeted therapies.",
        url: "https://www.cancer.gov/types/myeloma",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Multipl Miyelom Nedir?",
        titleEn: "What Is Multiple Myeloma?",
        channel: "Mayo Clinic",
        videoId: "lFGT7n9qMwM",
        durationMin: 5,
        lang: "en",
      },
      {
        title: "Miyelom Tedavisi: Yeni Gelişmeler",
        titleEn: "Myeloma Treatment: New Advances",
        channel: "Memorial Sloan Kettering",
        videoId: "TvvbQq6jCfM",
        durationMin: 7,
        lang: "en",
      },
    ],
  },
  {
    key: "kidney",
    nameTr: "Böbrek Kanseri",
    nameEn: "Kidney Cancer",
    color: "#009688",
    articles: [
      {
        title: "Böbrek Kanseri (Renal Hücreli Karsinom)",
        titleEn: "Kidney Cancer (Renal Cell Carcinoma)",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Renal hücreli karsinom, risk faktörleri, belirtiler, cerrahi ve hedefe yönelik tedavi.",
        descriptionEn: "Renal cell carcinoma, risk factors, symptoms, surgery, and targeted therapy.",
        url: "https://www.mayoclinic.org/diseases-conditions/kidney-cancer/symptoms-causes/syc-20352664",
        lang: "en",
      },
      {
        title: "Böbrek Kanseri Bilgileri",
        titleEn: "Kidney Cancer Information",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Böbrek kanseri türleri, istatistikler, nefrektomi ve immünoterapi seçenekleri.",
        descriptionEn: "Kidney cancer types, statistics, nephrectomy and immunotherapy options.",
        url: "https://www.cancer.org/cancer/types/kidney-cancer.html",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Böbrek Kanseri: Tanı ve Tedavi",
        titleEn: "Kidney Cancer: Diagnosis and Treatment",
        channel: "Mayo Clinic",
        videoId: "eIbpTQ4u3FE",
        durationMin: 5,
        lang: "en",
      },
    ],
  },
  {
    key: "thyroid",
    nameTr: "Tiroid Kanseri",
    nameEn: "Thyroid Cancer",
    color: "#00acc1",
    articles: [
      {
        title: "Tiroid Kanseri",
        titleEn: "Thyroid Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Papiller, folliküler, medüller ve anaplastik tiroid kanseri türleri, belirtiler ve tedavi.",
        descriptionEn: "Papillary, follicular, medullary, and anaplastic thyroid cancer types, symptoms, and treatment.",
        url: "https://www.mayoclinic.org/diseases-conditions/thyroid-cancer/symptoms-causes/syc-20354161",
        lang: "en",
      },
      {
        title: "Tiroid Kanseri Bilgileri",
        titleEn: "Thyroid Cancer Information",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan tiroid kanseri evreleme, radyoaktif iyot tedavisi ve klinik çalışmalar.",
        descriptionEn: "Thyroid cancer staging, radioactive iodine therapy, and clinical trials from NCI.",
        url: "https://www.cancer.gov/types/thyroid",
        lang: "en",
      },
      {
        title: "Tiroid Kanseri: Küresel Yük",
        titleEn: "Thyroid Cancer: Global Burden",
        source: "WHO",
        sourceType: "who",
        description: "Dünya genelinde tiroid kanseri insidansı ve sağ kalım oranları üzerine WHO verileri.",
        descriptionEn: "WHO data on global thyroid cancer incidence and survival rates.",
        url: "https://www.who.int/news-room/fact-sheets/detail/thyroid-cancer",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Tiroid Kanseri: Türler ve Tedavi",
        titleEn: "Thyroid Cancer: Types and Treatment",
        channel: "Mayo Clinic",
        videoId: "6v6gTL1bCUM",
        durationMin: 5,
        lang: "en",
      },
      {
        title: "Radyoaktif İyot Tedavisi Açıklandı",
        titleEn: "Radioactive Iodine Treatment Explained",
        channel: "Memorial Sloan Kettering",
        videoId: "XZpMBwO5bC8",
        durationMin: 4,
        lang: "en",
      },
    ],
  },
  {
    key: "ovarian",
    nameTr: "Over Kanseri",
    nameEn: "Ovarian Cancer",
    color: "#e91e63",
    articles: [
      {
        title: "Over Kanseri",
        titleEn: "Ovarian Cancer",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "'Sessiz katil' olarak bilinen over kanserinin belirtileri, BRCA mutasyonu, CA-125 ve tedavi.",
        descriptionEn: "Ovarian cancer, the 'silent killer': symptoms, BRCA mutation, CA-125, and treatment.",
        url: "https://www.mayoclinic.org/diseases-conditions/ovarian-cancer/symptoms-causes/syc-20375941",
        lang: "en",
      },
      {
        title: "Over Kanseri Gerçekleri",
        titleEn: "Ovarian Cancer Facts",
        source: "American Cancer Society",
        sourceType: "acs",
        description: "Over kanseri istatistikleri, erken belirtiler, debulking cerrahisi ve PARP inhibitörleri.",
        descriptionEn: "Ovarian cancer statistics, early signs, debulking surgery, and PARP inhibitors.",
        url: "https://www.cancer.org/cancer/types/ovarian-cancer.html",
        lang: "en",
      },
      {
        title: "Over Kanseri Farkındalığı",
        titleEn: "Ovarian Cancer Awareness",
        source: "Cancer Research UK",
        sourceType: "cruk",
        description: "Over kanserinin görülme sıklığı, risk faktörleri ve güncel araştırmalar.",
        descriptionEn: "Ovarian cancer incidence, risk factors, and current research.",
        url: "https://www.cancerresearchuk.org/about-cancer/ovarian-cancer",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Over Kanseri: Belirtiler ve Erken Tanı",
        titleEn: "Ovarian Cancer: Symptoms and Early Detection",
        channel: "Mayo Clinic",
        videoId: "sVVjBpVg2_4",
        durationMin: 4,
        lang: "en",
      },
      {
        title: "BRCA Mutasyonu ve Over Kanseri",
        titleEn: "BRCA Mutation and Ovarian Cancer",
        channel: "Dana-Farber Cancer Institute",
        videoId: "mXW6OwD_hqs",
        durationMin: 6,
        lang: "en",
      },
    ],
  },
  {
    key: "brain",
    nameTr: "Beyin Tümörü",
    nameEn: "Brain Tumor",
    color: "#673ab7",
    articles: [
      {
        title: "Beyin Tümörleri",
        titleEn: "Brain Tumors",
        source: "Mayo Clinic",
        sourceType: "mayo",
        description: "Primer ve metastatik beyin tümörleri, glioblastom, belirtiler, cerrahi ve radyoterapi.",
        descriptionEn: "Primary and metastatic brain tumors, glioblastoma, symptoms, surgery, and radiation therapy.",
        url: "https://www.mayoclinic.org/diseases-conditions/brain-tumor/symptoms-causes/syc-20350084",
        lang: "en",
      },
      {
        title: "Beyin Tümörü Bilgileri",
        titleEn: "Brain Tumor Information",
        source: "NIH / NCI",
        sourceType: "nih",
        description: "NCI'dan gliom, meningiom ve metastatik beyin tümörü tedavi protokolleri.",
        descriptionEn: "Glioma, meningioma, and metastatic brain tumor treatment protocols from NCI.",
        url: "https://www.cancer.gov/types/brain",
        lang: "en",
      },
      {
        title: "Beyin Tümörü Araştırması",
        titleEn: "Brain Tumor Research",
        source: "Cancer Research UK",
        sourceType: "cruk",
        description: "Beyin tümörü türleri, yaşa göre insidans ve yeni tedavi yaklaşımları.",
        descriptionEn: "Brain tumor types, age-specific incidence, and new treatment approaches.",
        url: "https://www.cancerresearchuk.org/about-cancer/brain-tumours",
        lang: "en",
      },
    ],
    videos: [
      {
        title: "Beyin Tümörü: Tanı ve Tedavi",
        titleEn: "Brain Tumor: Diagnosis and Treatment",
        channel: "Mayo Clinic",
        videoId: "FBcAr0dAGsQ",
        durationMin: 6,
        lang: "en",
      },
      {
        title: "Glioblastom: Yeni Tedaviler",
        titleEn: "Glioblastoma: Emerging Treatments",
        channel: "Memorial Sloan Kettering",
        videoId: "nMjv-zHUcys",
        durationMin: 7,
        lang: "en",
      },
    ],
  },
];

// ─── Source badge ──────────────────────────────────────────────────────────────

const SOURCE_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  who:   { bg: "bg-blue-50 dark:bg-blue-950/40",   text: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500" },
  mayo:  { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  acs:   { bg: "bg-red-50 dark:bg-red-950/40",      text: "text-red-700 dark:text-red-300",     dot: "bg-red-500" },
  nccn:  { bg: "bg-green-50 dark:bg-green-950/40",  text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  nih:   { bg: "bg-purple-50 dark:bg-purple-950/40",text: "text-purple-700 dark:text-purple-300",dot: "bg-purple-500" },
  cruk:  { bg: "bg-pink-50 dark:bg-pink-950/40",    text: "text-pink-700 dark:text-pink-300",   dot: "bg-pink-500" },
  tr:    { bg: "bg-teal-50 dark:bg-teal-950/40",    text: "text-teal-700 dark:text-teal-300",   dot: "bg-teal-500" },
  other: { bg: "bg-gray-50 dark:bg-gray-800",       text: "text-gray-600 dark:text-gray-300",   dot: "bg-gray-400" },
};

function SourceBadge({ sourceType, source }: { sourceType: string; source: string }) {
  const s = SOURCE_STYLE[sourceType] ?? SOURCE_STYLE.other;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {source}
    </span>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, lang }: { article: Article; lang: "tr" | "en" }) {
  const title = lang === "tr" ? article.title : article.titleEn;
  const desc  = lang === "tr" ? article.description : article.descriptionEn;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/30 transition-all hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <SourceBadge sourceType={article.sourceType} source={article.source} />
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {desc}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
        <Globe className="w-3 h-3" />
        <span className="truncate">{new URL(article.url).hostname.replace("www.", "")}</span>
        {article.lang !== "tr" && (
          <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">EN</span>
        )}
      </div>
    </a>
  );
}

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video, lang }: { video: EduVideo; lang: "tr" | "en" }) {
  const title = lang === "tr" ? video.title : video.titleEn;
  const thumb = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
  const url   = `https://www.youtube.com/watch?v=${video.videoId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border overflow-hidden bg-card hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="relative overflow-hidden">
        <img
          src={thumb}
          alt={title}
          className="w-full object-cover aspect-video bg-muted group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='14' font-family='sans-serif'%3EVideo%3C/text%3E%3C/svg%3E";
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center group-hover:bg-red-600 transition-colors">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
          {video.durationMin} dk
        </span>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {video.channel}
          {video.lang !== "tr" && (
            <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">EN</span>
          )}
        </p>
      </div>
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EgitimMerkezi() {
  const { lang } = useLang();
  const [activeKey, setActiveKey] = useState(EDU_DATA[0].key);
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState<"all" | "articles" | "videos">("all");

  const activeCancer = EDU_DATA.find((d) => d.key === activeKey)!;

  const filteredArticles = useMemo(() => {
    if (!search) return activeCancer.articles;
    const q = search.toLowerCase();
    return activeCancer.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.titleEn.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [activeCancer, search]);

  const filteredVideos = useMemo(() => {
    if (!search) return activeCancer.videos;
    const q = search.toLowerCase();
    return activeCancer.videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.titleEn.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q)
    );
  }, [activeCancer, search]);

  const showArticles = tab === "all" || tab === "articles";
  const showVideos   = tab === "all" || tab === "videos";

  const totalCount = EDU_DATA.reduce(
    (sum, d) => sum + d.articles.length + d.videos.length, 0
  );

  const uiLabels = {
    tr: {
      title: "Eğitim Merkezi",
      subtitle: "Güvenilir kaynaklardan derlenen makaleler ve videolar",
      searchPlaceholder: "Makale veya video ara...",
      all: "Tümü",
      articles: "Makaleler",
      videos: "Videolar",
      resourcesCount: (n: number) => `${n} kanser türü · ${totalCount}+ kaynak`,
      articlesSec: "Makaleler",
      videosSec: "Videolar",
      noResult: "Aramanızla eşleşen içerik bulunamadı.",
    },
    en: {
      title: "Education Center",
      subtitle: "Articles and videos compiled from reliable sources",
      searchPlaceholder: "Search articles or videos...",
      all: "All",
      articles: "Articles",
      videos: "Videos",
      resourcesCount: (n: number) => `${n} cancer types · ${totalCount}+ resources`,
      articlesSec: "Articles",
      videosSec: "Videos",
      noResult: "No content matching your search.",
    },
  }[lang];

  return (
    <div className="flex h-[calc(100vh-44px)] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 border-r flex flex-col bg-background">
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <GraduationCap className="w-4 h-4 text-primary" />
            {uiLabels.title}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {uiLabels.resourcesCount(EDU_DATA.length)}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {EDU_DATA.map((c) => {
            const name = lang === "tr" ? c.nameTr : c.nameEn;
            const active = c.key === activeKey;
            return (
              <button
                key={c.key}
                onClick={() => { setActiveKey(c.key); setSearch(""); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: active ? "currentColor" : c.color }}
                />
                <span className="truncate text-xs">{name}</span>
                <span className={`ml-auto text-[10px] font-mono shrink-0 ${active ? "opacity-80" : "text-muted-foreground"}`}>
                  {c.articles.length + c.videos.length}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={uiLabels.searchPlaceholder}
              className="w-full pl-8 pr-4 py-1.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-0.5 text-xs font-medium">
            {(["all", "articles", "videos"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "articles" && <BookOpen className="w-3 h-3" />}
                {t === "videos"   && <Video className="w-3 h-3" />}
                {t === "all"      && <Filter className="w-3 h-3" />}
                {uiLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-8">
          {/* Cancer section title */}
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: activeCancer.color }}
            />
            <h2 className="text-lg font-bold text-foreground">
              {lang === "tr" ? activeCancer.nameTr : activeCancer.nameEn}
            </h2>
            <div className="flex items-center gap-3 ml-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {activeCancer.articles.length}
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" /> {activeCancer.videos.length}
              </span>
            </div>
          </div>

          {/* No results */}
          {search && filteredArticles.length === 0 && filteredVideos.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">{uiLabels.noResult}</p>
          )}

          {/* Articles */}
          {showArticles && filteredArticles.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="w-4 h-4 text-primary" />
                {uiLabels.articlesSec}
                <span className="text-muted-foreground font-normal">({filteredArticles.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredArticles.map((a, i) => (
                  <ArticleCard key={i} article={a} lang={lang} />
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          {showVideos && filteredVideos.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="w-4 h-4 text-red-500" />
                {uiLabels.videosSec}
                <span className="text-muted-foreground font-normal">({filteredVideos.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredVideos.map((v, i) => (
                  <VideoCard key={i} video={v} lang={lang} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
