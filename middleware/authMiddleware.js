const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async(req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // this token starts with Bearer wored.
            // Ex: Bearer thisistoken;      'thisistoken' word is the token
            // this split within space and get the token into token variable
            token = req.headers.authorization.split(" ")[1];

            //decodes token id
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //get users without their passwords
            req.user = await User.findById(decoded.id).select("-password");
            next();

        } catch (error) {
            res.status(401).send({ message: "Not authorized, token failed"});
        }
    }

    // if not any token
    if(!token) {
        res.status(401).send({ message: "Not authorized, no token"});
    }
}

module.exports = protect