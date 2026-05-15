"""
replit_app.py — Onkoloji EHR RAG Dashboard (Replit için tek dosya)
FastAPI olmadan: Streamlit → ChromaDB → Groq doğrudan
"""
import os
import re
from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

# ─── Sayfa ────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Onkoloji EHR Analiz",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

CSV_PATH   = "hackathon_veri.csv"
CHROMA_DIR = "chroma_db"
COLLECTION = "onkoloji_hastalar"

SYSTEM_PROMPT = ChatPromptTemplate.from_template(
"""Sen deneyimli bir onkoloji uzmanı ve klinik karar destek asistanısın.
Görevin iki katmanlıdır:

1. Önce sana verilen HASTA KAYITLARI bağlamını incele. Soruyla ilgili kayıt varsa oradan istatistik, örüntü ve özet bilgi çıkar.
2. Hasta kayıtlarında yeterli bilgi yoksa veya soru genel tıbbi/onkolojik bir bilgi gerektiriyorsa, onkoloji alanındaki geniş tıbbi bilgini kullanarak kapsamlı ve doğru bir cevap ver.

Önemli kurallar:
- Hasta ismi, TC kimlik numarası veya benzeri kişisel kimlik bilgisi ASLA paylaşma; yalnızca istatistik ve özet ver.
- Cevaplarını her zaman Türkçe ver.
- Klinik açıdan doğru, güncel ve faydalı bilgi sun.
- "Bu bilgi kayıtlarda yok" diyerek soruyu geçiştirme; genel tıbbi bilgini kullanarak yanıtla.
- Hasta kayıtlarından elde ettiğin bilgileri genel tıbbi bilginden ayırt etmek için gerektiğinde belirt
  (örn: "Hasta kayıtlarımıza göre... / Genel onkoloji pratiğinde...").

--- HASTA KAYITLARI (Bağlam) ---
{context}
---------------------------------

SORU: {question}

CEVAP:"""
)

# ─── RAG bileşenleri ──────────────────────────────────────────────────────────
@st.cache_resource(show_spinner="Yapay zeka yükleniyor...")
def load_rag():
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        st.error("GROQ_API_KEY bulunamadı. Replit Secrets'a ekleyin.")
        st.stop()

    embeddings = HuggingFaceEmbeddings(
        model_name="paraphrase-multilingual-MiniLM-L12-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )
    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION,
        embedding_function=embeddings,
    )
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        max_tokens=2048,
        groq_api_key=groq_key,
    )
    return vectorstore, llm


def ask(vectorstore, llm, question: str, top_k: int = 6) -> tuple[str, list]:
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": top_k, "fetch_k": top_k * 3, "lambda_mult": 0.7},
    )
    docs = retriever.invoke(question)
    context = "\n\n".join(d.page_content[:400] for d in docs)
    chain = SYSTEM_PROMPT | llm | StrOutputParser()
    answer = chain.invoke({"context": context, "question": question})
    sources = [
        {
            "hasta_no": d.metadata.get("hasta_no", "?"),
            "cinsiyet":  d.metadata.get("cinsiyet", "?"),
            "department": d.metadata.get("department", "?"),
            "ozet": d.page_content[:200],
        }
        for d in docs
    ]
    return answer, sources


# ─── Veri ─────────────────────────────────────────────────────────────────────
@st.cache_data
def load_data():
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")

    def clean_bracket(val):
        if pd.isna(val):
            return "Bilinmiyor"
        m = re.search(r"\[([^\]]+)\]", str(val))
        return m.group(1).capitalize() if m else str(val).strip().capitalize()

    df["cinsiyet_clean"] = df["cinsiyet"].apply(clean_bracket)
    df["dept_clean"] = df["department"].apply(
        lambda v: re.search(r"\[([^\]]+)\]", str(v)).group(1).strip().title()
        if not pd.isna(v) and re.search(r"\[([^\]]+)\]", str(v)) else "Bilinmiyor"
    )

    def parse_age(val):
        m = re.search(r"\[(\d{4}-\d{2}-\d{2})\]", str(val))
        if m:
            try:
                return (datetime(2024, 1, 1) - datetime.strptime(m.group(1), "%Y-%m-%d")).days // 365
            except Exception:
                return None
        return None

    df["yas"] = df["doğum tarihi"].apply(parse_age)
    df["olum"] = df["ölüm durumu"].apply(lambda x: "Vefat" if x == 1 else "Hayatta")
    return df


# ─── Başlat ───────────────────────────────────────────────────────────────────
vectorstore, llm = load_rag()
df = load_data()

# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("🏥 Onkoloji EHR")
    st.caption("AI destekli hasta kayıt analizi")
    st.divider()

    sayfa = st.radio("Sayfa", ["📊 Dashboard", "💬 AI Asistan"], label_visibility="collapsed")
    st.divider()

    st.subheader("Filtreler")
    cinsiyet_filtre = st.multiselect(
        "Cinsiyet",
        options=df["cinsiyet_clean"].unique().tolist(),
        default=df["cinsiyet_clean"].unique().tolist(),
    )
    dept_opts = sorted(df["dept_clean"].unique().tolist())
    dept_filtre = st.multiselect("Departman", options=dept_opts, default=dept_opts)

    filtered = df[df["cinsiyet_clean"].isin(cinsiyet_filtre) & df["dept_clean"].isin(dept_filtre)]
    st.divider()
    st.caption(f"Seçili hasta: **{len(filtered):,}** / {len(df):,}")


