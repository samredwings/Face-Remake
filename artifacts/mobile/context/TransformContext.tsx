import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface TransformResult {
  id: string;
  originalUri: string;
  resultUri: string;
  style: string;
  styleLabel: string;
  styleColor: string;
  createdAt: number;
}

interface TransformContextType {
  selectedPhoto: string | null;
  setSelectedPhoto: (uri: string | null) => void;
  history: TransformResult[];
  addToHistory: (result: TransformResult) => void;
  deleteFromHistory: (id: string) => void;
}

const TransformContext = createContext<TransformContextType | null>(null);

const HISTORY_KEY = "@remakeface_history_v1";

export function TransformProvider({ children }: { children: React.ReactNode }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [history, setHistory] = useState<TransformResult[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then((stored) => {
        if (stored) setHistory(JSON.parse(stored));
      })
      .catch(() => {});
  }, []);

  const addToHistory = useCallback(async (result: TransformResult) => {
    setHistory((prev) => {
      const updated = [result, ...prev].slice(0, 50);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  return (
    <TransformContext.Provider
      value={{
        selectedPhoto,
        setSelectedPhoto,
        history,
        addToHistory,
        deleteFromHistory,
      }}
    >
      {children}
    </TransformContext.Provider>
  );
}

export function useTransform() {
  const ctx = useContext(TransformContext);
  if (!ctx) throw new Error("useTransform must be used inside TransformProvider");
  return ctx;
}
