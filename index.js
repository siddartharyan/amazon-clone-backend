const express=require('express');
const mongoose=require('mongoose');
const app=express();
const bodyParser=require('body-parser');
const sendMail=require('./Mail.js');
const cors=require('cors');
const otpgenerator=require('otp-generator');
require("dotenv").config({path:__dirname+"/.env"});
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
const URL=process.env.MONGO_URL;
const port=process.env.PORT|| 8081;

mongoose.connect(URL,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useFindAndModify:true,
    useUnifiedTopology:true
})

const orgschema=new mongoose.Schema({
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
    },
    reset:{
        type:Object,
        default:''
    }
})


const duplicschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },password:{
        type:String,
        rqeuired:true
    },
    token:{
        type:Object,
        required:true
    }
})




const User=mongoose.model("User",orgschema);

const Duplicate=mongoose.model("Duplicate",duplicschema);



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
    User.find({email:req.body.email},(err,result)=>{
        if(err || result.length===0){
            Duplicate.find({email:req.body.email},(err,result)=>{
                const otp=otpgenerator.generate(6,{digits:true,upperCase:false,alphabets:false,specialChars:false})
                sendMail(req.body.email,otp);
                const user=new Duplicate({
                    name:req.body.name,
                    password:req.body.password,
                    email:req.body.email,
                    token:{
                        otp,
                        time:Date.now()
                    }})
                if(err || result.length===0){
                    user.save().then((result)=>res.json(result.id)).catch((err)=>res.status(400).json({message:err}));
                }
                else{
                    const id=result[0]._id;
                    const obj={
                        name:req.body.name,
                        password:req.body.password,
                        email:req.body.email,
                        token:{
                            otp,
                            time:Date.now()
                        }
                    }
                    Duplicate.findByIdAndUpdate(id,obj).then(()=>res.send(id)).then((err)=>res.status(400).send('server error'));
                }
            })
        }
        else{
            res.status(400).json({message:"user already exists"});
        }
        
    })
    
})


app.post("/activateaccount",(req,res)=>{
    const {id,otp}=req.body;
    Duplicate.findById(id,(err,result)=>{
        const token=result.token;
        const t=Date.now();
        if(token.otp!==otp){
            res.status(400).send("invalid otp");
            return;
        }
        if(t-token.time>3*60000){
            res.status(400).send("otp has expired");
            return;
        }
        const user=new User({
            name:result.name,
            email:result.email,
            password:result.password
        })
        user.save();
    })
    Duplicate.findByIdAndDelete(id).then(()=>res.send("successfully deleted")).then((err)=>res.status(404).send("error"));

})


app.post("/forgotpassword",(req,res)=>{
    const {email}=req.body;
    const otp=otpgenerator.generate(6,{digits:true,upperCase:false,alphabets:false,specialChars:false});
    User.find({email},(err,result)=>{
        if(err || result.length===0){
            res.status(400).send("This mailid is not registered");
            return;
        }
        const obj={
            otp,
            time:Date.now()
        }
        User.findByIdAndUpdate(result[0]._id,{reset:obj}).then(()=>res.send(result[0]._id)).catch((err)=>res.status(400).send("error"));
        sendMail(email,otp);
    })
})

app.post("/reset",(req,res)=>{
    const {id,otp,password}=req.body;
    User.findById(id,(err,result)=>{
        if(err || result.length===0){
            res.status(400).send("error");
            return;
        }
        const token=result.reset;
        const t=Date.now();
        if(token.otp!==otp){
            res.status(400).send("invalid otp");
            return;
        }
        if(t-token.time>3*60000){
            res.status(400).send("otp has expired");
            return;
        }
        User.findByIdAndUpdate(id,{reset:{},password}).then(()=>res.send("successfully updated")).catch((err)=>res.status(400).send("errot"));
    })
})



app.get("/",(req,res)=>{
    res.send("hello");
})
app.listen(port);
