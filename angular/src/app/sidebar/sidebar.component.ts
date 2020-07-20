import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { EventEmitterService} from '../event-emitter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  constructor(private auth : AuthService,
    private events : EventEmitterService,
    ) { }

  ngOnInit(): void {
    let userDataEvent = this.events.getUserData.subscribe((data)=>{
      this.userData = data;
     
    });
    this.subscriptions.add(userDataEvent);
  }

  ngOnDestroy(){
    
    this.subscriptions.unsubscribe();
  }

  public doAuth(){
    return this.auth.logout();
  }

  public userData : any={};
  private subscriptions = new Subscription();

}
