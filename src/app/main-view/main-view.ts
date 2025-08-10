import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayout } from '../main-layout/main-layout';


@Component({
  selector: 'app-main-view',
  imports: [RouterOutlet, MainLayout],
  templateUrl: './main-view.html',
  styleUrl: './main-view.scss'
})
export class MainView {

}
