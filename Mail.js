const nodemailer=require('nodemailer');
require("dotenv").config({path:__dirname+"/.env"});
const {google}=require('googleapis');
const ID=process.env.CLIENT_ID;
const SECRET=process.env.CLIENT_SECRET;
const URI=process.env.REDIRECT_URI;
const TOKEN=process.env.REFRESH_TOKEN;
const oAuth2Client=new google.auth.OAuth2(ID,SECRET,URI);
oAuth2Client.setCredentials({refresh_token:TOKEN});
async function sendMail(email,code){
    try{
        const ACCESS_TOKEN=await oAuth2Client.getAccessToken();
        const transport=nodemailer.createTransport({
            service:'gmail',
            auth:{
                type:'OAuth2',
                user:'amazonfake199@gmail.com',
                clientId:ID,
                clientSecret:SECRET,
                refreshToken:TOKEN,
                accessToken:ACCESS_TOKEN
            }
        })
        const mailOptions={
            from:'amazonfake199@gmail.com',
            to:email,
            subject:'Amazon Verification',
            text:`The Verification code is ${code}`
        }
       const result=await transport.sendMail(mailOptions);
       return result; 
    }catch(error){
        return error;
    }
}
module.exports=sendMail;