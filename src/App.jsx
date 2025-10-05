import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const shapesList = ["circle", "square", "triangle"];
const shapeColors = {
  circle: "#ff4d6d",
  square: "#4dff9d",
  triangle: "#4da6ff",
  bomb: "#ff0000",
  golden: "#ffd700",
};

const levelSettings = [
  { level: 1, targetScore: 5, speed: 2, spawnInterval: 800, bombChance: 0.05, goldenChance: 0.05 },
  { level: 2, targetScore: 10, speed: 3, spawnInterval: 700, bombChance: 0.06, goldenChance: 0.05 },
  { level: 3, targetScore: 15, speed: 4, spawnInterval: 600, bombChance: 0.07, goldenChance: 0.05 },
  { level: 4, targetScore: 20, speed: 5, spawnInterval: 500, bombChance: 0.08, goldenChance: 0.06 },
  { level: 5, targetScore: 25, speed: 6, spawnInterval: 450, bombChance: 0.10, goldenChance: 0.06 },
  { level: 6, targetScore: 35, speed: 7, spawnInterval: 400, bombChance: 0.12, goldenChance: 0.07 },
  { level: 7, targetScore: 45, speed: 8, spawnInterval: 350, bombChance: 0.15, goldenChance: 0.08 },
  { level: 8, targetScore: 60, speed: 10, spawnInterval: 300, bombChance: 0.18, goldenChance: 0.08 },
];

export default function CatchTheShape() {
  const [shapes, setShapes] = useState([]);
  const [score, setScore] = useState(0);
  const [targetShape, setTargetShape] = useState("circle");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [particles, setParticles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const animationRef = useRef();
  const spawnRef = useRef();
  const nextParticleId = useRef(0);

  // Initialize sound after first interaction
  const enableSound = () => {
    setSoundEnabled(true);
    window.removeEventListener("touchstart", enableSound);
    window.removeEventListener("mousedown", enableSound);
  };

  useEffect(() => {
    window.addEventListener("touchstart", enableSound);
    window.addEventListener("mousedown", enableSound);
    return () => {
      window.removeEventListener("touchstart", enableSound);
      window.removeEventListener("mousedown", enableSound);
    };
  }, []);

  // Spawn shapes
  const spawnShape = useCallback(() => {
    const level = levelSettings[currentLevel];
    const rand = Math.random();
    let type;

    if (rand < level.goldenChance) type = "golden";
    else if (rand < level.goldenChance + level.bombChance) type = "bomb";
    else type = shapesList[Math.floor(Math.random() * shapesList.length)];

    const newShape = {
      id: Date.now(),
      type,
      left: Math.random() * (window.innerWidth - 60),
      top: -60,
    };

    setShapes(prev => [...prev, newShape].slice(-30)); // Limit max 30 shapes
    spawnRef.current = setTimeout(spawnShape, level.spawnInterval);
  }, [currentLevel]);

  useEffect(() => {
    spawnShape();
    return () => clearTimeout(spawnRef.current);
  }, [spawnShape]);

  // Target shape change
  useEffect(() => {
    const interval = setInterval(() => {
      const newTarget = shapesList[Math.floor(Math.random() * shapesList.length)];
      setTargetShape(newTarget);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Animate shapes and particles
  const animateShapes = useCallback(() => {
    setShapes(prev =>
      prev
        .map(s => ({ ...s, top: s.top + levelSettings[currentLevel].speed }))
        .filter(s => s.top < window.innerHeight)
    );

    setParticles(prev =>
      prev
        .map(p => ({ ...p, life: p.life - 1 }))
        .filter(p => p.life > 0)
    );

    animationRef.current = requestAnimationFrame(animateShapes);
  }, [currentLevel]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animateShapes);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animateShapes]);

  const createParticles = (x, y, color) => {
    const newParticles = [];
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 30 + 20;
      newParticles.push({
        id: nextParticleId.current++,
        x,
        y,
        color,
        dx: Math.cos(angle) * distance / 10,
        dy: Math.sin(angle) * distance / 10,
        life: 10,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleShapeTap = (id, type, left, top) => {
    let newScore = score;

    const playSound = (url) => {
      if (!soundEnabled) return;
      const audio = new Audio(url);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    if (type === targetShape || type === "golden") {
      newScore += type === "golden" ? 5 : 1;
      playSound("/sounds/correct.mp3");
    } else if (type === "bomb") {
      newScore = Math.max(0, newScore - 5);
      playSound("/sounds/bomb.mp3");
    } else {
      newScore = Math.max(0, newScore - 1);
      playSound("/sounds/wrong.mp3");
    }

    setScore(newScore);
    setShapes(prev => prev.filter(s => s.id !== id));
    createParticles(left, top, shapeColors[type]);

    // Level progression
    if (newScore >= levelSettings[currentLevel].targetScore) {
      const nextLevel = currentLevel + 1;
      if (nextLevel < levelSettings.length) {
        setCurrentLevel(nextLevel);
        setLevelUp(true);
        playSound("/sounds/levelup.mp3");
        setTimeout(() => setLevelUp(false), 2000);
      } else {
        setScore(0);
        setCurrentLevel(0);
        setLevelUp(true);
        playSound("/sounds/levelup.mp3");
        setTimeout(() => setLevelUp(false), 2000);
      }
    }
  };

  return (
    <div className="game-container">
      <h1>🦋 Catch the Shape!</h1>
      <p>🚀 Score: {score}</p>
      <p>⭐ Level: {levelSettings[currentLevel].level}</p>
      <p>🎯 Target Score: {levelSettings[currentLevel].targetScore}</p>

      {levelUp && <div className="level-up">🎉 Level Up! 🎉</div>}

      <h2>
        Catch all <span style={{ color: shapeColors[targetShape] }}>{targetShape}s</span>!
      </h2>

      <div className="game-area">
        {shapes.map(shape => {
          let display = "";
          if (shape.type === "bomb") display = "💣";
          else if (shape.type === "golden") display = "🌟";

          return (
            <div
              key={shape.id}
              className={`shape ${shape.type}`}
              style={{
                left: shape.left,
                top: shape.top,
                background: shape.type === "triangle" || shape.type === "bomb" || shape.type === "golden" ? "none" : shapeColors[shape.type],
                borderBottom: shape.type === "triangle" ? `50px solid ${shapeColors.triangle}` : "",
                fontSize: shape.type === "bomb" || shape.type === "golden" ? "2rem" : "initial",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => handleShapeTap(shape.id, shape.type, shape.left, shape.top)}
              onTouchStart={() => handleShapeTap(shape.id, shape.type, shape.left, shape.top)}
            >
              {display}
            </div>
          );
        })}

        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.x + p.dx * (10 - p.life),
              top: p.y + p.dy * (10 - p.life),
              background: p.color,
            }}
          />
        ))}
      </div>
    </div>
  );
}
