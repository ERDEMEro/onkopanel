import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface CancerTypeListItem {
  key: string;
  labelTr: string;
  labelEn: string;
  count: number;
}

export interface CancerTypeDetail {
  key: string;
  labelTr: string;
  labelEn: string;
  totalPatients: number;
  prevalence: number;
  avgAge: number;
  minAge: number | null;
  maxAge: number | null;
  deaths: number;
  mortalityRate: number;
  genderF: number;
  genderM: number;
  ageGroups: { label: string; count: number }[];
  cityDistribution: { label: string; count: number }[];
}

export function useCancerTypeList() {
  return useQuery<CancerTypeListItem[]>({
    queryKey: ["cancer-type-list"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/oncology/cancer-type-list`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCancerTypeDetail(key: string | null) {
  return useQuery<CancerTypeDetail>({
    queryKey: ["cancer-type-detail", key],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/oncology/cancer-type-detail/${key}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!key,
    staleTime: 10 * 60 * 1000,
  });
}
