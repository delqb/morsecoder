import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { Morse, MorseCode, StandardMorseCodeCharacterDictionary } from 'morseengine'
import { MMorseAudioComposition, MMorseCode, MMorseEngine, MMorseSynthesizer } from 'morseengine/internal'
import { SliderControlComponent } from '../components/slider-control-component/slider-control-component';
import { MatTabsModule } from '@angular/material/tabs';
import { Component, input, computed, model, signal, effect } from '@angular/core';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-main-page',
  imports: [
    TextFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSliderModule,
    SliderControlComponent,
    MatTabsModule,
    MatDivider
  ],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage {
  private readonly morseEngine = Morse.engine;

  // Accessing internal code
  // Fix after update
  private readonly engineImpl = (this.morseEngine as MMorseEngine<StandardMorseCodeCharacterDictionary>);
  private readonly morseElementDict = this.engineImpl.elementRegistry.getDictionary();
  private readonly characterDictionary = this.engineImpl.characterCodeRegistry.getDictionary();
  private readonly morseSynthesizer = new MMorseSynthesizer(this.morseElementDict);
  //

  readonly title = input("Morse Coder");
  readonly titleMorseCode = computed(() => this.morseEngine.textToMorseString(this.title()));

  readonly text = model<string>("");
  readonly morseCode = model<MorseCode>(new MMorseCode([]));
  readonly morseCodeString = model<string>("");
  readonly morseBinaryString = model<string>("");

  readonly pitch = model<number>(0);
  readonly speed = model<number>(0);
  readonly isPlaying = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.morseSynthesizer.speed = this.speed();
    });

    effect(() => {
      this.morseSynthesizer.frequency = this.pitch();
    });
  }

  onPlayButtonClick() {
    this.isPlaying.set(true);

    let audioComposition = this.morseSynthesizer.synthesize(this.morseCode());
    audioComposition.start();

    setTimeout(
      () => this.isPlaying.set(false),
      (audioComposition as MMorseAudioComposition).params.compositionDurationSeconds * 1000
    );
  }

  updateMorseCode(latest: MorseCode) {
    this.morseCode.set(latest);
    this.morseBinaryString.set(latest.toBinary().join(""));
  }

  updateMorseCodeString(newValue?: MorseCode) {
    this.morseCodeString.set((newValue ?? this.morseCode()).toString());
  }

  updateText(newValue?: MorseCode) {
    this.text.set(this.morseEngine.morseObjectToText((newValue ?? this.morseCode())));
  }

  onTextInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const filtered = target.value
      .toUpperCase()
      .split('')
      .filter(char => Object.keys(this.characterDictionary).includes(char))
      .join('');

    target.value = filtered;

    const latest = this.morseEngine.textToMorseObject(filtered);
    this.updateMorseCode(latest);
    this.updateMorseCodeString(latest);

  }

  onCodeInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const allowedSymbols = Object.values(this.morseElementDict).map(ele => ele.toString());

    const filtered = target.value
      .split('')
      .filter(sym => allowedSymbols.includes(sym))
      .join('');

    target.value = filtered;

    const latest = this.morseEngine.morseStringToMorseObject(filtered);
    this.updateMorseCode(latest);
    this.updateText(latest);
  }
}