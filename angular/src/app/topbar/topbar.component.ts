import { Component, OnInit} from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../local-storage.service';
import { EventEmitterService} from '../event-emitter.service';

import { ApiService } from '../api.service';
import { AutoUnsubscribe } from '../unsubscribe';
import { Subscription } from 'rxjs';



@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})


export class TopbarComponent implements OnInit {

  constructor(private auth : AuthService,
    private router : Router,
    private storage : LocalStorageService,
    private events : EventEmitterService,
    
    private api : ApiService
    ) { }

  ngOnInit(): void {


    //To decryprt the token and take the name out of it
    this.userName = this.storage.getParsedToken().name;
    this.usersId = this.storage.getParsedToken()._id;

    let alertEvent = this.events.onAlertEvent.subscribe((msg)=>{
      
      this.alertMessage = msg;
    });

    let friendRequestEvent = this.events.updateNumOfFriendRequestsEvent.subscribe((msg)=>{
      this.notifications.friendRequests--;
    });


    let userDataEvent = this.events.getUserData.subscribe((user)=>{
      
      this.notifications.friendRequests = user.friends_requests.length;
      this.notifications.messages = user.new_message_notifications.length;
      this.notifications.alerts = user.new_notifications;
      this.profilePicture = user.profile_image;
      
      this.setAlerts(user.notifications);
      
      this.setMessagePreview(user.messages, user.new_message_notifications);
      
    });

    let updateMessageEvent = this.events.updateSendMessageObjectEvent.subscribe((d)=>{
      this.sendMessageObject.id = d.id;
      this.sendMessageObject.name = d.name;
    });

    let resetMessagesEvent = this.events.resetMessageNotificationsEvent.subscribe(()=>{
      this.notifications.messages = 0;
    })

    let requestObject = {
      location : `users/get-user-data/${this.usersId}`,
      method : "GET",
      
    }

    this.api.makeRequests(requestObject).then((val)=>{
      // console.log(val);
      this.events.getUserData.emit(val.user);
    });
    

    this.subscriptions.add(alertEvent);
    this.subscriptions.add(friendRequestEvent);
    this.subscriptions.add(userDataEvent);
    this.subscriptions.add(updateMessageEvent);
    this.subscriptions.add(resetMessagesEvent);


  }

  ngOnDestroy(){
    
    this.subscriptions.unsubscribe();
  }

 
  

  public doAuth(){
    return this.auth.logout();
  }

  public query : string = "";
  private subscriptions = new Subscription();
  public alertMessage : string = "";

  //User Data
  public userName : string = "";
  public usersId: string = "";
  public profilePicture : string = "default-avatar";
  public messagePreviews = [];
  public alerts = [];
  public notifications = {
    alerts : 0,
    friendRequests : 0,
    messages : 0
  }

  

 // public userData : any={}; //don't keep as object then it produces the error. IMP
  

  public sendMessageObject = {
    id : "",
    name : "",
    content : ""
  }

  public searchForFriends(){
    // console.log(this.query);
    // console.log("Search For Friends");
    this.router.navigate(['/search-results', { query : this.query}])
    
  }

  public sendMessage(){
    this.api.sendMessage(this.sendMessageObject);
    this.sendMessageObject.content="";

  }

  public resetMessageNotifications(){
    if(this.notifications.messages == 0) {return;}
    this.api.resetMessageNotification();
  }

  public resetAlertNotifications(){
    if(this.notifications.alerts == 0) {return;}
    let requestObject = {
      location : "users/reset-alert-notifications",
      method : "POST"
    }

    this.api.makeRequests(requestObject).then((val)=>{
      if(val.statusCode == 201){
        this.notifications.alerts =0;
      }
    });
  }

  private setMessagePreview(messages, messageNotifications){
    for(let i = messages.length-1 ; i>=0; i--){
      let lastMessage = messages[i].content[messages[i].content.length -1];

      let preview = {
        messengerName : messages[i].messengerName,
        messageContent : lastMessage.message,
        messengerImage : "",
        messengerId : messages[i].from_id,
        isNew : false
      }

      if(lastMessage.messenger == this.usersId){
        preview.messengerImage = this.profilePicture;
      } else {
        preview.messengerImage = messages[i].messengerProfileImage;
        if(messageNotifications.includes(messages[i].from_id)){
          preview.isNew = true;
        }
      }

      if(preview.isNew){
        this.messagePreviews.unshift(preview);
      } else{
        this.messagePreviews.push(preview);
      }
    }
  }

  public messageLink(messageId){
    this.router.navigate(['/messages'], {state : {data : { msgId : messageId }}});
  }

  public setAlerts(notificationData){
    

    for(let alert of notificationData){
      let alertObj = JSON.parse(alert);
      
      let newAlert = {
        text : alertObj.alert_text,
        icon : "",
        bgColor : "",
        href : ""
      }

      switch(alertObj.alert_type){
        case "new_friend" :
          newAlert.icon = "fa-user-check";
          newAlert.bgColor = "bg-success";
          newAlert.href = `/profile/${alertObj.from_id}`;
          break;
        case "liked_post" :
          newAlert.icon = "fa-thumbs-up";
          newAlert.bgColor = "bg-purple";
          newAlert.href = `/profile/${this.usersId}`;
          break;
        case "commented_post" :
          newAlert.icon = "fa-comment";
          newAlert.bgColor = "bg-primary";
          newAlert.href = `/profile/${this.usersId}`;
          break;
    
      }
      this.alerts.push(newAlert);
    }
  }

  



}
