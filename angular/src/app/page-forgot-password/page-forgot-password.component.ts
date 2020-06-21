import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';


@Component({
  selector: 'app-page-forgot-password',
  templateUrl: './page-forgot-password.component.html',
  styleUrls: ['./page-forgot-password.component.css']
})
export class PageForgotPasswordComponent implements OnInit {

  constructor(private api : ApiService) { }

  ngOnInit(): void {
  }

  public formError = "";

  public credentials = {
    email : ''
  };

  public formSubmit(){
    this.formError = "";

    if(
      !this.credentials.email
      
    ){
      return this.formError="Email is required";
    }

    if(!this.formError){
      return this.forgot();
    }
    
  }

  private forgot(){
    let requestObject = {
      type : "POST",
      location : "forgot",
      body : this.credentials
    }

    this.api.makeRequests(requestObject).then((val)=>{
      if(val.msg){this.formError = val.msg;}
      console.log(val.token)

    });
  }
}
