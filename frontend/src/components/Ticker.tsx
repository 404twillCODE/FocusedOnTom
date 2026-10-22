import { Fragment, useEffect, useRef } from "react";
const words = [
  "TOM WILLIAMS",
  "CODE AFTER HOURS",
  "TAKE THE SCENIC ROUTE",
  "UPSTATE NEW YORK",
  "ONE MORE FRAME",
  "BUILT FROM CURIOSITY",
  "CAMERA IN HAND",
  "ALWAYS EXPLORING",
];
export default function Ticker() {
  const ticker = useRef<HTMLDivElement>(null),
    group = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () =>
      ticker.current?.style.setProperty(
        "--ticker-duration",
        `${Math.max(45, (group.current?.scrollWidth || 0) / 34)}s`,
      );
    const observer = new ResizeObserver(update);
    if (ticker.current) observer.observe(ticker.current);
    update();
    return () => observer.disconnect();
  }, []);
  const content = [...words, ...words].map((word, index) => (
    <Fragment key={index}>
      <span>{word}</span>
      <b>+</b>
    </Fragment>
  ));
  return (
    <div ref={ticker} className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <div className="ticker-group" ref={group}>
          {content}
        </div>
        <div className="ticker-group">{content}</div>
      </div>
    </div>
  );
}
