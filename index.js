const express=require('express');
const mongoose=require('mongoose');
const app=express();
const bodyParser=require('body-parser');
const cors=require('cors');
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
const URL="mongodb+srv://admin:39DVzOdNfF6H269k@cluster0.fbxyg.mongodb.net/amazondb?retryWrites=true&w=majority";
const port=process.env.PORT|| 8081;


mongoose.connect(URL,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useFindAndModify:true,
    useUnifiedTopology:true
})

const schema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

const User=mongoose.model("User",schema);


app.post("/user",(req,res)=>{
    User.find({email:req.body.email,password:req.body.password},(err,result)=>{
        if(err || result.length===0){
            res.status(404).json({message:'user does not exist'});
            return;
        }
        res.json(result);
    })
})
app.post("/newuser",(req,res)=>{
    const user=new User({
        name:req.body.name,
        password:req.body.password,
        email:req.body.email
    })
    user.save().then((result)=>res.json({message:result})).catch((err)=>res.status(400).json({message:err}));
})
app.listen(port);
