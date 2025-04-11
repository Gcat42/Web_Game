// export class Room{
//     constructor(/*,imgSrc*/){
//         this./*,imgSrc*/ = /*,imgSrc*/;
//         this.gameObjects = 
//     }


// }

export class GameObject{
    constructor(name, imgSrc, type, x, y, w, h, solid, vis = true ){
        this.name = name;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.solid = solid;
        this.imgSrc = imgSrc;
        this.visible = vis;
        
    }

    draw(ctx){
        if(this.visible){
            ctx.fillStyle = 'rgb(247, 38, 6)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    setVis(vis = true){
        this.visible = vis;
    }
}

export class Drawing extends GameObject{ //stuff like rocks and what not
    constructor(name, imgSrc, x, y, w, h){
        super(name, imgSrc, "drawing", x, y, w, h, false, true);
    }
}

export class Interactable extends GameObject{
    constructor(name, imgSrc, x, y, w, h, cbX = x, cbY = y, cbW = w, cbH = h, vis = true){
        super(name, imgSrc, "interactable", x, y, w, h, false, vis);
        this.colBox = { //collision box
            x: cbX,
            y: cbY,
            width: cbW,
            height: cbH
        };
    }
}

export class Platform extends GameObject{
    constructor(name,imgSrc, x, y, w, h, cbX = x, cbY = y, cbW = w, cbH = h, vis = true){
        super(name,imgSrc, "platform", x, y, w, h, true, vis);
        this.colBox = { //collision box
            x: cbX,
            y: cbY,
            width: cbW,
            height: cbH
        };
    }
}