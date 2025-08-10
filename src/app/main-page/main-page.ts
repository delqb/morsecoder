import { AfterViewInit, Component, computed, input } from '@angular/core';
import { TextFieldModule } from '@angular/cdk/text-field';

import { MorseEngine, Morse, MorseCode, StandardMorseCodeCharacterDictionary } from 'morseengine'
import { MMorseAudioComposition, MMorseCode, MMorseEngine, MMorseSynthesizer } from 'morseengine/internal'
const morseEngine = Morse.engine;

@Component({
  selector: 'app-main-page',
  imports: [TextFieldModule],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage implements AfterViewInit {
  readonly title = input("Morse Coder");
  readonly titleMorseCode = computed(() => Morse.engine.textToMorseString(this.title()))

  ngAfterViewInit(): void {
    initViewController(morseEngine);
  }
}

function initViewController(
  morseEngine: MorseEngine
) {
  let textElement = document.getElementById("textElement")! as HTMLTextAreaElement;
  let codeElement = document.getElementById("codeElement")! as HTMLTextAreaElement;
  let binaryElement = document.getElementById("binaryElement")! as HTMLTextAreaElement;
  let listenButton = document.getElementById("listenButton")! as HTMLButtonElement;
  let frequencyElement = document.getElementById("synthFrequencyElement")! as HTMLInputElement;
  let frequencyElementValue = document.getElementById("synthFrequencyElementValue")! as HTMLDivElement;
  let speedElement = document.getElementById("synthSpeedElement")! as HTMLInputElement;
  let speedElementValue = document.getElementById("synthSpeedElementValue")! as HTMLDivElement;

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

  function updateSynthesizerParameterView() {
    frequencyElement.value = "" + morseSynthesizer.frequency;
    frequencyElementValue.innerText = frequencyElement.value + "Hz";

    speedElement.value = "" + morseSynthesizer.speed;
    speedElementValue.innerText = speedElement.value + "x";
  }

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

  frequencyElement.oninput = () => {
    morseSynthesizer.frequency = parseFloat(frequencyElement.value);
    updateSynthesizerParameterView();
  }

  speedElement.oninput = () => {
    morseSynthesizer.speed = parseFloat(speedElement.value);
    updateSynthesizerParameterView();
  }

  updateSynthesizerParameterView();

  listenButton.onclick = () => {
    listenButton.disabled = true;

    let ac = morseSynthesizer.synthesize(latestMorseCode);
    ac.start();
    setTimeout(() => listenButton.disabled = false, (ac as MMorseAudioComposition).params.compositionDurationSeconds * 1000);
  }
}