# ─── Dashboard ────────────────────────────────────────────────────────────────
if sayfa == "📊 Dashboard":
    st.title("📊 Onkoloji Hasta Kayıtları — Dashboard")

    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Toplam Hasta", f"{len(df):,}")
    with c2:
        kadin = (df["cinsiyet_clean"] == "Kadın").sum()
        st.metric("Kadın Hasta", f"{kadin:,}", f"%{kadin/len(df)*100:.1f}")
    with c3:
        vefat = (df["olum"] == "Vefat").sum()
        st.metric("Vefat", f"{vefat:,}", f"%{vefat/len(df)*100:.1f}", delta_color="inverse")
    with c4:
        st.metric("Ortalama Yaş", f"{df['yas'].dropna().mean():.1f}")

    st.divider()
    c1, c2 = st.columns(2)

    with c1:
        st.subheader("Cinsiyet Dağılımı")
        fig = px.pie(filtered["cinsiyet_clean"].value_counts().reset_index(),
                     names="cinsiyet_clean", values="count", hole=0.4,
                     color_discrete_sequence=px.colors.qualitative.Pastel)
        fig.update_layout(margin=dict(t=10,b=10,l=10,r=10), height=300)
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        st.subheader("Mortalite Durumu")
        fig = px.bar(filtered["olum"].value_counts().reset_index(),
                     x="olum", y="count", color="olum", text="count",
                     color_discrete_map={"Hayatta": "#2ecc71", "Vefat": "#e74c3c"})
        fig.update_traces(textposition="outside")
        fig.update_layout(showlegend=False, margin=dict(t=10,b=10), height=300)
        st.plotly_chart(fig, use_container_width=True)

    c3, c4 = st.columns(2)
    with c3:
        st.subheader("Departman Dağılımı (İlk 10)")
        dept_df = filtered["dept_clean"].value_counts().head(10).reset_index()
        fig = px.bar(dept_df, x="count", y="dept_clean", orientation="h",
                     color="count", color_continuous_scale="Blues")
        fig.update_layout(yaxis={"categoryorder":"total ascending"},
                          coloraxis_showscale=False, margin=dict(t=10,b=10), height=380)
        st.plotly_chart(fig, use_container_width=True)

    with c4:
        st.subheader("Yaş Dağılımı")
        fig = px.histogram(filtered["yas"].dropna(), nbins=20,
                           color_discrete_sequence=["#3498db"])
        fig.update_layout(xaxis_title="Yaş", yaxis_title="Hasta Sayısı",
                          margin=dict(t=10,b=10), height=380, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("Mortalite × Cinsiyet")
    olum_cins = filtered.groupby(["cinsiyet_clean","olum"]).size().reset_index(name="Sayı")
    fig = px.bar(olum_cins, x="cinsiyet_clean", y="Sayı", color="olum", barmode="group",
                 labels={"cinsiyet_clean":"Cinsiyet","olum":"Durum"},
                 color_discrete_map={"Hayatta":"#2ecc71","Vefat":"#e74c3c"})
    fig.update_layout(margin=dict(t=10,b=10), height=300)
    st.plotly_chart(fig, use_container_width=True)


# ─── AI Asistan ───────────────────────────────────────────────────────────────
else:
    st.title("💬 AI Onkoloji Asistanı")
    st.caption("Llama 3.3 70B • Groq • 1.000 hasta kaydı üzerinde RAG")
    st.divider()

    st.subheader("Örnek Sorular")
    ornekler = [
        "Meme kanseri hastalarında en sık kullanılan kemoterapi ilaçları nelerdir?",
        "Mesane kanseri tanısı olan erkek hastalarda tedavi süreci nasıl?",
        "Medikal onkoloji bölümündeki hastaların mortalite oranı nedir?",
        "Metastatik kanser tanısı olan hastalarda hangi görüntüleme yöntemleri kullanılmış?",
        "Kemoterapi alan hastalarda en sık görülen yan etkiler nelerdir?",
    ]
    cols = st.columns(3)
    ornek_soru = None
    for i, ornek in enumerate(ornekler):
        if cols[i % 3].button(ornek, use_container_width=True):
            ornek_soru = ornek

    st.divider()

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("sources"):
                with st.expander(f"📄 {len(msg['sources'])} kayıt referansı"):
                    for s in msg["sources"]:
                        st.markdown(
                            f"**Hasta:** {s['hasta_no']} | **Cinsiyet:** {s['cinsiyet']} | "
                            f"**Bölüm:** {s['department']}\n\n> {s['ozet']}"
                        )

    soru = st.chat_input("Hasta kayıtları hakkında soru sorun...") or ornek_soru

    if soru:
        st.session_state.messages.append({"role": "user", "content": soru})
        with st.chat_message("user"):
            st.markdown(soru)

        with st.chat_message("assistant"):
            with st.spinner("Yanıt hazırlanıyor..."):
                try:
                    cevap, sources = ask(vectorstore, llm, soru)
                except Exception as e:
                    cevap = f"⚠️ Hata: {e}"
                    sources = []
            st.markdown(cevap)
            if sources:
                with st.expander(f"📄 {len(sources)} kayıt referansı"):
                    for s in sources:
                        st.markdown(
                            f"**Hasta:** {s['hasta_no']} | **Cinsiyet:** {s['cinsiyet']} | "
                            f"**Bölüm:** {s['department']}\n\n> {s['ozet']}"
                        )

        st.session_state.messages.append({"role": "assistant", "content": cevap, "sources": sources})

    if st.session_state.messages:
        if st.button("🗑️ Sohbeti Temizle", use_container_width=True):
            st.session_state.messages = []
            st.rerun()
