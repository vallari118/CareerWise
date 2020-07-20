//This service is for creating end points 

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { EventEmitterService } from './event-emitter.service'


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http : HttpClient,
    private storage : LocalStorageService,
    private events : EventEmitterService,
    
    ) { }

  private baseUrl = "http://localhost:3000";
  private successHandler(value){ return value;}
  private errorHandler(error){ return error;}

  public makeRequests(requestObject) : any {
    let method = requestObject.method.toLowerCase();
    if(!method){ 
      return console.log("No method specified in the request object");
    }

    let body = requestObject.body || {};
    
    let location = requestObject.location;
    // console.log("========");
    // console.log("Location in api "+location);

    if(!location){ 
      return console.log("No location specified in the request object");
    }

    let url = `${this.baseUrl}/${location}`;

    let httpOptions = {};

    //This provides the token for authorization to the middleware made in express
    if(this.storage.getToken()){
      
      httpOptions = {
        headers: new HttpHeaders({
          'Authorization' : `Bearer ${this.storage.getToken()}`
        })
      }
    }

    if(method == "get"){
      return this.http.get(url, httpOptions).toPromise().then(this.successHandler).catch(this.errorHandler);

    }

    if(method == "post"){
      
      return this.http.post(url, body, httpOptions).toPromise().then(this.successHandler).catch(this.errorHandler);

    }

    console.log("Could not make the request. Make sure a method of Get or Post is supplied");
  }

  public makeFriendRequest(to : String){
    let from = this.storage.getParsedToken()._id;

    let requestObject = {
      location : `users/make-friend-request/${from}/${to}`,
      method : "POST",
      authorize : true
    }

    return new Promise((resolve, reject)=>{
      this.makeRequests(requestObject).then((val)=>{
        
        if(val.statusCode === 201){
          this.events.onAlertEvent.emit("Successfully sent a friend request");
        }
        else {
          this.events.onAlertEvent.emit("Something went wrong. Perhaps you already sent friend request to this user.");
        }
        resolve(val);
      });
  
      //console.log(`User ${from} is sending friend to ${to}`);

    });
    
  }

  public resolveFriendRequest(resolution, id){
    let to = this.storage.getParsedToken()._id; //this is the id of the person who is logged in
                                                //To whom the friend request is sent
    
    return new Promise((resolve, reject)=>{
      let requestObject = {
        location : `users/resolve-friend-request/${id}/${to}?resolution=${resolution}`,
        method : "POST",
        authorize : true
  
      }
  
      this.makeRequests(requestObject).then((val)=>{
        if(val.statusCode === 201){
          this.events.updateNumOfFriendRequestsEvent.emit();
          let resolutioned = (resolution == "accept")  ? "accepted" : "declined";
          this.events.onAlertEvent.emit(`Successfully ${resolutioned} friend request`);

        }else {
          this.events.onAlertEvent.emit(`Something went wrong and we could not handle your friend request`);

        }
        resolve(val);
      });

    });
    
  }

  public sendMessage(sendMessageObject, showAlerts = true){
    if(!sendMessageObject.content && showAlerts){
      this.events.onAlertEvent.emit("Cannot send Empty Message. Please provide some content.");
      return;
    }

    let requestObject = {
      location : `users/send-message/${sendMessageObject.id}`,
      method : "POST",
      body : {
        content : sendMessageObject.content
      }
    }

    return new Promise((resolve, reject)=>{
      this.makeRequests(requestObject).then((val)=>{
       // console.log(val);
        if(val.statusCode == 201 && showAlerts){
          this.events.onAlertEvent.emit("Successfully sent message");
        }
        

        resolve(val);
        
      });
      
    });
    

  }

  public resetMessageNotification(){

    let requestObject = {
      location : "users/reset-message-notifications",
      method : "POST"
    }

    return new Promise((resolve, reject)=>{
      this.makeRequests(requestObject).then((val)=>{
        if(val.statusCode == 201){
          this.events.resetMessageNotificationsEvent.emit();
        }
        resolve();
      })
    });
  }

  
  

}
