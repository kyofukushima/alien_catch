class AlienEvolutionGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resultText = document.getElementById('result-text');
        this.evolutionText = document.getElementById('evolution-text');
        this.levelCount = document.getElementById('level-count');
        this.evolutionStage = document.getElementById('evolution-stage');
        this.speedMultiplier = document.getElementById('speed-multiplier');
        this.explosionCount = document.getElementById('explosion-count');
        this.instructionText = document.getElementById('instruction-text');
        this.instructions = document.querySelector('.instructions');
        
        // Game configuration from provided data
        this.config = {
            baseMeteoriteSpeed: 3.0,
            speedIncrement: 0.5,
            catchWindow: 150,
            successDisplayTime: 500,
            explosionDisplayTime: 1000,
            missAnimationDuration: 500,
            evolutionLevelInterval: 5,
            alienPosition: { x: 0.5, y: 0.75 }
        };
        
        // Game state
        this.gameState = 'waiting'; // waiting, falling, success, miss, explosion, result
        this.meteorite = { x: 0, y: 0, size: 80, visible: false, speed: 0 };
        this.alien = { x: 0, y: 0, size: 120 };
        this.level = 0;
        this.explosions = 0;
        this.currentEvolutionStage = 1;
        this.justEvolved = false;
        
        this.gameStartTime = 0;
        this.stateStartTime = 0;
        this.animationFrame = null;
        this.lastFrameTime = 0;
        this.canvasRect = null;
        
        // Assets
        this.images = {};
        this.imagesLoaded = false;
        
        // Animation properties
        this.explosionScale = 1;
        this.explosionOpacity = 1;
        this.successAnimationTime = 0;
        this.missAnimationTime = 0;
        this.explosionAnimationTime = 0;
        
        this.init();
    }
    
    async init() {
        this.setupCanvas();
        await this.loadAssets();
        this.setupEventListeners();
        this.updateUI();
        this.updateInstructions();
        this.startGameLoop();
    }
    
    setupCanvas() {
        const updateCanvasSize = () => {
            this.canvasRect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            this.canvas.width = this.canvasRect.width * dpr;
            this.canvas.height = this.canvasRect.height * dpr;
            
            this.ctx.scale(dpr, dpr);
            
            // Update positions based on canvas size
            this.alien.x = this.canvasRect.width * this.config.alienPosition.x;
            this.alien.y = this.canvasRect.height * this.config.alienPosition.y;
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    async loadAssets() {
        const gameAssets = {
            spaceBackground: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/573475a2-01fd-4f32-8c52-d66184707d53.png",
            meteorite: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/aa2764ab-868f-47cd-9842-36a3c132df8d.png",
            meteorFire: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/bf78d1e5-02af-4a98-b8c8-e35a1c51a0cf.png",
            explosionFire: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/791bf5dd-f185-4157-a8e4-c72cb49f4724.png",
            stage1: {
                idle: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/0a2cfe8c-4e67-4f98-b365-10c031ce3ca2.png",
                catch: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/2441eb83-e7ed-4e5e-9254-a284c6290d75.png",
                explode: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/d3972a20-95a0-48ba-a847-dcfc9f06478c.png"
            },
            stage2: {
                idle: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/6bbcabb8-b887-4701-adc5-9b7c92096b80.png",
                catch: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/9f454f16-6407-4e2b-b5a4-76b01fd2f5f8.png",
                explode: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/065764bc-4922-4f69-a611-4075a534dea1.png"
            },
            stage3: {
                idle: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/b7ed05a5-498e-4614-9c28-735c5c06bfab.png",
                catch: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/cc3f220d-c7e5-4b67-9fd4-776de1f62cb0.png",
                explode: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/a4489db3-490c-46d7-b3fa-4b15dbcd5602.png"
            },
            stage4: {
                idle: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/da148181-5585-41a8-a9da-88bb1393686f.png",
                catch: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/aafe411f-b3dc-4328-a925-c6f7c9234498.png",
                explode: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/18654cd4-e1ca-40f9-a558-eaa213776518.png"
            },
            stage5: {
                idle: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/fc7a2857-efe2-4814-b6e6-e05b455a6124.png",
                catch: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/9a915321-a0dc-42b7-bc88-ca6e70b5033b.png",
                explode: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/f2e53ec6-72ac-4261-b3d5-a20d1020a1c2.png"
            }
        };
        
        try {
            const loadPromises = [];
            
            // Load basic assets
            ['meteorite', 'meteorFire', 'explosionFire'].forEach(key => {
                loadPromises.push(this.loadImage(key, gameAssets[key]));
            });
            
            // Load evolution stage assets
            for (let stage = 1; stage <= 5; stage++) {
                const stageData = gameAssets[`stage${stage}`];
                ['idle', 'catch', 'explode'].forEach(action => {
                    const assetKey = `stage${stage}_${action}`;
                    loadPromises.push(this.loadImage(assetKey, stageData[action]));
                });
            }
            
            await Promise.all(loadPromises);
            this.imagesLoaded = true;
            console.log('All evolution assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            this.imagesLoaded = true; // Continue with fallbacks
        }
    }
    
    loadImage(key, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.images[key] = img;
                console.log(`Loaded: ${key}`);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${key}, creating fallback`);
                // Create a fallback colored rectangle
                const canvas = document.createElement('canvas');
                canvas.width = 120;
                canvas.height = 120;
                const ctx = canvas.getContext('2d');
                
                // Different colors for different assets
                const colors = {
                    meteorite: '#8B4513',
                    meteorFire: '#FF4500',
                    explosionFire: '#FF6600'
                };
                
                // Evolution stage colors
                if (key.includes('stage1')) colors[key] = '#00FF00';
                else if (key.includes('stage2')) colors[key] = '#00DDDD';
                else if (key.includes('stage3')) colors[key] = '#9900FF';
                else if (key.includes('stage4')) colors[key] = '#FF4400';
                else if (key.includes('stage5')) colors[key] = '#FFD700';
                
                // Create a circular shape for better visibility
                ctx.fillStyle = colors[key] || '#FFFFFF';
                ctx.beginPath();
                ctx.arc(60, 60, 50, 0, 2 * Math.PI);
                ctx.fill();
                
                // Add text label
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(key.replace('stage', 'S'), 60, 65);
                
                this.images[key] = canvas;
                resolve();
            };
            img.src = url;
        });
    }
    
    getEvolutionStage() {
        return Math.min(Math.floor(this.level / this.config.evolutionLevelInterval) + 1, 5);
    }
    
    getCurrentSpeedMultiplier() {
        return 1.0 + (this.level * this.config.speedIncrement);
    }
    
    getAlienSprite(action) {
        const stage = this.currentEvolutionStage;
        const key = `stage${stage}_${action}`;
        return this.images[key] || this.getFallbackSprite(stage, action);
    }
    
    getFallbackSprite(stage, action) {
        // Try previous stages if current stage fails
        for (let s = stage - 1; s >= 1; s--) {
            const key = `stage${s}_${action}`;
            if (this.images[key]) return this.images[key];
        }
        return null;
    }
    
    setupEventListeners() {
        const handleTap = (e) => {
            e.preventDefault();
            
            if (this.gameState === 'falling') {
                this.checkCatch();
            } else if (this.gameState === 'waiting') {
                this.startRound();
            }
        };
        
        const handleStartTap = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.gameState === 'waiting') {
                this.startRound();
                this.instructions.classList.add('pulse');
                setTimeout(() => {
                    this.instructions.classList.remove('pulse');
                }, 300);
            }
        };
        
        // Touch events for mobile on canvas
        this.canvas.addEventListener('touchstart', handleTap, { passive: false });
        
        // Mouse events for desktop on canvas
        this.canvas.addEventListener('click', handleTap);
        
        // Make instruction button clickable
        this.instructions.addEventListener('click', handleStartTap);
        this.instructions.addEventListener('touchstart', handleStartTap, { passive: false });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    updateInstructions() {
        switch (this.gameState) {
            case 'waiting':
                this.instructionText.textContent = 'タップしてスタート！';
                this.instructions.style.pointerEvents = 'auto';
                break;
            case 'falling':
                this.instructionText.textContent = 'タップしてキャッチ！';
                this.instructions.style.pointerEvents = 'none';
                break;
            case 'miss':
                this.instructionText.textContent = '続けてください！';
                this.instructions.style.pointerEvents = 'none';
                break;
            case 'result':
                this.instructionText.textContent = '次のラウンドまで待機中...';
                this.instructions.style.pointerEvents = 'none';
                break;
            default:
                this.instructionText.textContent = 'タップしてキャッチ！';
                this.instructions.style.pointerEvents = 'none';
        }
    }
    
    updateUI() {
        this.levelCount.textContent = this.level;
        this.evolutionStage.textContent = this.currentEvolutionStage;
        this.speedMultiplier.textContent = `${this.getCurrentSpeedMultiplier().toFixed(1)}x`;
        this.explosionCount.textContent = this.explosions;
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.animationFrame = requestAnimationFrame(gameLoop);
        };
        
        this.animationFrame = requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        const currentTime = Date.now();
        
        switch (this.gameState) {
            case 'waiting':
                this.updateInstructions();
                break;
                
            case 'falling':
                // Update meteorite position with current speed
                this.meteorite.y += this.meteorite.speed;
                this.meteorite.visible = true;
                
                // Check if meteorite hit the alien (automatic explosion) - FIXED: Only when close to alien position
                const alienBottom = this.alien.y + this.alien.size / 2;
                if (this.meteorite.y >= alienBottom - 20) {
                    // Since meteorite always falls directly toward alien, it will hit unless caught
                    this.handleExplosion();
                    break;
                }
                
                this.updateInstructions();
                break;
                
            case 'success':
                this.successAnimationTime += deltaTime;
                break;
                
            case 'miss':
                this.missAnimationTime += deltaTime;
                
                // After miss interval, continue the same round
                if (currentTime - this.stateStartTime >= this.config.missAnimationDuration) {
                    this.continueFalling();
                }
                break;
                
            case 'explosion':
                this.explosionAnimationTime += deltaTime;
                // Handle explosion animation
                this.explosionScale = Math.min(this.explosionScale + deltaTime * 0.002, 2);
                this.explosionOpacity = Math.max(1 - (this.explosionAnimationTime * 0.0005), 0.3);
                break;
                
            case 'result':
                // Auto-restart after result display time
                if (currentTime - this.stateStartTime >= (this.justEvolved ? 2500 : this.config.successDisplayTime)) {
                    this.resetRound();
                }
                this.updateInstructions();
                break;
        }
    }
    
    render() {
        if (!this.canvasRect) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasRect.width, this.canvasRect.height);
        
        // Draw meteorite and effects during falling/miss states
        if ((this.gameState === 'falling' || this.gameState === 'miss') && this.meteorite.visible) {
            this.drawMeteoriteWithTrail();
        }
        
        // Draw explosion effects during explosion state
        if (this.gameState === 'explosion') {
            this.drawExplosion();
        }
        
        // Draw alien
        this.drawAlien();
        
        // Draw caught meteorite during success state
        if (this.gameState === 'success') {
            this.drawCaughtMeteorite();
        }
    }
    
    drawAlien() {
        if (!this.imagesLoaded) return;
        
        let alienImage;
        let alienScale = 1;
        
        switch (this.gameState) {
            case 'success':
                alienImage = this.getAlienSprite('catch');
                // Add a small bounce animation for success
                alienScale = 1 + Math.sin(this.successAnimationTime * 0.01) * 0.1;
                break;
            case 'miss':
                alienImage = this.getAlienSprite('idle');
                break;
            case 'explosion':
                alienImage = this.getAlienSprite('explode');
                break;
            default:
                alienImage = this.getAlienSprite('idle');
                break;
        }
        
        if (alienImage) {
            const size = this.alien.size * alienScale;
            this.ctx.drawImage(
                alienImage,
                this.alien.x - size / 2,
                this.alien.y - size / 2,
                size,
                size
            );
        }
    }
    
    drawMeteoriteWithTrail() {
        if (!this.imagesLoaded) return;
        
        const meteoriteImg = this.images.meteorite;
        const fireImg = this.images.meteorFire;
        
        // Draw fire trail behind meteorite
        if (fireImg) {
            const trailLength = 120;
            const trailCount = 5;
            
            for (let i = 0; i < trailCount; i++) {
                const alpha = (trailCount - i) / trailCount * 0.8;
                const offsetY = i * 30;
                const scale = 1 - (i * 0.1);
                
                this.ctx.globalAlpha = alpha;
                this.ctx.drawImage(
                    fireImg,
                    this.meteorite.x - (40 * scale),
                    this.meteorite.y - trailLength - offsetY,
                    80 * scale,
                    trailLength * scale
                );
            }
            this.ctx.globalAlpha = 1;
        }
        
        // Draw meteorite
        if (meteoriteImg) {
            const size = this.meteorite.size;
            this.ctx.drawImage(
                meteoriteImg,
                this.meteorite.x - size / 2,
                this.meteorite.y - size / 2,
                size,
                size
            );
        }
    }
    
    drawCaughtMeteorite() {
        if (!this.imagesLoaded) return;
        
        const meteoriteImg = this.images.meteorite;
        if (meteoriteImg) {
            // Draw caught meteorite above alien
            const size = this.meteorite.size * 0.8;
            const bobOffset = Math.sin(this.successAnimationTime * 0.01) * 5;
            this.ctx.drawImage(
                meteoriteImg,
                this.alien.x - size / 2,
                this.alien.y - size - 30 + bobOffset,
                size,
                size
            );
        }
    }
    
    drawExplosion() {
        if (!this.imagesLoaded) return;
        
        const explosionImg = this.images.explosionFire;
        if (explosionImg) {
            this.ctx.globalAlpha = this.explosionOpacity;
            
            const size = 160 * this.explosionScale;
            this.ctx.drawImage(
                explosionImg,
                this.alien.x - size / 2,
                this.alien.y - size / 2,
                size,
                size
            );
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    startRound() {
        this.gameState = 'falling';
        this.gameStartTime = Date.now();
        this.stateStartTime = Date.now();
        
        this.spawnNewMeteorite();
        
        // Reset animation properties
        this.explosionScale = 1;
        this.explosionOpacity = 1;
        this.successAnimationTime = 0;
        this.missAnimationTime = 0;
        this.explosionAnimationTime = 0;
    }
    
    spawnNewMeteorite() {
        // Meteorite always falls directly toward alien's exact position
        this.meteorite.x = this.alien.x;
        this.meteorite.y = -this.meteorite.size;
        
        // Apply current speed multiplier
        const speedMultiplier = this.getCurrentSpeedMultiplier();
        this.meteorite.speed = this.config.baseMeteoriteSpeed * speedMultiplier;
        this.meteorite.visible = true;
    }
    
    continueFalling() {
        this.gameState = 'falling';
        this.stateStartTime = Date.now();
        
        // Spawn new meteorite for continued round
        this.spawnNewMeteorite();
    }
    
    checkCatch() {
        // Check if meteorite is in catch range of alien - FIXED: Proper collision detection
        const distanceX = Math.abs(this.meteorite.x - this.alien.x);
        const distanceY = Math.abs(this.meteorite.y - this.alien.y);
        
        const catchRange = this.config.catchWindow;
        const verticalTolerance = 100;
        
        // Must be within both horizontal and vertical range
        if (distanceX <= catchRange / 2 && 
            this.meteorite.y > this.alien.y - verticalTolerance && 
            this.meteorite.y < this.alien.y + 50) {
            this.handleSuccess();
        } else {
            this.handleMiss();
        }
    }
    
    handleSuccess() {
        this.gameState = 'success';
        this.stateStartTime = Date.now();
        this.meteorite.visible = false;
        this.level++;
        
        // Check for evolution - FIXED: Proper evolution trigger
        const newEvolutionStage = this.getEvolutionStage();
        if (newEvolutionStage > this.currentEvolutionStage) {
            this.currentEvolutionStage = newEvolutionStage;
            this.justEvolved = true;
            this.showEvolution();
            
            // Add evolution flash effect to canvas
            this.canvas.classList.add('evolution-flash');
            setTimeout(() => {
                this.canvas.classList.remove('evolution-flash');
            }, 500);
        } else {
            this.justEvolved = false;
        }
        
        this.updateUI();
        this.showResult('成功！', 'success');
        
        // Add visual feedback to level counter
        this.levelCount.parentElement.classList.add('pulse');
        setTimeout(() => {
            this.levelCount.parentElement.classList.remove('pulse');
        }, 300);
        
        setTimeout(() => {
            this.gameState = 'result';
            this.stateStartTime = Date.now();
        }, this.config.successDisplayTime);
    }
    
    handleMiss() {
        this.gameState = 'miss';
        this.stateStartTime = Date.now();
        this.missAnimationTime = 0;
        
        this.showResult('ミス！', 'miss');
        
        setTimeout(() => {
            this.resultText.className = 'result-text hidden';
        }, this.config.missAnimationDuration - 200);
    }
    
    handleExplosion() {
        this.gameState = 'explosion';
        this.stateStartTime = Date.now();
        this.explosionAnimationTime = 0;
        this.meteorite.visible = false;
        
        // Reset level and evolution on explosion - FIXED: Proper reset
        this.level = 0;
        this.currentEvolutionStage = 1;
        this.explosions++;
        this.justEvolved = false;
        
        this.updateUI();
        this.showResult('爆発！', 'explosion');
        
        // Add visual feedback to explosion counter
        this.explosionCount.parentElement.classList.add('shake');
        setTimeout(() => {
            this.explosionCount.parentElement.classList.remove('shake');
        }, 500);
        
        setTimeout(() => {
            this.gameState = 'result';
            this.stateStartTime = Date.now();
        }, this.config.explosionDisplayTime);
    }
    
    showResult(text, type) {
        this.resultText.textContent = text;
        this.resultText.className = `result-text show ${type}`;
        
        if (type !== 'miss') {
            setTimeout(() => {
                this.resultText.className = 'result-text hidden';
            }, (type === 'explosion' ? this.config.explosionDisplayTime : this.config.successDisplayTime) - 200);
        }
    }
    
    showEvolution() {
        this.evolutionText.className = 'evolution-text show';
        
        setTimeout(() => {
            this.evolutionText.className = 'evolution-text hidden';
        }, 2000);
    }
    
    resetRound() {
        this.gameState = 'waiting';
        this.justEvolved = false;
        this.updateInstructions();
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const game = new AlienEvolutionGame();
        
        // Handle page visibility change to pause/resume
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (game.animationFrame) {
                    cancelAnimationFrame(game.animationFrame);
                }
            } else {
                game.startGameLoop();
            }
        });
    }, 100);
});

// Prevent scrolling and zooming on mobile
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});