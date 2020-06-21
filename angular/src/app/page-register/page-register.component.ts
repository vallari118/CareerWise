import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-page-register',
  templateUrl: './page-register.component.html',
  styleUrls: ['./page-register.component.css']
})
export class PageRegisterComponent implements OnInit {

  constructor(private api : ApiService) { }

  ngOnInit(): void {
  }

  public formError = ""; //Itb will set the error message

  //required credentials
  public credentials = {
    first_name : '',
    last_name : '',
    email : '',
    password : '',
    password_confirm : ''
  };

  //Validation of form is done
  public formSubmit() {

    this.formError = "";

    if(
      !this.credentials.first_name ||
      !this.credentials.last_name ||
      !this.credentials.email ||
      !this.credentials.password ||
      !this.credentials.password_confirm 
    ) {
      return this.formError = "All Fields are required";
    }

    // var re = new RegExp(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
    // if(!re.test(this.credentials.email)){
    //   return this.formError= "Please enter a valid email address";
    // }

    if(this.credentials.password !== this.credentials.password_confirm){
      return this.formError = "Passwords don't match.";
    }

    
    this.register();
  }

  //This method calls the API
  private register(){
    console.log(this.credentials);

    let requestObject = {
      type : "POST",
      location : "users/register",
      body : this.credentials
    };

    this.api.makeRequests(requestObject).then((val) =>{
      //IF there is error msg from controller it will be assigned to formError so that alert box can be generated
      if(val.message){this.formError = val.message;}
      console.log(val);

    });

    console.log("Register!");
  }

}
