require('dotenv').config();

const express = require('express');
const PORT = process.env.PORT || 3000;

const userRouter = require('./routes/user.routes');
const indexRouter = require('./routes/index.routes');

const connectDb = require('./config/db');
connectDb();


const userModel = require('./models/user.model');
const cookieParser = require('cookie-parser');

const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');




const app = express();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const upload = multer({ storage: multer.memoryStorage() });


app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());


app.set('view engine', 'ejs');


app.use('/user', userRouter);
app.use('/', indexRouter);


app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).send('File too large. Max size is 10 MB.');
    }
    next(err);
});

app.listen(PORT, ()=>{
    console.log(`Server is running on the port ${PORT}`)
})

module.exports = {supabase, upload};