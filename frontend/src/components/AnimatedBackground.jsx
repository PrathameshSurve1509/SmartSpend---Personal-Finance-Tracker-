import "./AnimatedBackground.css";
export default function AnimatedBackground() {
  return (
    <div className="nature-background" aria-hidden="true">
      <div className="sun-glow">
        <div className="sun" />
      </div>

      {/* Moving clouds */}
      <div className="cloud cloud-one">
        <span />
        <span />
        <span />
      </div>

      <div className="cloud cloud-two">
        <span />
        <span />
        <span />
      </div>

      <div className="cloud cloud-three">
        <span />
        <span />
        <span />
      </div>

      {/* Layered landscape */}
      <div className="hill hill-back" />
      <div className="hill hill-middle" />
      <div className="hill hill-front" />
      <div className="forest-ground" />

      {/* Small forest silhouettes */}
      <div className="forest">
        {Array.from({ length: 15 }, (_, i) => (
          <span
            key={i}
            className="tree"
            style={{
              left: `${i * 7.2 - 2}%`,
              transform: `scale(${0.55 + ((i * 7) % 5) * 0.12})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
