import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import api from "../../services/api";
import "./SpinWheel.css";

const SpinWheel = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(user?.hasUsedSpinWheel || false);
  const [wonPrize, setWonPrize] = useState(null);
  const [saving, setSaving] = useState(false);

  const prizes = [
    { label: "10% OFF", color: "#667eea", discount: 10, code: "SPIN10" },
    { label: "15% OFF", color: "#f093fb", discount: 15, code: "SPIN15" },
    { label: "5% OFF", color: "#4facfe", discount: 5, code: "SPIN5" },
    { label: "20% OFF", color: "#43e97b", discount: 20, code: "SPIN20" },
    { label: "¡Gratis!", color: "#f5576c", discount: 100, code: "SPINFREE" },
    { label: "8% OFF", color: "#ffa751", discount: 8, code: "SPIN8" },
    { label: "12% OFF", color: "#38f9d7", discount: 12, code: "SPIN12" },
    { label: "25% OFF", color: "#764ba2", discount: 25, code: "SPIN25" },
  ];

  useEffect(() => {
    drawWheel(0);
  }, []);

  const drawWheel = (currentRotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / prizes.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    prizes.forEach((prize, i) => {
      const start = (currentRotation * Math.PI) / 180 + i * sliceAngle;
      const end = start + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.label, radius - 15, 5);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleSpin = () => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);

    const winnerIndex = Math.floor(Math.random() * prizes.length);
    const sliceAngle = 360 / prizes.length;
    const baseSpins = 1800;
    const targetAngle = 360 - (winnerIndex * sliceAngle + sliceAngle / 2);
    const totalRotation = baseSpins + targetAngle;

    let currentRot = 0;
    let speed = 20;
    let frame = 0;
    const increment = totalRotation / 100;

    const animate = () => {
      frame++;
      if (frame < 30) {
        speed = Math.min(speed + increment * 0.5, increment * 10);
      } else {
        speed = Math.max(speed * 0.97, 0.5);
      }
      currentRot += speed;
      drawWheel(currentRot);

      if (currentRot < totalRotation) {
        requestAnimationFrame(animate);
      } else {
        // Terminó — persistir en backend
        finalizeSpin(prizes[winnerIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const finalizeSpin = async (prize) => {
    setSaving(true);
    try {
      // Persistir en el servidor
      const response = await api.put("/auth/spin", {
        prizeLabel: prize.label,
        discount: prize.discount, // ✅ Enviar el descuento
      });

      // Actualizar contexto local
      updateUser({ hasUsedSpinWheel: true });
      setHasSpun(true);

      // ✅ ACTUALIZAR EL CÓDIGO DEL PREMIO CON EL REAL
      const realPrize = {
        ...prize,
        code: response.data.couponCode, // Código real del backend
      };
      setWonPrize(realPrize);

      toast.success(
        `🎉 ¡Ganaste: ${prize.label}! Código: ${response.data.couponCode}`,
      );
    } catch (error) {
      // Si ya lo había usado (race condition), igualmente marcar
      if (error.response?.status === 400) {
        updateUser({ hasUsedSpinWheel: true });
        setHasSpun(true);
        toast.warning("Ya habías usado tu ruleta");
      } else {
        toast.error("Error al guardar el premio, intenta de nuevo");
      }
    } finally {
      setIsSpinning(false);
      setSaving(false);
    }
  };

  return (
    <div className="spin-wheel-page">
      <div className="wheel-container">
        <div className="wheel-header">
          <h1>🎰 Ruleta de Descuentos</h1>
          <p>
            {hasSpun
              ? "Ya usaste tu turno de ruleta"
              : "¡Gira la ruleta y gana un cupón de descuento!"}
          </p>
        </div>

        <div className="wheel-wrapper">
          <div className="wheel-pointer">▼</div>
          <canvas
            ref={canvasRef}
            width={350}
            height={350}
            className={`wheel-canvas ${isSpinning ? "spinning" : ""}`}
          />
          {!hasSpun && (
            <Button
              variant="primary"
              size="large"
              onClick={handleSpin}
              loading={isSpinning || saving}
              disabled={isSpinning || saving}
              className="spin-btn"
            >
              {isSpinning
                ? "¡Girando..."
                : saving
                  ? "Guardando..."
                  : "🎯 ¡GIRAR!"}
            </Button>
          )}
        </div>

        {wonPrize && (
          <div className="prize-result">
            <div className="prize-card">
              <div className="prize-emoji">🎉</div>
              <h2>¡Felicitaciones!</h2>
              <p>Ganaste un cupón de</p>
              <div className="prize-value">{wonPrize.label}</div>
              <div className="prize-code">
                <span>Código:</span>
                <strong>{wonPrize.code}</strong>
              </div>
              <p className="prize-note">
                Usa este código en tu próxima compra en el paso de checkout.
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate("/productos")}
              >
                ¡Ir a comprar!
              </Button>
            </div>
          </div>
        )}

        {hasSpun && !wonPrize && (
          <div className="already-spun">
            <p>Ya utilizaste tu ruleta de bienvenida.</p>
            <Button
              variant="secondary"
              onClick={() => navigate("/cliente/ordenes")}
            >
              Ver mis órdenes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
