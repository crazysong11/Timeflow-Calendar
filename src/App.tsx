export default function App() {
  return (
    <main className="welcome">
      <p className="brand">Timeflow Calendar</p>
      <h1>时间，从此刻开始。</h1>
      <p className="description">让时间连续呈现，让每一刻都成为新的起点。</p>
      <div className="flow" aria-hidden="true">
        <span />
        <span />
        <span className="now" />
        <span />
        <span />
      </div>
    </main>
  );
}
