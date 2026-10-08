import { Component, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-landing-page',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage implements AfterViewInit {

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  menuOuvert = signal(false);
  carouselIndex = signal(0);
  carouselOffset = signal(0);
  readonly carouselTotal = 6;
  private touchStartX = 0;
  private cardWidth = 0;

  ngAfterViewInit(): void {
    this.updateCardWidth();
  }

  private updateCardWidth(): void {
    if (this.carouselContainer) {
      this.cardWidth = this.carouselContainer.nativeElement.offsetWidth;
    }
  }

  toggleMenu(): void { this.menuOuvert.update(v => !v); }
  fermerMenu(): void { this.menuOuvert.set(false); }

  scrollVers(id: string): void {
    this.fermerMenu();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  carouselNext(): void {
    if (this.carouselIndex() < this.carouselTotal - 1) {
      const next = this.carouselIndex() + 1;
      this.carouselIndex.set(next);
      this.carouselOffset.set(-(next * (this.cardWidth + 16)));
    }
  }

  carouselPrev(): void {
    if (this.carouselIndex() > 0) {
      const prev = this.carouselIndex() - 1;
      this.carouselIndex.set(prev);
      this.carouselOffset.set(-(prev * (this.cardWidth + 16)));
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.cardWidth = window.innerWidth - 32;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (deltaX < -50) {
      this.carouselNext();
    } else if (deltaX > 50) {
      this.carouselPrev();
    }
  }

  onMouseDown(event: MouseEvent): void {
    this.touchStartX = event.clientX;
    this.cardWidth = window.innerWidth - 32;
  }

  onMouseUp(event: MouseEvent): void {
    const deltaX = event.clientX - this.touchStartX;
    if (deltaX < -50) {
      this.carouselNext();
    } else if (deltaX > 50) {
      this.carouselPrev();
    }
  }
}
