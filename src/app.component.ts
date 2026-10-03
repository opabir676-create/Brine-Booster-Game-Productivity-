import { Component, ChangeDetectionStrategy, signal, effect, afterNextRender, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { LoaderComponent } from './components/loader/loader.component';
import { BottomNavComponent } from './components/layout/bottom-nav.component';
import { SettingsService } from './services/settings.service';
import { inject } from '@angular/core';
import { filter } from 'rxjs/operators';
import { ModalService } from './services/modal.service';
import { ApiKeyModalComponent } from './components/shared/api-key-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoaderComponent, BottomNavComponent, ApiKeyModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  isLoading = signal(true);
  settingsService = inject(SettingsService);
  modalService = inject(ModalService);
  private router = inject(Router);

  isNavVisible = signal(true);
  isChatRoute = signal(false);
  private lastScrollY = 0;
  private scrollThreshold = 50; // pixels to scroll before triggering hide/show

  constructor() {
    // Simulate app loading
    setTimeout(() => this.isLoading.set(false), 2500);

    this.applyGlobalEffects();
    
    // Re-initialize parallax effect on cards after navigation
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isChatRoute.set(event.urlAfterRedirects.startsWith('/chat'));
      setTimeout(() => this.setupParallaxCards(), 100); 
    });

    afterNextRender(() => {
        this.setupParallaxCards();
        document.addEventListener('pointerdown', this.handleInteraction);
    });
  }
  
  ngOnInit() {
    window.addEventListener('scroll', this.onWindowScroll);
  }

  ngOnDestroy() {
    document.removeEventListener('pointerdown', this.handleInteraction);
    window.removeEventListener('scroll', this.onWindowScroll);
  }
  
  onWindowScroll = () => {
    if (this.isChatRoute()) {
        this.isNavVisible.set(true);
        return;
    }
    const scrollY = window.scrollY;

    if (Math.abs(scrollY - this.lastScrollY) < this.scrollThreshold) {
      return; // Ignore small scrolls
    }

    if (scrollY > this.lastScrollY && scrollY > 100) {
      // Scrolled down
      this.isNavVisible.set(false);
    } else {
      // Scrolled up
      this.isNavVisible.set(true);
    }
    this.lastScrollY = scrollY <= 0 ? 0 : scrollY;
  }
  
  private applyGlobalEffects(): void {
    this.handleAnimations();
    this.applyGranularAnimationEffects();
    this.handleTheme();
    this.handleUiScale();
    this.handleCardEffects();
    this.handleBackgroundGrid();
  }
  
  private handleAnimations(): void {
     effect(() => {
      const animationsOn = this.settingsService.animationsOn();
      document.body.classList.toggle('animations-disabled', !animationsOn);
    });
  }

  private applyGranularAnimationEffects(): void {
    effect(() => {
      const master = this.settingsService.animationsOn();
      document.body.classList.toggle('loading-animation-disabled', !master || !this.settingsService.loadingAnimation());
      document.body.classList.toggle('background-animations-disabled', !master || !this.settingsService.backgroundAnimations());
      document.body.classList.toggle('card-animations-disabled', !master || !this.settingsService.cardAnimations());
      document.body.classList.toggle('ui-animations-disabled', !master || !this.settingsService.uiAnimations());
      document.body.classList.toggle('game-animations-disabled', !master || !this.settingsService.gameAnimations());
    });
  }

  private handleTheme(): void {
    effect(() => {
      document.documentElement.style.setProperty('--theme-color-primary', this.settingsService.themeColor());
      document.documentElement.style.setProperty('--card-glow-color', this.settingsService.cardGlowColor());
      document.documentElement.style.setProperty('--nav-lighting-opacity', `${this.settingsService.lightingIntensity() / 100}`);
    });
  }

  private handleUiScale(): void {
    effect(() => {
      document.body.style.setProperty('zoom', `${this.settingsService.uiScale()}%`);
    });
  }

  private handleCardEffects(): void {
     effect(() => {
      // Card Smoke/Glow
      const cardSmokeOpacity = this.settingsService.cardSmokeOn() ? this.settingsService.cardSmokeIntensity() : 0;
      document.documentElement.style.setProperty('--card-smoke-opacity', `${cardSmokeOpacity}`);

      // Card Border Lighting
      const intensity = this.settingsService.cardLightingIntensity();
      const cardLightingOpacity = Math.min(1, 0.8 + (intensity / 6) * 0.4);
      const cardLightingBlur = 1 + (intensity / 6) * 8;
      const cardHoverGlowSize = 15 + intensity * 5;
      
      document.documentElement.style.setProperty('--card-lighting-opacity', `${cardLightingOpacity}`);
      document.documentElement.style.setProperty('--card-lighting-blur', `${cardLightingBlur.toFixed(2)}px`);
      document.documentElement.style.setProperty('--card-hover-glow-size', `${cardHoverGlowSize.toFixed(2)}px`);
      document.documentElement.style.setProperty('--card-lighting-speed', `${this.settingsService.cardLightingSpeed()}s`);
      document.documentElement.style.setProperty('--card-border-thickness', `${this.settingsService.cardBorderThickness()}px`);

      // Card Border Animation Style
      const cardBorderAnimation = this.settingsService.cardBorderAnimation();
      const borderAnimations = ['rotate', 'pulse', 'chase', 'sweep', 'meteor', 'electric'];
      borderAnimations.forEach(anim => {
        document.body.classList.toggle(`card-border-${anim}-enabled`, anim === cardBorderAnimation);
      });

      // Card Hover Effect
      const cardHoverEffectOn = this.settingsService.cardHoverEffectOn();
      document.body.classList.toggle('card-hover-enabled', cardHoverEffectOn);
      if (cardHoverEffectOn) {
        const intensityRatio = this.settingsService.cardHoverIntensity() / 100;
        const translateY = -1 - (intensityRatio * 9); // from -1px to -10px
        const scale = 1.01 + (intensityRatio * 0.04); // from 1.01 to 1.05
        document.documentElement.style.setProperty('--card-hover-translate-y', `${translateY.toFixed(2)}px`);
        document.documentElement.style.setProperty('--card-hover-scale', `${scale.toFixed(3)}`);
      }

      // Card 3D Effect
      const card3dOn = this.settingsService.card3dOn();
      document.body.classList.toggle('card-3d-enabled', card3dOn);
      document.body.classList.toggle('card-3d-disabled', !card3dOn);

      // Card Shimmer Effect
      const cardShimmerOn = this.settingsService.cardShimmerOn();
      document.body.classList.toggle('card-shimmer-enabled', cardShimmerOn);
      if (cardShimmerOn) {
        document.documentElement.style.setProperty('--card-shimmer-intensity', `${this.settingsService.cardShimmerIntensity()}%`);
        document.documentElement.style.setProperty('--card-shimmer-color', this.settingsService.cardShimmerColor());
        const cardShimmerAnimation = this.settingsService.cardShimmerAnimation();
        const shimmerAnimations = ['slide', 'pulse', 'diag', 'radar'];
        shimmerAnimations.forEach(anim => {
          document.body.classList.toggle(`card-shimmer-${anim}-enabled`, anim === cardShimmerAnimation);
        });
      } else {
        ['slide', 'pulse', 'diag', 'radar'].forEach(anim => document.body.classList.remove(`card-shimmer-${anim}-enabled`));
      }
    });
  }
  
  private handleBackgroundGrid(): void {
    effect(() => {
      const gridLinesOn = this.settingsService.gridLinesOn();
      const gridLineIntensity = this.settingsService.gridLineIntensity();
      document.documentElement.style.setProperty('--grid-line-intensity', `${gridLinesOn ? gridLineIntensity : 0}%`);
    });
  }

  private handleInteraction = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      if (['range', 'color', 'checkbox', 'radio', 'button', 'submit'].includes(target.getAttribute('type') ?? '')) return;
      
      // Delay to allow keyboard to show
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }
  
  private setupParallaxCards(root: HTMLElement = document.body) {
    const cards = root.querySelectorAll('.futuristic-card:not([data-parallax-init])');
    cards.forEach(cardEl => {
        const card = cardEl as HTMLElement;
        card.dataset.parallaxInit = 'true';

        card.addEventListener('mousemove', (e: MouseEvent) => {
            if (this.settingsService.card3dOn()) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const tiltIntensity = this.settingsService.cardTiltDegree();
                const tiltX = (y / rect.height - 0.5) * -1 * tiltIntensity;
                const tiltY = (x / rect.width - 0.5) * tiltIntensity;
                card.style.setProperty('--tilt-x', `${tiltX}deg`);
                card.style.setProperty('--tilt-y', `${tiltY}deg`);
            }
        });

        card.addEventListener('mouseleave', () => {
             card.style.setProperty('--tilt-x', '0deg');
             card.style.setProperty('--tilt-y', '0deg');
        });
    });
  }
}