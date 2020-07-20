import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, RouterEvent } from '@angular/router';
import { ApiService } from '../api.service';
import { Title } from '@angular/platform-browser';
import { DOCUMENT} from '@angular/common';
import { EventEmitterService} from '../event-emitter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-searches',
  templateUrl: './page-searches.component.html',
  styleUrls: ['./page-searches.component.css']
})
export class PageSearchesComponent implements OnInit {
  

  constructor(private route : ActivatedRoute,
    private api : ApiService,
    private events : EventEmitterService,
    private title : Title,
    @Inject(DOCUMENT) private document :Document
    ) { }

  

  ngOnInit(): void {
    this.title.setTitle("Career Wise - Search");
    this.document.getElementById("sidebarToggleTop").classList.add("d-none");

    let userDataEvent = this.events.getUserData.subscribe((data)=>{
      let paramsSubscription = this.route.params.subscribe(params =>{
      this.query = params.query;
      
      
        this.user = data;
        this.getResults();

        
        });
        this.subscriptions.add(userDataEvent);
        this.subscriptions.add(paramsSubscription);

  
    });

    
    
  }

  ngOnDestroy(){
   // console.log("DESTROY");
    this.subscriptions.unsubscribe();
  }

  public results;
  public query = this.route.snapshot.params.query;
  private user;
  private subscriptions = new Subscription();

  private getResults(){
    let requestObject = {
      location : `users/get-search-results?query=${this.query}`,
      method : "GET",
      
    }

    this.api.makeRequests(requestObject).then((val) => {
      this.results = val.results;

      //user --> Logged in User (You)
      //result --> searched user
      for(let result of this.results){
        
        
        if(result.friends.includes(this.user._id)){
          result.isFriend = true;
        }
        if(result.friends_requests.includes(this.user._id)){
          result.haveSentFriendRequest = true;
        }
        if(this.user.friends_requests.includes(result._id)){
          
          result.haveRecievedFriendRequest = true;
        }

      }
    });
    

  }

}
