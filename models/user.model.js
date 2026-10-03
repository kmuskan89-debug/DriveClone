const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: [3, 'username must be atleast 3 characters long'],
        lowercase: true,
    },
    email : {
        type: String,
        required: true,
        lowercase: true,
    },
    password: {
        type: String, 
        required: true,
        minlength: [8, 'Password must be atleast 8 characters long']
    }
})

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;