export function AutoUnsubscribe(constructor){
    console.log("Under autounsubscribe");
    const original = constructor.prototype.ngOnDestroy;
    
    console.log(original);

    constructor.prototype.ngOnDestroy = function(){
        console.log("Under");
        for(let prop in this){
            console.log("Inside 1st for loop");
            if(prop == "subscriptions"){
                for(let sub of this[prop]){
                    console.log("Inside 2nd for loop");
                    if(sub && (typeof sub.unsubscribe === "function")){
                        sub.unsubscribe();
                    }
                }
                break;
            }
        }
        original && typeof original === "function" && original.apply(this, arguments);
    };


}

