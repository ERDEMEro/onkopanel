import { useState, useMemo } from "react";
import { ExternalLink, Play, Search, BookOpen, Video, GraduationCap, Globe, ArrowLeft, Bookmark } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { useCancerTypeList } from "@/hooks/useCancerLibraryData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  title: string; titleEn: string;
  source: string;
  sourceType: "who" | "mayo" | "acs" | "nccn" | "tr" | "nih" | "cruk" | "other";
  description: string; descriptionEn: string;
  url: string;
}

interface EduVideo {
  title: string; titleEn: string;
  channel: string; videoId: string; durationMin: number;
}

interface CancerEdu {
  key: string; nameTr: string; nameEn: string;
  descTr: string; descEn: string;
  color: string; colorDark: string;
  articles: Article[];
  videos: EduVideo[];
}

// ─── Curated education data ───────────────────────────────────────────────────

const EDU_DATA: CancerEdu[] = [
  {
    key: "breast", nameTr: "Meme Kanseri", nameEn: "Breast Cancer",
    descTr: "Kadınlarda en sık görülen kanser türü; erkeklerde de nadir görülür. Erken tanı ile sağkalım oldukça yüksektir.",
    descEn: "The most common cancer in women; rarely occurs in men. Survival is very high with early diagnosis.",
    color: "#c2185b", colorDark: "#880e4f",
    articles: [
      { title: "Meme Kanseri: Genel Bakış", titleEn: "Breast Cancer: Overview", source: "Mayo Clinic", sourceType: "mayo", description: "Meme kanserinin belirtileri, nedenleri, risk faktörleri, tanı ve tedavi seçeneklerine kapsamlı genel bakış.", descriptionEn: "Comprehensive overview of breast cancer signs, causes, risk factors, diagnosis, and treatment options.", url: "https://www.mayoclinic.org/diseases-conditions/breast-cancer/symptoms-causes/syc-20352470" },
      { title: "Meme Kanseri", titleEn: "Breast Cancer", source: "WHO", sourceType: "who", description: "Küresel meme kanseri istatistikleri, risk faktörleri ve erken tanı stratejileri.", descriptionEn: "WHO's resource on global breast cancer statistics, risk factors, and early detection.", url: "https://www.who.int/news-room/fact-sheets/detail/breast-cancer" },
      { title: "Meme Kanseri Gerçekleri ve İstatistikler", titleEn: "Breast Cancer Facts & Figures", source: "American Cancer Society", sourceType: "acs", description: "ABD ve küresel meme kanseri insidansı, mortalite, sağkalım oranları ve tarama önerileri.", descriptionEn: "US and global breast cancer incidence, mortality, survival rates, and screening recommendations.", url: "https://www.cancer.org/cancer/types/breast-cancer.html" },
      { title: "Meme Kanseri Kılavuzu", titleEn: "Breast Cancer Guidelines", source: "NCCN", sourceType: "nccn", description: "Meme kanseri tanı, evreleme ve tedavisinde kullanılan kanıta dayalı NCCN kılavuzları.", descriptionEn: "Evidence-based NCCN guidelines for breast cancer diagnosis, staging, and treatment.", url: "https://www.nccn.org/patients/guidelines/content/PDF/breast-invasive-patient.pdf" },
    ],
    videos: [
      { title: "Meme Kanseri Nedir? Belirtiler ve Tedavi", titleEn: "What Is Breast Cancer? Signs and Treatment", channel: "Mayo Clinic", videoId: "mCmJQGpjGNA", durationMin: 4 },
      { title: "Meme Kanseri: Soru & Cevap", titleEn: "Ask Mayo Clinic: Breast Cancer", channel: "Mayo Clinic", videoId: "W7s63d8v6m4", durationMin: 6 },
      { title: "Triple-Negatif Meme Kanseri Açıklandı", titleEn: "Triple-Negative Breast Cancer Explained", channel: "Dana-Farber Cancer Institute", videoId: "5ULywn_l2cM", durationMin: 5 },
    ],
  },
  {
    key: "prostate", nameTr: "Prostat Kanseri", nameEn: "Prostate Cancer",
    descTr: "Erkeklerde en sık görülen kanserlerden biridir. PSA testi ile erken tanı yakalanabilir.",
    descEn: "One of the most common cancers in men. Early detection is possible with the PSA test.",
    color: "#1565c0", colorDark: "#0d47a1",
    articles: [
      { title: "Prostat Kanseri", titleEn: "Prostate Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Prostat kanserinin belirtileri, nedenleri, tanı yöntemleri ve tedavi seçenekleri.", descriptionEn: "Signs, causes, diagnostic methods, and treatment options for prostate cancer.", url: "https://www.mayoclinic.org/diseases-conditions/prostate-cancer/symptoms-causes/syc-20353087" },
      { title: "Prostat Kanseri Hakkında Temel Bilgiler", titleEn: "Key Statistics for Prostate Cancer", source: "American Cancer Society", sourceType: "acs", description: "Prostat kanseri istatistikleri, risk faktörleri, PSA taraması ve erken teşhis rehberi.", descriptionEn: "Prostate cancer statistics, risk factors, PSA screening, and early detection guide.", url: "https://www.cancer.org/cancer/types/prostate-cancer.html" },
      { title: "Prostat Kanseri Bilgileri", titleEn: "Prostate Cancer Information", source: "NIH / NCI", sourceType: "nih", description: "NIH'den kanıta dayalı prostat kanseri bilgileri, tedavi seçenekleri ve klinik araştırmalar.", descriptionEn: "Evidence-based prostate cancer information from NIH, treatment options, and clinical trials.", url: "https://www.cancer.gov/types/prostate" },
    ],
    videos: [
      { title: "Prostat Kanseri Belirtileri ve PSA Testi", titleEn: "Prostate Cancer Symptoms and PSA Test", channel: "Mayo Clinic", videoId: "hs3FrYs-IOc", durationMin: 5 },
      { title: "Prostat Kanseri Tedavisi: Seçenekler", titleEn: "Prostate Cancer Treatment Options", channel: "Memorial Sloan Kettering", videoId: "4VY73igeBUo", durationMin: 8 },
    ],
  },
  {
    key: "bladder", nameTr: "Mesane Kanseri", nameEn: "Bladder Cancer",
    descTr: "İdrar yolunda gelişen kanser türüdür. En önemli belirtisi kansız veya kanlı idrar çıkarmaktır.",
    descEn: "A cancer that develops in the urinary tract. The most important symptom is bloody or painless hematuria.",
    color: "#e65100", colorDark: "#bf360c",
    articles: [
      { title: "Mesane Kanseri", titleEn: "Bladder Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Mesane kanserinin türleri, belirtileri, risk faktörleri, tanı ve tedavi yöntemleri.", descriptionEn: "Types, symptoms, risk factors, diagnosis, and treatment methods of bladder cancer.", url: "https://www.mayoclinic.org/diseases-conditions/bladder-cancer/symptoms-causes/syc-20352104" },
      { title: "Mesane Kanseri Hakkında", titleEn: "About Bladder Cancer", source: "American Cancer Society", sourceType: "acs", description: "Mesane kanseri istatistikleri, risk faktörleri ve tedavi seçenekleri.", descriptionEn: "Bladder cancer statistics, risk factors, and treatment options.", url: "https://www.cancer.org/cancer/types/bladder-cancer.html" },
      { title: "Mesane Kanseri Genel Bakış", titleEn: "Bladder Cancer Overview", source: "Cancer Research UK", sourceType: "cruk", description: "Mesane kanseri türleri, nedenleri ve tedavisi hakkında kapsamlı bilgi.", descriptionEn: "Comprehensive information on bladder cancer types, causes and treatment.", url: "https://www.cancerresearchuk.org/about-cancer/bladder-cancer" },
    ],
    videos: [
      { title: "Mesane Kanseri: Belirtiler ve Tanı", titleEn: "Bladder Cancer: Symptoms and Diagnosis", channel: "Mayo Clinic", videoId: "f5vmjOsxPYA", durationMin: 4 },
      { title: "Sistoskopi Nedir?", titleEn: "What Is Cystoscopy?", channel: "Cleveland Clinic", videoId: "GdQGDsQyBG8", durationMin: 3 },
    ],
  },
  {
    key: "lung", nameTr: "Akciğer Kanseri", nameEn: "Lung Cancer",
    descTr: "Dünya genelinde kansere bağlı ölümlerin başında gelir. Sigarayla güçlü bir ilişkisi vardır.",
    descEn: "Leading cause of cancer deaths worldwide. Has a strong association with smoking.",
    color: "#37474f", colorDark: "#212121",
    articles: [
      { title: "Akciğer Kanseri", titleEn: "Lung Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Akciğer kanserinin türleri (KHDAK/KHAK), risk faktörleri, belirtiler ve tedavi seçenekleri.", descriptionEn: "Lung cancer types (NSCLC/SCLC), risk factors, symptoms, and treatment options.", url: "https://www.mayoclinic.org/diseases-conditions/lung-cancer/symptoms-causes/syc-20374620" },
      { title: "Akciğer Kanseri Gerçekleri", titleEn: "Lung Cancer Facts", source: "WHO", sourceType: "who", description: "Dünya genelinde en ölümcül kanser türü olan akciğer kanseri verileri.", descriptionEn: "WHO data on lung cancer, the world's deadliest cancer.", url: "https://www.who.int/news-room/fact-sheets/detail/lung-cancer" },
      { title: "Akciğer Kanseri Bilgileri", titleEn: "Lung Cancer Information", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan akciğer kanseri türleri, evreleme, tedavi ve klinik araştırma bilgileri.", descriptionEn: "NCI lung cancer types, staging, treatment, and clinical trial information.", url: "https://www.cancer.gov/types/lung" },
    ],
    videos: [
      { title: "Akciğer Kanseri Türleri ve Tedavisi", titleEn: "Lung Cancer Types and Treatment", channel: "Memorial Sloan Kettering", videoId: "x1BvjsLly8k", durationMin: 6 },
      { title: "Akciğer Kanseri: İmmünoterapi", titleEn: "Lung Cancer Immunotherapy", channel: "Dana-Farber Cancer Institute", videoId: "2t8NHPXhU4s", durationMin: 5 },
    ],
  },
  {
    key: "liver", nameTr: "Karaciğer Kanseri", nameEn: "Liver Cancer",
    descTr: "Genellikle kronik karaciğer hastalıkları (hepatit B/C, siroz) zemininde gelir. Hepatosellüler karsinom en sık tipidir.",
    descEn: "Usually arises on a background of chronic liver disease (hepatitis B/C, cirrhosis). HCC is the most common type.",
    color: "#4e342e", colorDark: "#3e2723",
    articles: [
      { title: "Karaciğer Kanseri (HCC)", titleEn: "Liver Cancer (HCC)", source: "Mayo Clinic", sourceType: "mayo", description: "Hepatosellüler karsinom belirtileri, risk faktörleri (hepatit, siroz), tanı ve tedavi.", descriptionEn: "Hepatocellular carcinoma symptoms, risk factors (hepatitis, cirrhosis), diagnosis and treatment.", url: "https://www.mayoclinic.org/diseases-conditions/liver-cancer/symptoms-causes/syc-20353659" },
      { title: "Karaciğer Kanseri", titleEn: "Liver Cancer", source: "WHO", sourceType: "who", description: "Dünya genelinde karaciğer kanseri yükü, hepatit B/C ilişkisi ve önleme stratejileri.", descriptionEn: "Global burden of liver cancer, hepatitis B/C link, and prevention strategies.", url: "https://www.who.int/news-room/fact-sheets/detail/liver-cancer" },
      { title: "Karaciğer Kanseri Tedavisi", titleEn: "Liver Cancer Treatment", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan primer ve metastatik karaciğer kanseri için tedavi seçenekleri.", descriptionEn: "Treatment options for primary and metastatic liver cancer from NCI.", url: "https://www.cancer.gov/types/liver" },
    ],
    videos: [
      { title: "Karaciğer Kanseri: Risk ve Tedavi", titleEn: "Liver Cancer: Risk and Treatment", channel: "Mayo Clinic", videoId: "aw7_zRQiw5E", durationMin: 5 },
      { title: "Hepatosellüler Karsinom Açıklandı", titleEn: "Hepatocellular Carcinoma Explained", channel: "Memorial Sloan Kettering", videoId: "mxNW4Wrd-_Y", durationMin: 7 },
    ],
  },
  {
    key: "colorectal", nameTr: "Kolon/Rektum Kanseri", nameEn: "Colorectal Cancer",
    descTr: "Kalın bağırsak veya rektumda oluşur. Polipten dönüşerek gelişir; diyet ve aile öyküsü önemli risk faktörleridir.",
    descEn: "Develops in the large intestine or rectum, often from polyps; diet and family history are key risk factors.",
    color: "#2e7d32", colorDark: "#1b5e20",
    articles: [
      { title: "Kolorektal Kanser", titleEn: "Colorectal Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Kolon ve rektum kanserinin belirtileri, risk faktörleri, kolonoskopi taraması ve tedavi.", descriptionEn: "Symptoms, risk factors, colonoscopy screening and treatment for colorectal cancer.", url: "https://www.mayoclinic.org/diseases-conditions/colon-cancer/symptoms-causes/syc-20353669" },
      { title: "Kolorektal Kanser Gerçekleri", titleEn: "Colorectal Cancer Facts", source: "American Cancer Society", sourceType: "acs", description: "Kolorektal kanser istatistikleri, tarama kılavuzları ve risk azaltma önerileri.", descriptionEn: "Colorectal cancer statistics, screening guidelines and risk reduction recommendations.", url: "https://www.cancer.org/cancer/types/colon-rectal-cancer.html" },
      { title: "Kolorektal Kanser Önleme", titleEn: "Colorectal Cancer Prevention", source: "WHO", sourceType: "who", description: "WHO'nun diyet, fiziksel aktivite ve tarama programları aracılığıyla önleme önerileri.", descriptionEn: "WHO recommendations for prevention through diet, physical activity, and screening.", url: "https://www.who.int/news-room/fact-sheets/detail/colorectal-cancer" },
    ],
    videos: [
      { title: "Kolon Kanseri: Belirtiler ve Tarama", titleEn: "Colon Cancer: Symptoms and Screening", channel: "Mayo Clinic", videoId: "v_KkLNxJ5mo", durationMin: 5 },
      { title: "Kolonoskopi Nedir?", titleEn: "What Is a Colonoscopy?", channel: "Cleveland Clinic", videoId: "1EgwmPBxNls", durationMin: 4 },
    ],
  },
  {
    key: "pancreatic", nameTr: "Pankreas Kanseri", nameEn: "Pancreatic Cancer",
    descTr: "Pankreas iç yüzeyinde gelişir. H. pylori enfeksiyonu ve önemli risk faktörleri dikkat gerektirir.",
    descEn: "Develops in the pancreatic lining. H. pylori infection and important risk factors require attention.",
    color: "#6a1b9a", colorDark: "#4a148c",
    articles: [
      { title: "Pankreas Kanseri", titleEn: "Pancreatic Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Pankreas kanserinin neden zor tanı aldığı, belirtileri, risk faktörleri ve tedavi seçenekleri.", descriptionEn: "Why pancreatic cancer is difficult to diagnose, symptoms, risk factors and treatment options.", url: "https://www.mayoclinic.org/diseases-conditions/pancreatic-cancer/symptoms-causes/syc-20355421" },
      { title: "Pankreas Kanseri Araştırması", titleEn: "Pancreatic Cancer Research", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan pankreas kanseri tanı, evreleme ve tedavi protokolleri.", descriptionEn: "Pancreatic cancer diagnosis, staging and treatment protocols from NCI.", url: "https://www.cancer.gov/types/pancreatic" },
    ],
    videos: [
      { title: "Pankreas Kanseri: Erken Belirtiler", titleEn: "Pancreatic Cancer: Early Signs", channel: "Mayo Clinic", videoId: "kYgsCfgeGX4", durationMin: 4 },
      { title: "Pankreas Kanseri Tedavisi", titleEn: "Pancreatic Cancer Treatment", channel: "Memorial Sloan Kettering", videoId: "QdHutabzq64", durationMin: 6 },
    ],
  },
  {
    key: "cervical", nameTr: "Serviks/Endometriyum Kanseri", nameEn: "Cervical/Endometrial Cancer",
    descTr: "İnsan papillomavirus (HPV) ile ilişkili jinekolojik kanserdir. HPV aşısı ve düzenli smear testi ile büyük ölçüde önlenebilir.",
    descEn: "Gynecological cancer linked to HPV. Largely preventable with HPV vaccination and regular Pap smear.",
    color: "#ad1457", colorDark: "#880e4f",
    articles: [
      { title: "Serviks Kanseri", titleEn: "Cervical Cancer", source: "WHO", sourceType: "who", description: "WHO'nun serviks kanseri, HPV aşısı ve küresel yük üzerine kapsamlı kaynağı.", descriptionEn: "WHO's comprehensive resource on cervical cancer, HPV vaccine, and global burden.", url: "https://www.who.int/news-room/fact-sheets/detail/cervical-cancer" },
      { title: "Serviks Kanseri Tedavisi", titleEn: "Cervical Cancer Treatment", source: "Mayo Clinic", sourceType: "mayo", description: "Serviks kanserinin HPV ile ilişkisi, smear testi ve tedavi seçenekleri.", descriptionEn: "Cervical cancer's link to HPV, Pap smear testing, and treatment options.", url: "https://www.mayoclinic.org/diseases-conditions/cervical-cancer/symptoms-causes/syc-20352501" },
      { title: "Endometriyum Kanseri", titleEn: "Endometrial Cancer", source: "American Cancer Society", sourceType: "acs", description: "Rahim kanseri risk faktörleri, belirtiler ve tedavi rehberi.", descriptionEn: "Uterine cancer risk factors, symptoms, and treatment guide.", url: "https://www.cancer.org/cancer/types/endometrial-cancer.html" },
    ],
    videos: [
      { title: "HPV ve Serviks Kanseri Açıklandı", titleEn: "HPV and Cervical Cancer Explained", channel: "Cancer Research UK", videoId: "5ClJI3CeK_Q", durationMin: 4 },
      { title: "Endometriyum Kanseri: Belirtiler", titleEn: "Endometrial Cancer: Signs & Symptoms", channel: "Mayo Clinic", videoId: "z9YeXFMD4Z8", durationMin: 3 },
    ],
  },
  {
    key: "lymphoma", nameTr: "Lenfoma", nameEn: "Lymphoma",
    descTr: "Lenf sistemini etkileyen kanserlerdir. Hodgkin ve non-Hodgkin lenfoma olmak üzere iki ana grubu vardır.",
    descEn: "Cancers affecting the lymphatic system. Divided into Hodgkin and non-Hodgkin lymphoma groups.",
    color: "#00838f", colorDark: "#006064",
    articles: [
      { title: "Lenfoma: Hodgkin ve Non-Hodgkin", titleEn: "Lymphoma: Hodgkin and Non-Hodgkin", source: "Mayo Clinic", sourceType: "mayo", description: "Lenfoma türleri, lenf bezi büyümesi, evreleme ve kemoterapi/immünoterapi.", descriptionEn: "Lymphoma types, lymph node swelling, staging, and chemotherapy/immunotherapy.", url: "https://www.mayoclinic.org/diseases-conditions/lymphoma/symptoms-causes/syc-20352638" },
      { title: "Lenfoma Bilgileri", titleEn: "Lymphoma Information", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan Non-Hodgkin ve Hodgkin lenfoma evreleme, tedavi protokolleri.", descriptionEn: "Non-Hodgkin and Hodgkin lymphoma staging and treatment protocols from NCI.", url: "https://www.cancer.gov/types/lymphoma" },
    ],
    videos: [
      { title: "Lenfoma Nedir? Genel Bakış", titleEn: "What Is Lymphoma? An Overview", channel: "Mayo Clinic", videoId: "Du2G3XoaCEE", durationMin: 5 },
      { title: "Non-Hodgkin Lenfoma Tedavisi", titleEn: "Non-Hodgkin Lymphoma Treatment", channel: "Memorial Sloan Kettering", videoId: "7bBrmw4qXoQ", durationMin: 6 },
    ],
  },
  {
    key: "stomach", nameTr: "Mide Kanseri", nameEn: "Gastric Cancer",
    descTr: "Mide iç yüzeyinde gelişir. H. pylori enfeksiyonu ve önemli risk faktörleri dikkat gerektirir.",
    descEn: "Develops in the stomach lining. H. pylori infection and diet are important risk factors.",
    color: "#bf360c", colorDark: "#870000",
    articles: [
      { title: "Mide Kanseri", titleEn: "Stomach Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Mide (gastrik) kanserin belirtileri, Helicobacter pylori ilişkisi, tanı ve cerrahi tedavi.", descriptionEn: "Stomach cancer symptoms, Helicobacter pylori link, diagnosis, and surgical treatment.", url: "https://www.mayoclinic.org/diseases-conditions/stomach-cancer/symptoms-causes/syc-20352438" },
      { title: "Mide Kanseri Bilgileri", titleEn: "Stomach Cancer Facts", source: "WHO", sourceType: "who", description: "WHO küresel mide kanseri istatistikleri ve H. pylori ile ilişkisi.", descriptionEn: "WHO global stomach cancer statistics and H. pylori link.", url: "https://www.who.int/news-room/fact-sheets/detail/stomach-cancer" },
    ],
    videos: [
      { title: "Mide Kanseri: Risk ve Tanı", titleEn: "Stomach Cancer: Risk and Diagnosis", channel: "Mayo Clinic", videoId: "2KqTBnlDBX4", durationMin: 4 },
    ],
  },
  {
    key: "myeloma", nameTr: "Multipl Miyelom", nameEn: "Multiple Myeloma",
    descTr: "Kemik iliğindeki plazma hücrelerinden kaynaklanan kan kanseri. Kemik ağrısı ve anemi ile belirti verir.",
    descEn: "Blood cancer originating from plasma cells in bone marrow. Presents with bone pain and anemia.",
    color: "#283593", colorDark: "#1a237e",
    articles: [
      { title: "Multipl Miyelom", titleEn: "Multiple Myeloma", source: "Mayo Clinic", sourceType: "mayo", description: "Plazma hücreli kanser olan multipl miyelomun belirtileri, kemik ağrısı, evreleme ve tedavi.", descriptionEn: "Multiple myeloma plasma cell cancer symptoms, bone pain, staging and treatment.", url: "https://www.mayoclinic.org/diseases-conditions/multiple-myeloma/symptoms-causes/syc-20353378" },
      { title: "Multipl Miyelom Tedavisi", titleEn: "Multiple Myeloma Treatment", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan multipl miyelom tedavi seçenekleri: kök hücre nakli ve hedefli tedaviler.", descriptionEn: "Multiple myeloma treatment options from NCI: stem cell transplant and targeted therapies.", url: "https://www.cancer.gov/types/myeloma" },
    ],
    videos: [
      { title: "Multipl Miyelom Nedir?", titleEn: "What Is Multiple Myeloma?", channel: "Mayo Clinic", videoId: "xkpN8gzSmrA", durationMin: 5 },
      { title: "Miyelom Tedavisi: Yeni Gelişmeler", titleEn: "Myeloma Treatment: New Advances", channel: "Memorial Sloan Kettering", videoId: "RoOE0CU7XaM", durationMin: 7 },
    ],
  },
  {
    key: "kidney", nameTr: "Böbrek Kanseri", nameEn: "Kidney Cancer",
    descTr: "Böbrekten gelişen kanser; en sık renal hücreli karsinom (RCC) tipidir. Erken evrede cerrahi ile tamamen tedavi edilebilir.",
    descEn: "Cancer arising in the kidneys; most commonly renal cell carcinoma (RCC). Surgically curable in early stages.",
    color: "#00695c", colorDark: "#004d40",
    articles: [
      { title: "Böbrek Kanseri (RCC)", titleEn: "Kidney Cancer (RCC)", source: "Mayo Clinic", sourceType: "mayo", description: "Renal hücreli karsinom, risk faktörleri, belirtiler, cerrahi ve hedefe yönelik tedavi.", descriptionEn: "Renal cell carcinoma, risk factors, symptoms, surgery, and targeted therapy.", url: "https://www.mayoclinic.org/diseases-conditions/kidney-cancer/symptoms-causes/syc-20352664" },
      { title: "Böbrek Kanseri Bilgileri", titleEn: "Kidney Cancer Information", source: "American Cancer Society", sourceType: "acs", description: "Böbrek kanseri türleri, istatistikler, nefrektomi ve immünoterapi seçenekleri.", descriptionEn: "Kidney cancer types, statistics, nephrectomy and immunotherapy options.", url: "https://www.cancer.org/cancer/types/kidney-cancer.html" },
    ],
    videos: [
      { title: "Böbrek Kanseri: Tanı ve Tedavi", titleEn: "Kidney Cancer: Diagnosis and Treatment", channel: "Mayo Clinic", videoId: "kUrWPp4hnmY", durationMin: 5 },
    ],
  },
  {
    key: "thyroid", nameTr: "Tiroid Kanseri", nameEn: "Thyroid Cancer",
    descTr: "Tiroid bezinde gelişir. Çoğunlukla yavaş seyirli ve tedaviye yanıtı yüksektir. Erken tanı ile 10 yıllık sağkalım %95 üzerindedir.",
    descEn: "Develops in the thyroid gland. Usually slow-growing with excellent treatment response. 10-year survival >95% with early diagnosis.",
    color: "#00838f", colorDark: "#006064",
    articles: [
      { title: "Tiroid Kanseri", titleEn: "Thyroid Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "Papiller, folliküler, medüller ve anaplastik tiroid kanseri türleri, belirtiler ve tedavi.", descriptionEn: "Papillary, follicular, medullary, and anaplastic thyroid cancer types, symptoms, and treatment.", url: "https://www.mayoclinic.org/diseases-conditions/thyroid-cancer/symptoms-causes/syc-20354161" },
      { title: "Tiroid Kanseri Bilgileri", titleEn: "Thyroid Cancer Information", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan tiroid kanseri evreleme, radyoaktif iyot tedavisi ve klinik çalışmalar.", descriptionEn: "Thyroid cancer staging, radioactive iodine therapy, and clinical trials from NCI.", url: "https://www.cancer.gov/types/thyroid" },
      { title: "Tiroid Kanseri: Küresel Yük", titleEn: "Thyroid Cancer: Global Burden", source: "WHO", sourceType: "who", description: "Dünya genelinde tiroid kanseri insidansı ve sağkalım oranları üzerine WHO verileri.", descriptionEn: "WHO data on global thyroid cancer incidence and survival rates.", url: "https://www.who.int/news-room/fact-sheets/detail/thyroid-cancer" },
    ],
    videos: [
      { title: "Tiroid Kanseri: Türler ve Tedavi", titleEn: "Thyroid Cancer: Types and Treatment", channel: "Mayo Clinic", videoId: "IbyL5yxYTGU", durationMin: 5 },
      { title: "Radyoaktif İyot Tedavisi Açıklandı", titleEn: "Radioactive Iodine Treatment Explained", channel: "Memorial Sloan Kettering", videoId: "yY5bJOq5xoE", durationMin: 4 },
    ],
  },
  {
    key: "ovarian", nameTr: "Over Kanseri", nameEn: "Ovarian Cancer",
    descTr: "Yumurtalıklarda gelişen kanser türüdür; erken belirti vermez. Bu yüzden 'sessiz katil' olarak bilinir.",
    descEn: "Cancer that develops in the ovaries; rarely shows early symptoms. Hence known as the 'silent killer'.",
    color: "#880e4f", colorDark: "#560027",
    articles: [
      { title: "Over Kanseri", titleEn: "Ovarian Cancer", source: "Mayo Clinic", sourceType: "mayo", description: "'Sessiz katil' olarak bilinen over kanserinin belirtileri, BRCA mutasyonu, CA-125 ve tedavi.", descriptionEn: "Ovarian cancer, the 'silent killer': symptoms, BRCA mutation, CA-125, and treatment.", url: "https://www.mayoclinic.org/diseases-conditions/ovarian-cancer/symptoms-causes/syc-20375941" },
      { title: "Over Kanseri Gerçekleri", titleEn: "Ovarian Cancer Facts", source: "American Cancer Society", sourceType: "acs", description: "Over kanseri istatistikleri, erken belirtiler, debulking cerrahisi ve PARP inhibitörleri.", descriptionEn: "Ovarian cancer statistics, early signs, debulking surgery, and PARP inhibitors.", url: "https://www.cancer.org/cancer/types/ovarian-cancer.html" },
      { title: "Over Kanseri Farkındalığı", titleEn: "Ovarian Cancer Awareness", source: "Cancer Research UK", sourceType: "cruk", description: "Over kanserinin görülme sıklığı, risk faktörleri ve güncel araştırmalar.", descriptionEn: "Ovarian cancer incidence, risk factors, and current research.", url: "https://www.cancerresearchuk.org/about-cancer/ovarian-cancer" },
    ],
    videos: [
      { title: "Over Kanseri: Belirtiler ve Erken Tanı", titleEn: "Ovarian Cancer: Symptoms & Early Detection", channel: "Mayo Clinic", videoId: "z9YeXFMD4Z8", durationMin: 4 },
      { title: "BRCA Mutasyonu ve Over Kanseri", titleEn: "BRCA Mutation and Ovarian Cancer", channel: "Dana-Farber Cancer Institute", videoId: "ozNSEND5PbE", durationMin: 6 },
    ],
  },
  {
    key: "brain", nameTr: "Beyin Tümörü", nameEn: "Brain Tumor",
    descTr: "Beyinde veya çevresindeki dokularda gelişen tümörlerdir. Primer ve sekonder olmak üzere iki türü vardır.",
    descEn: "Tumors developing in or around brain tissue. Divided into primary (originating in brain) and secondary (metastatic) types.",
    color: "#4527a0", colorDark: "#311b92",
    articles: [
      { title: "Beyin Tümörleri", titleEn: "Brain Tumors", source: "Mayo Clinic", sourceType: "mayo", description: "Primer ve metastatik beyin tümörleri, glioblastom, belirtiler, cerrahi ve radyoterapi.", descriptionEn: "Primary and metastatic brain tumors, glioblastoma, symptoms, surgery, and radiation therapy.", url: "https://www.mayoclinic.org/diseases-conditions/brain-tumor/symptoms-causes/syc-20350084" },
      { title: "Beyin Tümörü Bilgileri", titleEn: "Brain Tumor Information", source: "NIH / NCI", sourceType: "nih", description: "NCI'dan gliom, meningiom ve metastatik beyin tümörü tedavi protokolleri.", descriptionEn: "Glioma, meningioma, and metastatic brain tumor treatment protocols from NCI.", url: "https://www.cancer.gov/types/brain" },
      { title: "Beyin Tümörü Araştırması", titleEn: "Brain Tumor Research", source: "Cancer Research UK", sourceType: "cruk", description: "Beyin tümörü türleri, yaşa göre insidans ve yeni tedavi yaklaşımları.", descriptionEn: "Brain tumor types, age-specific incidence, and new treatment approaches.", url: "https://www.cancerresearchuk.org/about-cancer/brain-tumours" },
    ],
    videos: [
      { title: "Beyin Tümörü: Tanı ve Tedavi", titleEn: "Brain Tumor: Diagnosis and Treatment", channel: "Mayo Clinic", videoId: "RQsUeoVHJl4", durationMin: 6 },
      { title: "Glioblastom: Yeni Tedaviler", titleEn: "Glioblastoma: Emerging Treatments", channel: "Memorial Sloan Kettering", videoId: "z2n3l_iZXBc", durationMin: 7 },
    ],
  },
  {
    key: "other", nameTr: "Diğer / Sınıflandırılmamış", nameEn: "Other / Unclassified",
    descTr: "Henüz tam olarak sınıflandırılamamış, nadir görülen veya birden fazla tanı kategorisini kapsayan kanser kayıtlarını içerir. Bu hastalar için de güvenilir genel onkoloji kaynaklarına erişebilirsiniz.",
    descEn: "Includes records not yet fully classified, rare cancers, or cases spanning multiple diagnostic categories. Reliable general oncology resources are available for these patients as well.",
    color: "#546e7a", colorDark: "#37474f",
    articles: [
      { title: "Kanser: Genel Bilgi", titleEn: "Cancer: General Overview", source: "WHO", sourceType: "who", description: "Dünya Sağlık Örgütü'nün kanser türleri, risk faktörleri, önleme ve küresel yük üzerine kapsamlı genel kaynağı.", descriptionEn: "WHO's comprehensive general resource on cancer types, risk factors, prevention, and global burden.", url: "https://www.who.int/news-room/fact-sheets/detail/cancer" },
      { title: "Kanser Türleri A-Z", titleEn: "Cancer Types A–Z", source: "American Cancer Society", sourceType: "acs", description: "ACS'nin alfabetik olarak sıralanmış tüm kanser türleri rehberi; her tür için belirtiler, tanı ve tedavi bilgileri.", descriptionEn: "ACS alphabetical guide to all cancer types, with symptoms, diagnosis, and treatment for each.", url: "https://www.cancer.org/cancer/types.html" },
      { title: "NCI Kanser Türleri", titleEn: "NCI Cancer Types", source: "NIH / NCI", sourceType: "nih", description: "Ulusal Kanser Enstitüsü'nün tüm kanser türlerine göre organize edilmiş klinik bilgi, araştırma ve tedavi rehberleri.", descriptionEn: "National Cancer Institute's clinical information, research, and treatment guides organized by cancer type.", url: "https://www.cancer.gov/types" },
      { title: "NCCN Hasta Rehberleri", titleEn: "NCCN Patient Guidelines", source: "NCCN", sourceType: "nccn", description: "Ulusal Kapsamlı Kanser Ağı'nın (NCCN) kanser türlerine göre hazırlanmış kanıta dayalı hasta rehberleri.", descriptionEn: "Evidence-based patient guidelines from the National Comprehensive Cancer Network (NCCN) organized by cancer type.", url: "https://www.nccn.org/patients/guidelines/cancers.aspx" },
    ],
    videos: [
      { title: "Kanser Nedir? Temel Bilgiler", titleEn: "What Is Cancer? The Basics", channel: "Mayo Clinic", videoId: "82d5mB9s9j4", durationMin: 5 },
      { title: "Kanser Araştırmalarında Son Gelişmeler", titleEn: "Latest Advances in Cancer Research", channel: "Dana-Farber Cancer Institute", videoId: "3Df4lQikxMI", durationMin: 7 },
    ],
  },
];

// ─── Source badge ─────────────────────────────────────────────────────────────

const SOURCE_STYLE: Record<string, { bg: string; text: string }> = {
  who:   { bg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-700 dark:text-blue-300" },
  mayo:  { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300" },
  acs:   { bg: "bg-red-100 dark:bg-red-900/40",      text: "text-red-700 dark:text-red-300" },
  nccn:  { bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-700 dark:text-green-300" },
  nih:   { bg: "bg-purple-100 dark:bg-purple-900/40",text: "text-purple-700 dark:text-purple-300" },
  cruk:  { bg: "bg-pink-100 dark:bg-pink-900/40",    text: "text-pink-700 dark:text-pink-300" },
  tr:    { bg: "bg-teal-100 dark:bg-teal-900/40",    text: "text-teal-700 dark:text-teal-300" },
  other: { bg: "bg-muted",                           text: "text-muted-foreground" },
};

function SourceBadge({ sourceType, source }: { sourceType: string; source: string }) {
  const s = SOURCE_STYLE[sourceType] ?? SOURCE_STYLE.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {source}
    </span>
  );
}

// ─── Cancer card ──────────────────────────────────────────────────────────────

function CancerCard({
  edu, count, lang, onClick,
}: {
  edu: CancerEdu; count: number; lang: "tr" | "en"; onClick: () => void;
}) {
  const name = lang === "tr" ? edu.nameTr : edu.nameEn;
  const nameEn = edu.nameEn.toUpperCase();
  const desc = lang === "tr" ? edu.descTr : edu.descEn;
  const articlesLabel = lang === "tr" ? "Makaleler" : "Articles";
  const videosLabel   = lang === "tr" ? "Videolar"  : "Videos";
  const hastaLabel    = lang === "tr" ? "HASTA"     : "PATIENTS";

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 select-none"
      style={{ background: `linear-gradient(135deg, ${edu.color} 0%, ${edu.colorDark} 100%)` }}
    >
      {/* blob decoration */}
      <div
        className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20"
        style={{ background: "rgba(255,255,255,0.5)" }}
      />
      <div
        className="absolute -right-4 top-4 w-20 h-20 rounded-full opacity-15"
        style={{ background: "rgba(255,255,255,0.6)" }}
      />

      <div className="relative p-4 flex flex-col gap-3">
        {/* top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-white/60 tracking-widest uppercase">{hastaLabel}</span>
            <span className="text-3xl font-bold text-white leading-none">{count}</span>
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* name */}
        <div>
          <h3 className="text-base font-bold text-white leading-tight">{name}</h3>
          <p className="text-[10px] text-white/60 font-medium tracking-wider mt-0.5">{nameEn}</p>
        </div>

        {/* description */}
        <p className="text-xs text-white/80 leading-relaxed line-clamp-2">{desc}</p>

        {/* footer links */}
        <div className="flex items-center gap-3 pt-1 border-t border-white/20">
          <span className="flex items-center gap-1 text-[11px] text-white/80 font-medium">
            <BookOpen className="w-3 h-3" />
            {articlesLabel}
            <span className="text-white/50">·</span>
            <span className="text-white/60">{edu.articles.length}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/80 font-medium">
            <Video className="w-3 h-3" />
            {videosLabel}
            <span className="text-white/50">·</span>
            <span className="text-white/60">{edu.videos.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, lang }: { article: Article; lang: "tr" | "en" }) {
  const title = lang === "tr" ? article.title : article.titleEn;
  const desc  = lang === "tr" ? article.description : article.descriptionEn;
  return (
    <a
      href={article.url} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <SourceBadge sourceType={article.sourceType} source={article.source} />
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{desc}</p>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-auto">
        <Globe className="w-3 h-3" />
        <span className="truncate">{new URL(article.url).hostname.replace("www.", "")}</span>
      </div>
    </a>
  );
}

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video, lang }: { video: EduVideo; lang: "tr" | "en" }) {
  const title = lang === "tr" ? video.title : video.titleEn;
  const url   = `https://www.youtube.com/watch?v=${video.videoId}`;
  const thumb = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border overflow-hidden bg-card hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {!imgFailed ? (
          <img
            src={thumb} alt={title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <svg viewBox="0 0 90 20" className="w-16 opacity-50" fill="white">
              <path d="M27.97 3.12C27.64 1.89 26.68.93 25.45.6 23.22 0 14.29 0 14.29 0S5.35 0 3.12.58C1.89.91.93 1.89.6 3.12 0 5.35 0 10 0 10s0 4.65.6 6.88c.33 1.23 1.29 2.19 2.52 2.52C5.36 20 14.29 20 14.29 20s8.93 0 11.16-.6c1.23-.33 2.19-1.29 2.52-2.52.6-2.23.6-6.88.6-6.88s0-4.65-.6-6.88z" fill="#FF0000"/>
              <path d="M11.43 14.29L18.85 10l-7.42-4.29v8.58z" fill="white"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
          ~{video.durationMin} dk
        </span>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{title}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {video.channel}
        </p>
      </div>
    </a>
  );
}

// ─── Detail view ─────────────────────────────────────────────────────────────

function DetailView({
  edu, count, lang, onBack,
}: {
  edu: CancerEdu; count: number; lang: "tr" | "en"; onBack: () => void;
}) {
  const [tab, setTab] = useState<"articles" | "videos">("articles");
  const name = lang === "tr" ? edu.nameTr : edu.nameEn;
  const articlesLabel = lang === "tr" ? "Makaleler" : "Articles";
  const videosLabel   = lang === "tr" ? "Videolar"  : "Videos";
  const backLabel     = lang === "tr" ? "Geri Dön"  : "Back";
  const hastaLabel    = lang === "tr" ? "hasta"     : "patients";

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div
        className="relative rounded-2xl overflow-hidden p-5"
        style={{ background: `linear-gradient(135deg, ${edu.color} 0%, ${edu.colorDark} 100%)` }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-15" style={{ background: "rgba(255,255,255,0.5)" }} />
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/80 text-xs font-medium hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </button>
        <h2 className="text-xl font-bold text-white">{name}</h2>
        <p className="text-sm text-white/70 mt-0.5">{count} {hastaLabel}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-0.5 w-fit text-sm font-medium">
        {(["articles", "videos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "articles" ? <BookOpen className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            {t === "articles" ? articlesLabel : videosLabel}
            <span className={`text-xs ${tab === t ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              ({t === "articles" ? edu.articles.length : edu.videos.length})
            </span>
          </button>
        ))}
      </div>

      {/* Content grid */}
      {tab === "articles" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {edu.articles.map((a, i) => <ArticleCard key={i} article={a} lang={lang} />)}
        </div>
      )}
      {tab === "videos" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {edu.videos.map((v, i) => <VideoCard key={i} video={v} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EgitimMerkezi() {
  const { lang } = useLang();
  const { data: typeList = [] } = useCancerTypeList();
  const [search, setSearch]     = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const countMap = useMemo(() => {
    const m: Record<string, number> = {};
    typeList.forEach((t) => { m[t.key] = t.count; });
    return m;
  }, [typeList]);

  const filtered = useMemo(() => {
    if (!search) return EDU_DATA;
    const q = search.toLowerCase();
    return EDU_DATA.filter(
      (d) =>
        d.nameTr.toLowerCase().includes(q) ||
        d.nameEn.toLowerCase().includes(q) ||
        d.descTr.toLowerCase().includes(q) ||
        d.descEn.toLowerCase().includes(q),
    );
  }, [search]);

  const activeEdu = activeKey ? EDU_DATA.find((d) => d.key === activeKey) ?? null : null;

  const totalResources = EDU_DATA.reduce((s, d) => s + d.articles.length + d.videos.length, 0);

  const ui = {
    tr: {
      title: "Eğitim Merkezi",
      subtitle: "Her kanser türü için güvenilir kaynaklardan derlenmiş makaleler ve YouTube videoları. Bir kanser türü seçin.",
      badge: (n: number) => `${n} kanser türü`,
      search: "Kanser türü ara...",
    },
    en: {
      title: "Education Center",
      subtitle: "Articles and YouTube videos compiled from reliable sources for each cancer type. Select a cancer type.",
      badge: (n: number) => `${n} cancer types`,
      search: "Search cancer type...",
    },
  }[lang];

  return (
    <div className="min-h-[calc(100vh-44px)] bg-background">
      <div className="max-w-[1300px] mx-auto px-6 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="space-y-3 anim-fsu" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              {ui.badge(EDU_DATA.length)} · {totalResources}+ kaynak
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{ui.title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{ui.subtitle}</p>

          {/* Search */}
          {!activeKey && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ui.search}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
        </div>

        {/* ── Detail view ── */}
        {activeEdu ? (
          <DetailView
            edu={activeEdu}
            count={countMap[activeEdu.key] ?? 0}
            lang={lang}
            onBack={() => setActiveKey(null)}
          />
        ) : (
          /* ── Cancer card grid ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((edu) => (
              <CancerCard
                key={edu.key}
                edu={edu}
                count={countMap[edu.key] ?? 0}
                lang={lang}
                onClick={() => setActiveKey(edu.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
