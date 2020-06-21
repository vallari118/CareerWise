//This service is for authentication of user

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor( private router : Router) { }

  canActivate(route : ActivatedRouteSnapshot, state: RouterStateSnapshot) : boolean {
    const loggedIn = this.isLoggedIn();

    //Checks if user is logged in or not
    let activate = loggedIn; //activate determines whether a user can access a page or not 
    let redirect = "/feed";

    if(route.data.loggedIn){
      activate = !activate; //If user is logged in then activate becomes false 
      redirect = "/register";
    }

    //If the user is not logged in it will return False
    //If user is logged in then !activate becomes true
    if(!activate){
      return true;
    } else{
      this.router.navigate([redirect]);
      return false;
    }

  }

  isLoggedIn(){
    return false;
  }
}
