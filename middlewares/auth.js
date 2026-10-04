const jwt = require('jsonwebtoken');

//creating a middleware for auth
function auth(req, res, next){
    const token = req.cookies.token;

    if(!token){
        return res.status(400).json({
            message: "Unauthorized"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        return next();

    }catch(err){
        res.status(400).json({
            message: "Unauthorized"
        })
    }
}

module.exports = auth;