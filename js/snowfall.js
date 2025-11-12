// ========================================
// COLOMBIAN CHRISTMAS SNOWFALL ANIMATION
// Con copos de nieve y destellos dorados
// ========================================

class ChristmasParticle {
    constructor() {
        this.reset();
        this.y = Math.random() * window.innerHeight;
        this.opacity = Math.random();
    }

    reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = -20;
        this.speed = 0.5 + Math.random() * 1.5;
        this.size = 2 + Math.random() * 4;
        this.opacity = 0.3 + Math.random() * 0.7;
        this.drift = Math.random() * 2 - 1;

        // 70% copos blancos, 30% destellos dorados (Colombian festive touch)
        this.type = Math.random() > 0.7 ? 'golden' : 'white';

        // Algunos tendrán rotación (estrellas)
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.y += this.speed;
        this.x += this.drift;
        this.rotation += this.rotationSpeed;

        // Reset cuando sale de la pantalla
        if (this.y > window.innerHeight) {
            this.reset();
        }

        // Wrap horizontal
        if (this.x > window.innerWidth) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = window.innerWidth;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'golden') {
            // Destello dorado (Colombian festive sparkle)
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            gradient.addColorStop(0, '#FFBA08');
            gradient.addColorStop(0.5, '#FED766');
            gradient.addColorStop(1, 'rgba(255, 186, 8, 0)');
            ctx.fillStyle = gradient;

            // Estrella de 4 puntas
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                const x = Math.cos(angle) * this.size;
                const y = Math.sin(angle) * this.size;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Copo de nieve blanco
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#FFFFFF';

            // Dibujar copo simple
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Agregar brazos del copo
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = this.size / 4;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const length = this.size * 0.8;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

class ChristmasSnowfall {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80; // Número de partículas

        this.setupCanvas();
        this.createParticles();
        this.animate();

        // Responsive
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const snowfallContainer = document.querySelector('.snowfall');
        if (snowfallContainer) {
            snowfallContainer.appendChild(this.canvas);
        }

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new ChristmasParticle());
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChristmasSnowfall();
    });
} else {
    new ChristmasSnowfall();
}

// ========================================
// AGUINALDO BONUS: Música ambiente (opcional)
// Descomentar para agregar efecto de sonido
// ========================================

/*
function playChristmasAmbience() {
    // Aquí podrías agregar un loop sutil de villancicos o campanas
    // Por ahora es solo un comentario para referencia
    console.log('🎵 Imagina villancicos de Pastor López sonando suavemente...');
}
*/
