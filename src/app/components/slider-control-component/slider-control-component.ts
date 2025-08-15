import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, input, model, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-slider-control',
  imports: [
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSliderModule,
  ],
  templateUrl: './slider-control-component.html',
  styleUrl: './slider-control-component.scss'
})
export class SliderControlComponent implements OnInit {
  readonly name = input("");
  readonly min = input(0);
  readonly max = input(0);
  readonly step = input(1);
  readonly initialValue = input(0);
  readonly value = model(0);

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 100) / 10 + 'k';
    }

    return `${value}`;
  }

  getValueFieldWidth(): number {
    return Math.max(5, String(this.max()).length * 1.1);
  }

  ngOnInit(): void {
    this.value.set(this.initialValue());
  }
}
