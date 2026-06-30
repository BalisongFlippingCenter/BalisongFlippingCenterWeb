const MAZE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M%200%2030%20L%2050%2030%20L%2050%200%20M%2030%2080%20L%2030%2050%20L%2080%2050' stroke='white' stroke-opacity='.03' stroke-width='10' fill='none' stroke-linecap='square'/%3E%3C/svg%3E")`;

const TutorialCenterPageBackground = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #0d6b65 0%, #074440 50%, #021a18 100%)",
      }}
    />
    <div
      className="absolute inset-0"
      style={{ backgroundImage: MAZE, backgroundSize: "80px 80px" }}
    />
  </div>
);

export default TutorialCenterPageBackground;
