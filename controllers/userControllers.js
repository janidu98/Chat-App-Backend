const generateToken = require("../config/generateToken");
const User = require("../models/userModel");

const registerUser = async(req, res) => {
    const { name, email, password, pic } = req.body;

    try {
        if(!name || !email || !password){
            return res.status(400).send({
                message: "All fields required",
            })
        }

        const userExists = await User.findOne({ email });
        
        if(userExists){
            return res.status(400).send({ message: "User already exists"});
        }

        const user = await User.create({
            name,
            email,
            password,
            pic,
        })

        if(user) {
            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                token: generateToken(user._id),
            })
        } else {
            return res.status(400).send({
                message: "Failed to create user"
            })
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ message: error.messaage });
    }
}

const authUser = async(req, res) => {
    const { email, password } = req.body;

    try {
        
        const user = await User.findOne({ email });

        if(user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                token: generateToken(user._id),
            })
        } else {
            res.status(401).send({ message: "Invalid email or password" })
        }

    } catch (error) {
        console.log(error.messaage);
        return res.status(500).send({ message: error.messaage });
    }
}

const allUsers = async(req, res) => {
    const keyword = req.query.search ? {
        $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
        ],
    }: {};

    // $ne = not equal
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
}

module.exports = {registerUser, authUser, allUsers}