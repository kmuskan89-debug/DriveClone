require('dotenv').config();

const express = require('express');
const PORT = process.env.PORT;
const userRouter = require('./routes/user.routes');
const connectDb = require('./config/db');
const userModel = require('./models/user.model');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index.routes');



connectDb();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());


app.set('view engine', 'ejs');

app.get('/', (req, res)=>{
    res.render('index');
})

app.use('/user', userRouter);
app.use('/', indexRouter);

app.listen(3000, ()=>{
    console.log(`Server is running on the port ${PORT}`)
})