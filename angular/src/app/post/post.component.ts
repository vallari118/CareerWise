import { Component, OnInit,Input } from '@angular/core';
import { ApiService } from '../api.service';
import { LocalStorageService } from '../local-storage.service';
import { EventEmitterService} from '../event-emitter.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {


  @Input() post;
  constructor(
    private api : ApiService,
    private storage : LocalStorageService,
    private events : EventEmitterService,
  ) { }

  ngOnInit(): void {
    
    //134hjihkj this string will be returned as hjihkj
    function removeLeadingNumbers(string){
      function isNumber(n){
        n = Number(n);
        if(!isNaN(n)){
          return true;
        }
      }

      if(string && isNumber(string[0])){
        string = removeLeadingNumbers(string.substr(1)); //it's a recursive function
      }

      return string;

    }

    

    this.fakeId = removeLeadingNumbers(this.post._id); //the output string will be given to fakeId

    if(this.post.content.length < 40 ){this.fontSize = 22;}
    if(this.post.content.length < 24 ){this.align = 'center';this.fontSize = 28;}
    if(this.post.content.length < 14 ){this.fontSize = 32;}
    if(this.post.content.length < 8 ){this.fontSize = 44;}
    if(this.post.content.length < 5 ){this.fontSize = 62;}

    this.userId = this.storage.getParsedToken()._id; //userId will be the logged in user
    if(this.post.likes.includes(this.userId)){
      this.liked = true;
    }

    let userDataEvent = this.events.getUserData.subscribe((user)=>{
      
    });

  }

  public fakeId : string = "fakeid"; //it will give unique id to each post for comments toggling
  public fontSize : number = 18;
  public align : string = "left";
  public liked : boolean = false;
  public userId : string = "";
  public comment : string = "";
  public applied : boolean = false;


  public likeButtonClicked(postid){

    let requestObject = {
      location : `users/like-unlike/${this.post.ownerid}/${this.post._id}`,
      method : "POST",
      
    }

    this.api.makeRequests(requestObject).then((val)=>{
      //if liking the already liked post
      //remove it from the likes array
      if(this.post.likes.includes(this.userId)){
        this.post.likes.splice(this.post.likes.indexOf(this.userId), 1);
        this.liked = false;

      }
      //if liking the post for the first time add that userId to likes array 
      else {
        this.post.likes.push(this.userId);
        this.liked = true;

      }
    });


   // console.log("Like or Dislike ,",postid);
  }

  public postComment(){
    if(this.comment.length == 0){ return;}
    //console.log("Post comment --", this.comment);

    let requestObject = {
      location : `users/post-comment/${this.post.ownerid}/${this.post._id}`,
      method : "POST",
      
      body : { content : this.comment}
    }

    
    this.api.makeRequests(requestObject).then((val)=>{
      // console.log(requestObject);
      // console.log(this.post)

      if(val.statusCode == 201){
        let newComment={
          ...val.comment,
          commenter_name: val.commenter.name,
          commenter_profile_image: val.commenter.profile_image
        }

        this.post.comments.push(newComment);
        this.comment="";
      }
    })

  }

  // public applyTo(){
  //   let requestObject = {
  //     location : `users/apply-to/${this.post.ownerid}/${this.post._id}`,
  //     method : "POST"
  //   } 

  //   this.api.makeRequests(requestObject).then((val)=>{
  //     if(val.statusCode == 201){
  //       //console.log(val);
  //     }
  //   })
  // }
  

}
