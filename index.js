import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();


mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "Backend",
  })
  .then(() => {
    console.log("database Connected");
  })
  .catch((e) => {
    console.log(e);
  });

const userSchema = new mongoose.Schema({
  name: "string",
  email: "string",
  password : "string",
});

const User = mongoose.model("User", userSchema);

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req , res , next)=>{
  const token = req.cookies.token;


  if(token){
   const decoded =  jwt.verify(token ,  "yhudguyr");
   req.user = await User.findById(decoded._id);
   next();
  }
  else{
  res.redirect("/login");
  }
}

app.get("/", isAuthenticated , (req, res) => {
  res.render("logout", {name: req.user.name});
});

app.get("/login", (req, res) => {
  res.render("login");
});


app.get("/register", async (req, res) => {
  res.render("register");
});

app.post("/login" , async (req , res )=>{

const{email , password } = req.body;
let user = await User.findOne({email})
if (!user) return res.redirect("/register");

 const isMatch = await bcrypt.compare(password , user.password);

 if(!isMatch) return res.render("login" , {email , message:"Incorrect Passsword"});

 const token = jwt.sign({_id : user._id }, "yhudguyr");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");

})



app.post("/register", async (req, res) => {
 const {name,email , password} = req.body;
  
 let user = await User.findOne({email})
 if(user){
  return res.redirect("/login");
 }
 const hashedPassword = await bcrypt.hash(password , 10);
  
  user = await User.create({
    name , email  , password: hashedPassword,
  })

  const token = jwt.sign({_id : user._id }, "yhudguyr");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});


app.get("/logout", (req, res) => {
  res.cookie("token", null ,{
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});



app.listen(5000, () => {
  console.log("Server is Running");
});
