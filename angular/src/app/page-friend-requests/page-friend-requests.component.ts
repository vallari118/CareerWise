import { Component, OnInit, Inject } from '@angular/core';
import { EventEmitterService } from '../event-emitter.service'
import { ApiService } from '../api.service';
import { Title } from '@angular/platform-browser';
import { DOCUMENT} from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-friend-requests',
  templateUrl: './page-friend-requests.component.html',
  styleUrls: ['./page-friend-requests.component.css']
})
export class PageFriendRequestsComponent implements OnInit {

  constructor(
    
    private api : ApiService,
    private title : Title,
    private events : EventEmitterService, 
    @Inject(DOCUMENT) private document :Document
    ) { }

  ngOnInit(): void {
    this.document.getElementById("sidebarToggleTop").classList.add("d-none");
    this.title.setTitle("Career Wise - Friend Request");

    let userDataEvent = this.events.getUserData.subscribe((data)=>{
      this.userData = data;
      
      

      let array = JSON.stringify(data.friends_requests);

      let requestObject = {
        location : `users/get-friend-request?friends_requests=${array}`,
        method : "GET",
        
      }

      this.api.makeRequests(requestObject).then((val)=> {
        if(val.statusCode === 200){
          
          this.friendRequests = val.user;
          
        }
          
      });

    });

    this.subscriptions.add(userDataEvent);

  }

  ngOnDestroy(){
    //console.log("DESTROY");
    this.subscriptions.unsubscribe();
  }



  public userData : any={};
  public friendRequests = [];
  private subscriptions = new Subscription();

  public updateFriendRequests(id){
    let arr = this.friendRequests;
   for(let i=0; i<arr.length ; i++){
     //console.log(arr[i]);
     if(arr[i]._id == id){
       arr.splice(i,1);
       break;
     }

   }
  }

}
