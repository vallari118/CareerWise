import { Component, OnInit, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router'
import { ApiService } from '../api.service';
import { EventEmitterService} from '../event-emitter.service';
import { DOCUMENT} from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-profile',
  templateUrl: './page-profile.component.html',
  styleUrls: ['./page-profile.component.css']
})
export class PageProfileComponent implements OnInit {

  constructor(private title : Title,
    private api : ApiService,
    private route : ActivatedRoute,
    private events : EventEmitterService,
    @Inject(DOCUMENT) private document :Document ) { }

  ngOnInit(): void {
    this.document.getElementById("sidebarToggleTop").classList.add("d-none");
    this.title.setTitle("Career Wise - Profile");

    
    
    let userDataEvent = this.events.getUserData.subscribe((user)=>{
      let paramsSubscription = this.route.params.subscribe((params)=>{
        this.showPosts = 6;

        if(user._id == params.userid){
          
          this.setComponentValues(user);
          this.resetBooleans();
          
        }
        else {
          
          this.canSendMessage = true;
  
          let requestObject = {
            location : `users/get-user-data/${params.userid}`,
            method: "GET"
          }
  
          this.api.makeRequests(requestObject).then((data)=>{
            
            if(data.statusCode == 200){
              //console.log(user); //The person who has logged in
              //data.user is the person whose profile we are visiting
              
              
              this.canAddUser = user.friends.includes(data.user._id) ? false : true;
              //console.log("CAN ADD USER ",this.canAddUser);

              this.haveRecievedFriendRequest = user.friends_requests.includes(data.user._id);

              this.haveSentFriendRequest = data.user.friends_requests.includes(user._id) ? true : false;

              if(this.canAddUser){this.showPosts = 0;}

              this.setComponentValues(data.user);
            }
          });
        }

        
      });

      this.subscriptions.add(userDataEvent);
        this.subscriptions.add(paramsSubscription);


    });

    
  }

  ngOnDestroy(){
    
    this.subscriptions.unsubscribe();
  }


  public randomFriends: string[] = [];
  public totalFriends: number=0;
  public posts: object[]=[];
  public profilePicture: string = "default-avatar";
  public showPosts: number=6;
  public usersName : string="";
  public usersEmail : string = "";
  public usersId : string="";

  public canAddUser: boolean = false;
  public canSendMessage : boolean = false;
  public haveSentFriendRequest : boolean = false;
  public haveRecievedFriendRequest : boolean = false;

  private subscriptions = new Subscription();

  public showMorePosts(){
    this.showPosts += 6;
  }

  public backToTop(){
    this.document.body.scrollTop = this.document.documentElement.scrollTop = 0;
  }

  public setComponentValues(user){
    this.randomFriends = user.random_friends;
    this.profilePicture = user.profile_image;
    this.posts = user.posts;
    this.usersName = user.name;
    this.usersEmail = user.email;
    this.totalFriends = user.friends.length;
    this.usersId = user._id;
  }

  public accept(){
    
    this.api.resolveFriendRequest("accept", this.usersId).then((val)=>{
      //val.statusCode gave error so it is replaced with this
      if(val['statusCode'] == 201){
        this.haveRecievedFriendRequest = false;
        this.canAddUser = false;
        this.totalFriends++;
      } 
    });
    this.showPosts = 6;
  }

  public decline(){
    
    this.api.resolveFriendRequest("decline", this.usersId).then((val : any)=>{
      //another way to solve the error is write val : any
      if(val.statusCode == 201){
        this.haveRecievedFriendRequest = false;
       
      } 
    });
    

  }

  public makeFriendRequest(){
    this.api.makeFriendRequest(this.usersId).then((val)=>{
     // console.log(val);
      if(val['statusCode'] == 201){ this.haveSentFriendRequest = true;}

    });
  }

  private resetBooleans(){
    this.canAddUser = false;
    this.haveRecievedFriendRequest = false;
    this.haveSentFriendRequest = false;
    this.canSendMessage = false;
  }

  public updateSendMessageObject(id, name){
    //known as shorthand-object creation - means same as
    //{id : id, name:name}
    this.events.updateSendMessageObjectEvent.emit({id, name});
  }

}
