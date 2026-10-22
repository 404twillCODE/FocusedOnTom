import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const MotionContext = createContext({ disabled: false, toggle: () => {} });
export function MotionProvider({ children }: { children: ReactNode }) {
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    try {
      setDisabled(
        media.matches || localStorage.getItem("fot-motion") === "off",
      );
    } catch {
      setDisabled(media.matches);
    }
    const change = () => setDisabled(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("motion-off", disabled);
    dispatchEvent(new Event("portfolio:motion"));
  }, [disabled]);
  function toggle() {
    const next = !disabled;
    try {
      localStorage.setItem("fot-motion", next ? "off" : "on");
    } catch {}
    setDisabled(next);
  }
  return <MotionContext value={{ disabled, toggle }}>{children}</MotionContext>;
}
export const useMotion = () => useContext(MotionContext);
export function MotionToggle({ id }: { id: string }) {
  const { disabled, toggle } = useMotion();
  return (
    <button id={id} type="button" aria-pressed={disabled} onClick={toggle}>
      Motion: {disabled ? "off" : "on"}
    </button>
  );
}
