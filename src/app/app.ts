import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonRouterOutlet, IonMenuButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, peopleOutline, cubeOutline, briefcaseOutline, cartOutline, statsChartOutline, trendingUpOutline, barChartOutline, mapOutline, chatbubbleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    ChatbotComponent,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonRouterOutlet,
    IonMenuButton
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'SalesPOC';

  constructor() {
    addIcons({ 
      homeOutline, 
      peopleOutline, 
      cubeOutline, 
      briefcaseOutline, 
      cartOutline, 
      statsChartOutline, 
      trendingUpOutline, 
      barChartOutline, 
      mapOutline, 
      chatbubbleOutline 
    });
  }
}
