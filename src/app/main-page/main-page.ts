import { AfterViewInit, Component, computed, effect, inject, Injector, input, runInInjectionContext, signal, viewChild } from '@angular/core';
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
import { MatDivider } from '@angular/material/divider';
const morseEngine = Morse.engine;

@Component({
  selector: 'app-main-page',
  imports: [
    TextFieldModule,
    MatButtonModule,
    MatFabButton,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSliderModule,
    SliderControlComponent
  ],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage implements AfterViewInit {
  private readonly injector = inject(Injector);

  readonly title = input("Morse Coder");
  readonly titleMorseCode = computed(() => Morse.engine.textToMorseString(this.title()))

  readonly pitchControl = viewChild<SliderControlComponent>("pitchControl");
  readonly speedControl = viewChild<SliderControlComponent>("speedControl");

  ngAfterViewInit(): void {

    const synth = initViewController(
      morseEngine
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        synth.speed = this.speedControl()!.value();
      });

      effect(() => {
        synth.frequency = this.pitchControl()!.value();
      });
    });
  }
}


function initViewController(
  morseEngine: MorseEngine
): MMorseSynthesizer {
  let textElement = document.getElementById("textElement")! as HTMLTextAreaElement;
  let codeElement = document.getElementById("codeElement")! as HTMLTextAreaElement;
  let binaryElement = document.getElementById("binaryElement")! as HTMLTextAreaElement;
  let listenButton = document.getElementById("listenButton")! as HTMLButtonElement;

  let latestMorseCode: MorseCode = new MMorseCode([]);

  function updateMorseCode(latest: MorseCode) {
    latestMorseCode = latest;

    binaryElement.value = latestMorseCode.toBinary().join("");
    console.log(binaryElement.value.replaceAll("", ","))
  }

  // Accessing internal code
  // Fix after update
  const engineImpl = (morseEngine as MMorseEngine<StandardMorseCodeCharacterDictionary>);
  const morseElementDict = engineImpl.elementRegistry.getDictionary();
  const characterDictionary = engineImpl.characterCodeRegistry.getDictionary();
  const morseSynthesizer = new MMorseSynthesizer(morseElementDict);

  textElement.oninput = () => {
    textElement.value = textElement.value
      .split("")
      .map(char => char.toUpperCase())
      .filter(char => Object.keys(characterDictionary).includes(char))
      .join("");

    updateMorseCode(morseEngine.textToMorseObject(textElement.value));
    codeElement.value = latestMorseCode.toString();
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
    textElement.value = morseEngine.morseObjectToText(latestMorseCode);
  }

  listenButton.onclick = () => {
    listenButton.disabled = true;

    let ac = morseSynthesizer.synthesize(latestMorseCode);
    ac.start();
    setTimeout(() => listenButton.disabled = false, (ac as MMorseAudioComposition).params.compositionDurationSeconds * 1000);
  }

  return morseSynthesizer;
}
