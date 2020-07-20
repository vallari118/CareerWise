import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../api.service';
import { Subscription, from } from 'rxjs';
import { EventEmitterService} from '../event-emitter.service';
import { ChangeDetectorRef } from '@angular/core'
import { flatten } from '@angular/compiler';

@Component({
  selector: 'app-page-messages',
  templateUrl: './page-messages.component.html',
  styleUrls: ['./page-messages.component.css']
})
export class PageMessagesComponent implements OnInit {

  constructor(private title : Title,
    private events : EventEmitterService,
    private api : ApiService,
    private cdRef : ChangeDetectorRef
    ) { }

  ngOnInit(): void {
    this.title.setTitle("Career Wise - Messages");
    this.api.resetMessageNotification();

    if(history.state.data && history.state.data.msgId){
      this.activeMessage.fromId = history.state.data.msgId;
      //console.log("First If: ", this.activeMessage.fromId);
    }

    let userDataEvent = this.events.getUserData.subscribe((user)=>{
      if(!user.messages.length){return;}
      this.activeMessage.fromId = this.activeMessage.fromId || user.messages[0].from_id;
      this.usersName = user.name;
      this.messages = user.messages.reverse();
      this.usersId = user._id;
      this.usersProfilePicture = user.profile_image;

      //console.log("User data event: ", this.activeMessage.fromId);
      this.setActiveMessage(this.activeMessage.fromId);
    });

    this.subscriptions.add(userDataEvent);
    
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  

  public activeMessage = {
    fromId : "",
    fromName : "",
    fromProfilePicture : "",
    messageGroups : []
  }

  public messages = [];
  public usersId = "";
  public usersName = "";
  public usersProfilePicture = "";
  public newMessage = "";
  private subscriptions = new Subscription();

  public setActiveMessage(id){
    
    

    for(let message of this.messages){
      if(message.from_id == id){
        this.activeMessage.fromId = message.from_id;
        this.activeMessage.fromName = message.messengerName;
        this.activeMessage.fromProfilePicture = message.messengerProfileImage;
        
        let groups = (this.activeMessage.messageGroups=[]);

        for(let content of message.content){
           
          let me = (content.messenger == this.usersId);

          //to check who sent the last msg
          //If the same person sends the msg then we will collapse that msgs into groups
          if(groups.length){
            var lastMessengerId = groups[groups.length -1].id; 

            //checking if last msg sender is same as current msg sender
            if(content.messenger == lastMessengerId){
              groups[groups.length -1].messages.push(content.message);
              continue;
            }
          }

          let group = {
            image : me ? this.usersProfilePicture : message.messengerProfileImage,
            name : me ? "ME" : message.messengerName,
            id : content.messenger,
            messages : [content.message],
            isMe : me
          }

          groups.push(group);

        }
       // console.log(this.activeMessage);
      }
    }
    
    this.cdRef.detectChanges();
  }

  public sendMessage(){
    if(!this.newMessage){ return; }

    let obj = {
      content : this.newMessage,
      id : this.activeMessage.fromId
    }

    
    this.api.sendMessage(obj, false).then((val)=>{
      
      if(val['statusCode'] == 201){
        
        let groups = this.activeMessage.messageGroups;
        if(groups[groups.length -1].isMe){
          groups[groups.length -1].messages.push(this.newMessage);
        } else {
          let newGroup = {
            image : this.usersProfilePicture,
            name : this.usersName,
            id : this.usersId,
            messages : [this.newMessage],
            isMe : true
          }
          groups.push(newGroup);
        }

        for(let message of this.messages){
          if(message.from_id == this.activeMessage.fromId){
            let newContent = {
              message : this.newMessage,
              messenger : this.usersId
            }
            message.content.push(newContent);

          }
        }

        this.newMessage = "";
      }
      this.cdRef.detectChanges();
      
    });

    
    
    
  }

  public deleteMessage(msgId){
    let requestObject = {
      location:`users/delete-message/${msgId}`,
      method : "POST"
    }

    this.api.makeRequests(requestObject).then((val)=>{
      if(val.statusCode == 201){
        for(let i=0 ; i<this.messages.length; i++){
          if(this.messages[i]._id == msgId){
            this.messages.splice(i,1);
            this.setActiveMessage(this.messages[0].from_id);
            break;
          }
        }
      }
    });
    
  }

}
