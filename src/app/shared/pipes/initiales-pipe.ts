import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initiales',
})
export class InitialesPipe implements PipeTransform {
  transform(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .map((mot) => mot[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
