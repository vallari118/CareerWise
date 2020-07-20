import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { LocalStorageService } from '../local-storage.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-page-register',
  templateUrl: './page-register.component.html',
  styleUrls: ['./page-register.component.css']
})
export class PageRegisterComponent implements OnInit {

  constructor(private api : ApiService, private storage : LocalStorageService,
    private router : Router,
    private title : Title) { }

  ngOnInit(): void {
    this.title.setTitle("Career Wise - Register");
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

    var re = new RegExp(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
    if(!re.test(this.credentials.email)){
      return this.formError= "Please enter a valid email address";
    }

    if(this.credentials.password !== this.credentials.password_confirm){
      return this.formError = "Passwords don't match.";
    }

    if(this.credentials.password.length <8 && this.credentials.password_confirm.length <8){
      return this.formError = "Password must be greater than 8 characters";
    }
    
    this.register();
  }

  //This method calls the API
  private register(){
    //console.log(this.credentials);

    let requestObject = {
      method : "POST",
      location : "users/register",
      body : this.credentials
    };

    this.api.makeRequests(requestObject).then((val) =>{
      if(val.token){
        this.storage.setToken(val.token);
        this.router.navigate(['/']);
        return;
      }
      //IF there is error msg from controller it will be assigned to formError so that alert box can be generated
      if(val.message){this.formError = val.message;}
      //console.log(val);

    });

    //console.log("Register!");
  }

}
