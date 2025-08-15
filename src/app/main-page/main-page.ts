import { AfterViewInit, Component, computed, effect, inject, Injector, input, runInInjectionContext, signal, viewChild, WritableSignal } from '@angular/core';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule, MatFabButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MorseEngine, Morse, MorseCode, StandardMorseCodeCharacterDictionary } from 'morseengine'
import { MMorseAudioComposition, MMorseCode, MMorseEngine, MMorseSynthesizer } from 'morseengine/internal'
import { SliderControlComponent } from '../components/slider-control-component/slider-control-component';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-main-page',
  imports: [
    TextFieldModule,
    MatButtonModule,
    // MatFabButton,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSliderModule,
    SliderControlComponent,
    MatTabsModule
  ],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage implements AfterViewInit {
  private readonly injector = inject(Injector);
  private readonly morseEngine = Morse.engine;

  readonly title = input("Morse Coder");
  readonly titleMorseCode = computed(() => Morse.engine.textToMorseString(this.title()))

  readonly morseCode = signal<MorseCode>(new MMorseCode([]));

  readonly playButton = viewChild<HTMLButtonElement>("playButton");
  readonly pitchControl = viewChild<SliderControlComponent>("pitchControl");
  readonly speedControl = viewChild<SliderControlComponent>("speedControl");

  private synth: MMorseSynthesizer | undefined = undefined;

  constructor() {

  }

  onPlayButtonClick() {
    if (!this.synth)
      return;

    const button = this.playButton()!;

    button.disabled = true;

    let ac = this.synth.synthesize(this.morseCode());
    ac.start();
    setTimeout(() => button.disabled = false, (ac as MMorseAudioComposition).params.compositionDurationSeconds * 1000);
  }

  ngAfterViewInit(): void {
    this.synth = initViewController(
      this.morseEngine,
      this.morseCode
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (this.synth)
          this.synth.speed = this.speedControl()!.value();
      });

      effect(() => {
        if (this.synth)
          this.synth.frequency = this.pitchControl()!.value();
      });
    });
  }
}


function initViewController(
  morseEngine: MorseEngine,
  morseCodeSignal: WritableSignal<MorseCode>
): MMorseSynthesizer {
  let textElement = document.getElementById("textElement")! as HTMLTextAreaElement;
  let codeElement = document.getElementById("codeElement")! as HTMLTextAreaElement;
  let binaryElement = document.getElementById("binaryElement")! as HTMLTextAreaElement;


  function updateMorseCode(latest: MorseCode) {
    morseCodeSignal.set(latest);

    binaryElement.value = morseCodeSignal().toBinary().join("");
  }

  // Accessing internal code
  // Fix after update
  const engineImpl = (morseEngine as MMorseEngine<StandardMorseCodeCharacterDictionary>);
  const morseElementDict = engineImpl.elementRegistry.getDictionary();
  const characterDictionary = engineImpl.characterCodeRegistry.getDictionary();

  textElement.oninput = () => {
    textElement.value = textElement.value
      .split("")
      .map(char => char.toUpperCase())
      .filter(char => Object.keys(characterDictionary).includes(char))
      .join("");

    updateMorseCode(morseEngine.textToMorseObject(textElement.value));
    codeElement.value = morseCodeSignal().toString();
  }

  codeElement.oninput = () => {
    codeElement.value = codeElement.value
      .split("")
      .filter(sym =>
        Object.values(morseElementDict)
          .map(ele => ele.toString())
          .includes(sym)
      )
      .join("");

    updateMorseCode(morseEngine.morseStringToMorseObject(codeElement.value))
    textElement.value = morseEngine.morseObjectToText(morseCodeSignal());
  }

  return new MMorseSynthesizer(morseElementDict);
}
