//This service is for creating end points 

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http : HttpClient) { }

  private baseUrl = "http://localhost:3000";
  private successHandler(value){ return value;}
  private errorHandler(error){ return error;}

  public makeRequests(requestObject) : any {
    let type = requestObject.type.toLowerCase();
    if(!type){ 
      return console.log("No type specified in the request object");
    }

    let body = requestObject.body || {};
    
    let location = requestObject.location;
    console.log("========");
    console.log("Location in api "+location);

    if(!location){ 
      return console.log("No location specified in the request object");
    }

    let url = `${this.baseUrl}/${location}`;

    let httpOptions = {};

    if(type == "get"){
      return this.http.get(url, httpOptions).toPromise().then(this.successHandler).catch(this.errorHandler);

    }

    if(type == "post"){
      return this.http.post(url, body).toPromise().then(this.successHandler).catch(this.errorHandler);

    }

    console.log("Could not make the request. Make sure a type of Get or Post is supplied");
  }

  
  

}
