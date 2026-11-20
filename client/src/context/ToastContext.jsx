import { createContext, useCallback, useContext, useState } from "react";

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

// Small pop-up message: notify("Saved") or notify("Error text", "error")
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);

  const notify = useCallback((text, type = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <Ctx.Provider value={notify}>
      {children}
      <div className="toasts">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.text}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
