const MAZE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M%200%2030%20L%2050%2030%20L%2050%200%20M%2030%2080%20L%2030%2050%20L%2080%2050' stroke='white' stroke-opacity='.03' stroke-width='10' fill='none' stroke-linecap='square'/%3E%3C/svg%3E")`;

const TutorialCenterPageBackground = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Teal gradient — bright at top, very dark teal at bottom */}
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(to bottom, #032825 0%, #011410 8%, #010a08 20%, #010a08 100%)",
      }}
    />
    {/* Maze pattern across full height */}
    <div
      className="absolute inset-0"
      style={{ backgroundImage: MAZE, backgroundSize: "80px 80px" }}
    />
  </div>
);

export default TutorialCenterPageBackground;
