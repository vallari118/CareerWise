import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {ApiService } from '../api.service';
import { LocalStorageService } from '../local-storage.service';
import { EventEmitterService} from '../event-emitter.service';


@Component({
  selector: 'app-result-request',
  templateUrl: './result-request.component.html',
  styleUrls: ['./result-request.component.css']
})
export class ResultRequestComponent implements OnInit {



  //It recieves object of resultRequestComponent from the parent component
  //which is the friend-request-component
  @Input() resultRequest;
  //Similar to alert service
  @Output() resultRequestChange = new EventEmitter<any>();
  @Input() use;
  constructor( public api : ApiService,
    private events : EventEmitterService,
    private storage : LocalStorageService) { }

  ngOnInit(): void {
    if(this.resultRequest.haveSentFriendRequest )
    {this.haveSentFriendRequest = true};

    if(this.resultRequest.haveRecievedFriendRequest )
    {this.haveRecievedFriendRequest = true};

    if(this.resultRequest.isFriend )
    {this.isFriend = true};
    

  }

  public accept(){
    this.updateRequest();
    this.api.resolveFriendRequest("accept",this.resultRequest._id).then((val)=>{
      //console.log(val);
    });
  }

  
  public decline(){
    this.updateRequest();
    this.api.resolveFriendRequest("decline",this.resultRequest._id).then((val)=>{
     // console.log(val);
    });
  }

  //We have to update the friend_requests array of page-friend-request compoent
  private updateRequest(){
    //emitted event caught by friend-request html
    this.resultRequestChange.emit(this.resultRequest._id);
  }

  //to say pending friend request
  public haveSentFriendRequest : boolean = false;
  //to accept or decline the request
  public haveRecievedFriendRequest : boolean = false;
  //to show view profile button
  public isFriend : boolean = false;

  public updateSendMessageObject(id, name){
    //known as shorthand-object creation - means same as
    //{id : id, name:name}
    this.events.updateSendMessageObjectEvent.emit({id, name});
  }


}
