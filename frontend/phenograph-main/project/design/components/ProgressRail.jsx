function ProgressRail({ active, dark }) {
  const items = [
    { n: '01', label: 'The read' },
    { n: '02', label: 'The mesh' },
    { n: '03', label: 'The record' },
  ];
  return (
    <nav className={"progress-rail" + (dark ? " dark" : "")} aria-label="Section progress">
      {items.map((it, i) => (
        <div key={it.n} className={"rail-item" + (active === i ? " active" : "")}>
          <span>{it.n} — {it.label}</span>
          <span className="tick" />
        </div>
      ))}
    </nav>
  );
}
window.ProgressRail = ProgressRail;
